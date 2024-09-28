import type {
	APIMessage,
	APIState,
	ChoiceParam,
	Features,
	GenArtAPI,
	ImageParam,
	Maybe,
	MessageType,
	MessageTypeMap,
	NotifyType,
	ParamChangeMsg,
	ParamErrorMsg,
	ParamImpl,
	ParamSpecs,
	ParamValue,
	PlatformAdapter,
	PRNG,
	RampParam,
	RandomFn,
	RangeParam,
	SetFeaturesMsg,
	SetParamsMsg,
	StateChangeMsg,
	TextParam,
	TimeProvider,
	UpdateFn,
	WeightedChoiceParam,
} from "./api.js";
import * as math from "./math.js";
import * as params from "./params.js";
import { timeProviderRAF } from "./time/raf.js";
import * as utils from "./utils.js";

const { isNumber, isString, isNumericArray } = utils;
const { clamp, clamp01, mix, norm, round, parseNum } = math;

class API implements GenArtAPI {
	// auto-generated instance ID
	id = Math.floor(Math.random() * 1e12).toString(36);
	protected _adapter?: PlatformAdapter;
	protected _time: TimeProvider = timeProviderRAF();
	protected _prng?: PRNG;
	protected _update?: UpdateFn;
	protected _state: APIState = "init";
	protected _features?: Features;
	protected _params: Maybe<ParamSpecs>;
	protected _paramTypes: Record<string, ParamImpl> = {
		choice: {
			valid: (spec, _, value) =>
				!!(<ChoiceParam<any>>spec).options.find(
					(x) => (Array.isArray(x) ? x[0] : x) === value
				),
			randomize: (spec, rnd) => {
				const opts = (<ChoiceParam<any>>spec).options;
				const value = opts[(rnd() * opts.length) | 0];
				return Array.isArray(value) ? value[0] : value;
			},
		},
		color: {
			valid: (_, __, value) =>
				isString(value) && /^#?[0-9a-f]{6}$/.test(value),
			coerce: (_, value) => (value[0] !== "#" ? "#" + value : value),
			randomize: (_, rnd) => "#" + utils.u24((rnd() * 0x1_00_00_00) | 0),
		},
		date: {
			valid: (_, __, value) =>
				value instanceof Date ||
				isNumber(value) ||
				(isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value)),
			coerce: (_, value) =>
				isNumber(value)
					? new Date(value)
					: isString(value)
					? new Date(Date.parse(value))
					: value,
		},
		datetime: {
			valid: (_, __, value) =>
				value instanceof Date ||
				isNumber(value) ||
				(isString(value) &&
					/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[-+]\d{2}:\d{2})$/.test(
						value
					)),
			coerce: (_, value) =>
				isNumber(value)
					? new Date(value)
					: isString(value)
					? new Date(Date.parse(value))
					: value,
		},
		img: {
			valid: (spec, _, value) => {
				const { width, height } = <ImageParam>spec;
				return isNumericArray(value) && value.length == width * height;
			},
		},
		ramp: {
			valid: (_, key, value) =>
				key === "mode"
					? ["linear", "smooth", "exp"].includes(value)
					: Array.isArray(value) && value.every(isNumericArray),
			update: (spec, key, value) => {
				if (key === "mode") {
					(<RampParam>spec).mode = value;
				} else {
					(<RampParam>spec).stops = value;
				}
			},
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
							exp: () =>
								mix(
									a[1],
									b[1],
									math.easeInOut5(norm(t, a[0], b[0]))
								),
							linear: () => math.fit(t, a[0], b[0], a[1], b[1]),
							smooth: () =>
								mix(
									a[1],
									b[1],
									math.smoothstep01(norm(t, a[0], b[0]))
								),
					  }[mode || "linear"]();
			},
		},
		range: {
			valid: (spec, _, value) => {
				const { min, max } = <RangeParam>spec;
				return isNumber(value) && value >= min && value <= max;
			},
			coerce: (spec, value) => {
				const $spec = <RangeParam>spec;
				return clamp(
					round(value ?? $spec.default, $spec.step || 1),
					$spec.min,
					$spec.max
				);
			},
			randomize: (spec, rnd) => {
				const { min, max, step } = <RangeParam>spec;
				return clamp(round(mix(min, max, rnd()), step || 1), min, max);
			},
		},
		text: {
			valid: (spec, _, value) => {
				if (!isString(value)) return false;
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
		time: {
			valid: (_, __, value) =>
				isNumericArray(value) ||
				(isString(value) &&
					/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value)),
			coerce: (_, value) =>
				isString(value) ? value.split(":").map(parseNum) : value,
			randomize: (_, rnd) => [
				(rnd() * 24) | 0,
				(rnd() * 60) | 0,
				(rnd() * 24) | 0,
			],
		},
		toggle: {
			valid: (_, __, value) =>
				isString(value)
					? /^(true|false|0|1)$/.test(value)
					: isNumber(value) || typeof value === "boolean",
			coerce: (_, value) =>
				value === "true" || value === "1"
					? true
					: value === "false" || value === "0"
					? false
					: !!value,
			randomize: (_, rnd) => rnd() < 0.5,
		},
		weighted: {
			valid: (spec, _, value) =>
				!!(<WeightedChoiceParam<any>>spec).options.find(
					(x) => x[1] === value
				),
			randomize: (spec, rnd) => {
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
			valid: (_, __, value) => isNumericArray(value) && value.length == 2,
			coerce: (_, value) => [clamp01(value[0]), clamp01(value[1])],
			randomize: (_, rnd) => [rnd(), rnd()],
		},
	};

	readonly math = math;
	readonly params = params;
	readonly utils = utils;

	constructor() {
		window.addEventListener("message", (e) => {
			const data = e.data;
			// console.log("genart msg", data);
			if (!this.isRecipient(e) || data?.__self) return;
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
					this.setParamValue(data.paramID, data.value, data.key);
					break;
				case "genart:randomizeparam":
					this.randomizeParamValue(data.paramID);
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
		return (this._prng = this.ensureAdapter().prng);
	}

	get state() {
		return this._state;
	}

	get paramSpecs() {
		return this._params;
	}

	get adapter() {
		return this._adapter;
	}

	get time() {
		return this._time;
	}

	registerParamType(type: string, impl: ParamImpl) {
		if (this._paramTypes[type])
			console.warn("overriding impl for param type:", type);
		this._paramTypes[type] = impl;
	}

	async setParams<P extends ParamSpecs>(params: P) {
		// validate param declarations
		for (let id in params) {
			const param = params[id];
			if (param.default == null) {
				const impl = this.ensureParamImpl(param.type);
				if (impl.randomize) {
					param.default = impl.randomize(param, this.random.rnd);
				} else {
					throw new Error(`missing default value for param: ${id}`);
				}
			}
		}
		this._params = params;
		// augment params with platform overrides
		if (this._adapter) {
			await this._adapter.setParams?.(params);
			await this.updateParams();
		}
		this.notifySetParams();
		return <K extends keyof P>(id: K, t?: number, rnd?: PRNG["rnd"]) =>
			this.getParamValue<P, K>(id, t, rnd);
	}

	setFeatures(features: Features): void {
		this._features = features;
		this.emit<SetFeaturesMsg>({ type: "genart:setfeatures", features });
	}

	async setAdapter(adapter: PlatformAdapter) {
		console.log("set adapter", adapter);
		this._adapter = adapter;
		if (this._params) {
			await this._adapter.setParams?.(this._params);
			await this.updateParams();
			this.notifySetParams();
		}
		this.notifyReady();
	}

	waitForAdapter() {
		return this.waitFor("_adapter");
	}

	setTimeProvider(time: TimeProvider) {
		this._time = time;
		this.notifyReady();
	}

	waitForTimeProvider() {
		return this.waitFor("_time");
	}

	setUpdate(fn: UpdateFn) {
		this._update = fn;
		this.notifyReady();
	}

	async updateParams(notify: NotifyType = "none") {
		if (!this._adapter) return;
		for (let id in this._params) {
			const spec = this._params[id];
			const result = await this._adapter.updateParam(id, spec);
			if (!result) continue;
			const { value, update } = result;
			this.setParamValue(
				id,
				value,
				undefined,
				value != null || update ? notify : "none"
			);
		}
	}

	setParamValue(
		id: string,
		value: any,
		key?: string,
		notify: NotifyType = "all"
	) {
		const { spec, impl } = this.ensureParam(id);
		if (value != null) {
			if (!impl.valid(spec, key, value)) {
				this.paramError(id);
				return;
			}
			impl.update
				? impl.update(spec, key, value)
				: (spec.value = impl.coerce ? impl.coerce(spec, value) : value);
		}
		this.emit<ParamChangeMsg>(
			{
				type: "genart:paramchange",
				paramID: id,
				spec,
				__self: true,
			},
			notify
		);
	}

	randomizeParamValue(
		id: string,
		rnd: RandomFn = Math.random,
		notify: NotifyType = "all"
	) {
		const { spec, impl } = this.ensureParam(id);
		if (impl.randomize) {
			this.setParamValue(
				id,
				impl.randomize(spec, rnd),
				undefined,
				notify
			);
		}
	}

	getParamValue<T extends ParamSpecs, K extends keyof T>(
		id: K,
		t = 0,
		rnd?: PRNG["rnd"]
	): ParamValue<T[K]> {
		const {
			spec,
			impl: { randomize, read },
		} = this.ensureParam(<string>id);
		return rnd && randomize
			? randomize(spec, rnd)
			: read
			? read(spec, t)
			: spec.value ?? spec.default;
	}

	paramError(paramID: string) {
		this.emit<ParamErrorMsg>({ type: "genart:paramerror", paramID });
	}

	on<T extends MessageType>(
		type: T,
		listener: (e: MessageTypeMap[T]) => void
	) {
		window.addEventListener("message", (e) => {
			if (this.isRecipient(e) && e.data?.type === type) listener(e.data);
		});
	}

	emit<T extends APIMessage>(e: T, notify: NotifyType = "all") {
		if (notify === "none") return;
		if (this.id) e.apiID = this.id;
		if (notify === "all" || notify === "self") window.postMessage(e, "*");
		if ((notify === "all" && parent !== window) || notify === "parent")
			parent.postMessage(e, "*");
	}

	start(resume = false) {
		if (this._state == "play") return;
		if (this._state !== "ready" && this._state !== "stop")
			throw new Error(`can't start in state: ${this._state}`);
		this.setState("play");
		let isFirst = !resume;
		const update = () => {
			if (this._state != "play") return;
			if (
				this._update!.call(
					null,
					...this._time![isFirst ? "now" : "tick"]()
				)
			) {
				this._time!.next(update);
			} else {
				this.stop();
			}
			isFirst = false;
		};
		if (!resume) this._time!.start();
		update();
		this.emit({
			type: `genart:${resume ? "resume" : "start"}`,
			__self: true,
		});
	}

	stop() {
		if (this._state !== "play") return;
		this.setState("stop");
		this.emit({ type: `genart:stop`, __self: true });
	}

	capture(el?: HTMLCanvasElement | SVGElement) {
		this._adapter?.capture(el);
		this.emit({ type: `genart:capture`, __self: true }, "parent");
	}

	protected setState(newState: APIState) {
		this._state = newState;
		this.emit<StateChangeMsg>({
			type: "genart:statechange",
			state: newState,
			__self: true,
		});
	}

	protected ensureAdapter() {
		if (!this._adapter) throw new Error("missing platform adapter");
		return this._adapter;
	}

	protected ensureTimeProvider() {
		if (!this._time) throw new Error("missing time provider");
		return this._time;
	}

	protected ensureParams() {
		if (!this._params) throw new Error("no params defined");
		return this._params;
	}

	protected ensureParam(id: string) {
		const spec = this.ensureParams()[id];
		if (!spec) throw new Error(`unknown param: ${id}`);
		const impl = this.ensureParamImpl(spec.type);
		return { spec, impl };
	}

	protected ensureParamImpl(type: string) {
		const impl = this._paramTypes[type];
		if (!impl) throw new Error(`unknown param type: ${type}`);
		return impl;
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

	/**
	 * Emits {@link SetParamsMsg} message (only iff the params specs aren't
	 * empty).
	 */
	protected notifySetParams() {
		if (this._params && Object.keys(this._params).length) {
			this.emit<SetParamsMsg>({
				type: "genart:setparams",
				__self: true,
				params: this._params,
			});
		}
	}

	protected notifyReady() {
		if (
			this._state === "init" &&
			this._adapter &&
			this._time &&
			this._update
		)
			this.setState("ready");
	}

	/**
	 * Returns true if this API instance is the likely recipient for a received
	 * IPC message.
	 *
	 * @param event
	 */
	protected isRecipient({ data }: MessageEvent): boolean {
		return (
			data != null &&
			typeof data === "object" &&
			(!this.id || this.id === data.apiID)
		);
	}
}

globalThis.$genart = new API();
