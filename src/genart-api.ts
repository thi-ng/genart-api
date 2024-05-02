import type {
	APIEvent,
	EventType,
	EventTypeMap,
	GenArtAPI,
	Param,
	ParamChangeEvent,
	ParamImpl,
	ParamSpecs,
	ParamValue,
	PlatformAdapter,
	PRNG,
	RampParam,
	RangeParam,
	RunState,
	TimeProvider,
	UpdateFn,
	WeightedChoiceParam,
} from "./api.js";
import * as math from "./math.js";
import * as params from "./params.js";
import { timeProviderRAF } from "./time/time-raf.js";

class API implements GenArtAPI {
	_id?: string;
	protected _adapter?: PlatformAdapter;
	protected _time: TimeProvider = timeProviderRAF();
	protected _prng?: PRNG;
	protected _update?: UpdateFn;
	protected _state: RunState = "init";
	protected _params: Record<string, Param<any>> = {};
	protected _paramTypes: Record<string, ParamImpl> = {
		range: (spec) => {
			const $spec = <RangeParam>spec;
			return math.clamp(
				math.round($spec.value ?? $spec.default, $spec.step || 1),
				$spec.min,
				$spec.max
			);
		},
		ramp: (spec, t) => {
			const { stops, mode } = <RampParam>spec;
			let n = stops.length;
			let i = n;
			for (; i-- > 0; ) {
				if (t >= stops[i][0]) break;
			}
			n--;
			return i < 0
				? stops[0][1]
				: i >= n
				? stops[n][1]
				: {
						linear: (
							stops: [number, number][],
							i: number,
							t: number
						) => {
							const a = stops[i];
							const b = stops[i + 1];
							return math.fit(t, a[0], b[0], a[1], b[1]);
						},
						smooth: (
							stops: [number, number][],
							i: number,
							t: number
						) => {
							const a = stops[i];
							const b = stops[i + 1];
							return math.mix(
								a[1],
								b[1],
								math.smoothStep01(math.norm(t, a[0], b[0]))
							);
						},
				  }[mode || "linear"](stops, i, t);
		},
		weighted: (spec, _, rnd) => {
			let {
				options,
				total,
				default: fallback,
			} = <WeightedChoiceParam<any>>spec;
			const r = rnd() * total;
			for (let i = 0, n = options.length; i < n; i++) {
				total -= options[i][0];
				if (total <= r) return options[i][1];
			}
			return fallback;
		},
	};

	readonly math = math;
	readonly params = params;

	constructor() {
		window.addEventListener("message", (e) => {
			console.log("genart msg", e.data);
			if (
				e.data == null ||
				typeof e.data !== "object" ||
				(this._id && e.data.id !== this._id) ||
				e.data.__self
			)
				return;
			switch (<EventType>e.data.type) {
				case "genart:start":
					this.start();
					break;
				case "genart:resume":
					this.start(true);
					break;
				case "genart:stop":
					this.stop();
					break;
			}
		});
	}

	get mode() {
		return this._adapter?.mode || "play";
	}

	get screen() {
		return (
			this._adapter?.screen || {
				width: window.innerWidth,
				height: window.innerHeight,
				dpr: window.devicePixelRatio,
			}
		);
	}

	get random() {
		if (this._prng) return this._prng;
		this.ensureAdapter();
		return (this._prng = this._adapter!.prng);
	}

	get state() {
		return this._state;
	}

	registerParamType(type: string, impl: ParamImpl) {
		if (this._paramTypes[type])
			console.warn("overriding impl for param type:", type);
		this._paramTypes[type] = impl;
	}

	setParams<P extends ParamSpecs>(specs: P) {
		this._params = specs;
		if (this._adapter) this.updateParams();
		return <K extends keyof P>(id: K, t?: number) =>
			this.getParamValue<P, K>(id, t);
	}

	setAdapter(adapter: PlatformAdapter) {
		this._adapter = adapter;
		this.updateParams();
		if (this._state === "init" && this._time) this._state = "ready";
	}

	waitForAdapter() {
		return this.waitFor("_adapter");
	}

	setTimeProvider(time: TimeProvider) {
		this._time = time;
		if (this._state === "init" && this._adapter) this._state = "ready";
	}

	waitForTimeProvider() {
		return this.waitFor("_time");
	}

	setUpdate(fn: UpdateFn) {
		this._update = fn;
	}

	updateParams(notify = false) {
		if (!this._adapter) return;
		for (let id in this._params) {
			this.updateParam(id, this._params[id], notify);
		}
	}

	updateParam(id: string, spec: Param<any>, notify = true) {
		this._params[id] = spec;
		const update = this._adapter?.updateParam(id, spec);
		if (notify && update) {
			if (spec.update === "reload") location.reload();
			else
				this.emit<ParamChangeEvent>({
					type: "genart:paramchange",
					paramID: id,
					spec,
					__self: true,
				});
		}
	}

	getParamValue<T extends ParamSpecs, K extends keyof T>(
		id: K,
		t = 0
	): ParamValue<T[K]> {
		const spec = this._params[<string>id];
		if (!spec) throw new Error(`unknown param: ${<string>id}`);
		const impl = this._paramTypes[spec.type];
		return impl
			? impl(spec, t, this.random.rnd)
			: spec.value ?? spec.default;
	}

	on<T extends EventType>(type: T, listener: (e: EventTypeMap[T]) => void) {
		window.addEventListener("message", (e) => {
			// console.log("msg", e.data);
			if (e.data?.type === type) listener(e.data);
		});
	}

	emit<T extends APIEvent>(e: T, target: "self" | "parent" | "all" = "all") {
		if (this._id) e.id = this._id;
		if (target === "all" || target === "self") window.postMessage(e, "*");
		if ((target === "all" && parent !== window) || target === "parent")
			parent.postMessage(e, "*");
	}

	start(resume = false) {
		if (this._state == "play") return;
		if (this._state !== "ready" && this._state !== "stop")
			throw new Error(`can't start in state: ${this._state}`);
		if (!this._update) throw new Error("missing update function");
		this.ensureTimeProvider();
		this._state = "play";
		const update = () => {
			if (this._state != "play") return;
			this._update!.call(null, ...this._time!.tick());
			this._time!.next(update);
		};
		resume ? update() : this._time!.start(update);
		this.emit({
			type: `genart:${resume ? "resume" : "start"}`,
			__self: true,
		});
	}

	stop() {
		if (this._state !== "play") return;
		this._state = "stop";
		this.emit({ type: `genart:stop`, __self: true });
	}

	capture() {
		this._adapter?.capture();
		this.emit({ type: `genart:capture`, __self: true }, "parent");
	}

	protected ensureAdapter() {
		if (!this._adapter) throw new Error("missing platform adapter");
	}

	protected ensureTimeProvider() {
		if (!this._time) throw new Error("missing time provider");
	}

	protected waitFor(type: "_adapter" | "_time") {
		return this[type]
			? Promise.resolve()
			: new Promise<void>((resolve) => {
					const check = () => {
						if (this[type]) resolve();
						else {
							setTimeout(check, 0);
						}
					};
					check();
			  });
	}
}

globalThis.$genart = new API();
