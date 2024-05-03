import type {
	APIMessage,
	ChoiceParam,
	GenArtAPI,
	MessageType,
	MessageTypeMap,
	NotifyType,
	Param,
	ParamChangeMsg,
	ParamImpl,
	ParamSpecs,
	ParamValue,
	PlatformAdapter,
	PRNG,
	RampParam,
	RangeParam,
	RunState,
	SetParamsMsg,
	TextParam,
	TimeProvider,
	UpdateFn,
	WeightedChoiceParam,
} from "./api.js";
import * as math from "./math.js";
import * as params from "./params.js";
import { timeProviderRAF } from "./time/time-raf.js";
import * as utils from "./utils.js";
import { isNumber, isString } from "./utils.js";

class API implements GenArtAPI {
	_id?: string;
	protected _adapter?: PlatformAdapter;
	protected _time: TimeProvider = timeProviderRAF();
	protected _prng?: PRNG;
	protected _update?: UpdateFn;
	protected _state: RunState = "init";
	protected _params: Record<string, Param<any>> = {};
	protected _paramTypes: Record<string, ParamImpl> = {
		choice: {
			valid(value, spec) {
				return (<ChoiceParam<any>>spec).options.find(
					(x) => (Array.isArray(x) ? x[0] : x) === value
				);
			},
		},
		color: {
			valid: (value) => /^#?[0-9a-f]{6}$/.test(value),
			coerce: (value) => (value[0] !== "#" ? "#" + value : value),
		},
		ramp: {
			valid: (value) => utils.isNumber(value),
			read: (spec, t) => {
				const { stops, mode } = <RampParam>spec;
				let n = stops.length;
				let i = n;
				for (; i-- > 0; ) {
					if (t >= stops[i][0]) break;
				}
				n--;
				const a = stops[i];
				const b = stops[i + 1];
				return i < 0
					? stops[0][1]
					: i >= n
					? stops[n][1]
					: {
							linear: () => math.fit(t, a[0], b[0], a[1], b[1]),
							smooth: () =>
								math.mix(
									a[1],
									b[1],
									math.smoothStep01(math.norm(t, a[0], b[0]))
								),
					  }[mode || "linear"]();
			},
		},
		range: {
			valid: (value, spec) => {
				const { min, max } = <RangeParam>spec;
				return !isNaN(value) && value >= min && value <= max;
			},
			coerce(value, spec) {
				const $spec = <RangeParam>spec;
				return math.clamp(
					math.round(value ?? $spec.default, $spec.step || 1),
					$spec.min,
					$spec.max
				);
			},
		},
		text: {
			valid: (value, spec) => {
				const { min, max, match } = <TextParam>spec;
				if (match) {
					const regexp = isString(match) ? new RegExp(match) : match;
					if (!regexp.test(value)) return false;
				}
				return (
					(!min || value.length >= min) &&
					(!max || value.length <= max)
				);
			},
		},
		weighted: {
			valid: () => false,
			read: (spec, _, rnd) => {
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
		},
		xy: {
			valid: (value) =>
				Array.isArray(value) &&
				value.length == 2 &&
				value.every(isNumber),
			coerce: (value) => [math.clamp01(value[0]), math.clamp01(value[1])],
		},
	};

	readonly math = math;
	readonly params = params;
	readonly utils = utils;

	constructor() {
		window.addEventListener("message", ({ data }) => {
			console.log("genart msg", data);
			if (
				data == null ||
				typeof data !== "object" ||
				(this._id && data.apiID !== this._id) ||
				data.__origin === "api"
			)
				return;
			switch (<MessageType>data.type) {
				case "genart:start":
					this.start();
					break;
				case "genart:resume":
					this.start(true);
					break;
				case "genart:stop":
					this.stop();
					break;
				case "genart:setparamvalue":
					this.setParamValue(data.paramID, data.value, true);
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

	setParams<P extends ParamSpecs>(params: P) {
		this._params = params;
		if (this._adapter) this.updateParams();
		this.notifySetParams();
		return <K extends keyof P>(id: K, t?: number) =>
			this.getParamValue<P, K>(id, t);
	}

	setAdapter(adapter: PlatformAdapter) {
		this._adapter = adapter;
		this.updateParams();
		this.notifySetParams();
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
			const spec = this._params[id];
			const result = this._adapter?.updateParam(id, spec);
			console.log("api update param", id, result, notify);
			if (!result) continue;
			const { value, update } = result;
			this.setParamValue(id, value, notify && (value != null || update));
		}
	}

	setParamValue(id: string, value: any, notify = false) {
		console.log("set param", id, value, notify);
		const spec = this._params[id];
		if (!spec) throw new Error(`unknown param: ${id}`);
		const impl = this._paramTypes[spec.type];
		if (!impl) throw new Error(`unknown param type: ${spec.type}`);
		if (value != null) {
			if (!impl.valid(value, spec)) {
				utils.illegalParam(id);
				return;
			}
			spec.value = impl.coerce ? impl.coerce(value, spec) : value;
		}
		if (notify) {
			this.emit<ParamChangeMsg>({
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
		const impl = this._paramTypes[spec.type].read;
		return impl
			? impl(spec, t, this.random.rnd)
			: spec.value ?? spec.default;
	}

	on<T extends MessageType>(
		type: T,
		listener: (e: MessageTypeMap[T]) => void
	) {
		window.addEventListener("message", (e) => {
			if (e.data?.type === type) listener(e.data);
		});
	}

	emit<T extends APIMessage>(e: T, notify: NotifyType = "all") {
		if (this._id) e.apiID = this._id;
		if (notify === "all" || notify === "self") window.postMessage(e, "*");
		if ((notify === "all" && parent !== window) || notify === "parent")
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

	protected notifySetParams() {
		if (Object.keys(this._params).length) {
			this.emit<SetParamsMsg>({
				type: "genart:setparams",
				__self: true,
				params: this._params,
			});
		}
	}
}

globalThis.$genart = new API();
