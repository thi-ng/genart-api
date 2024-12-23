import type {
	AnimFrameMessage,
	APIMessage,
	APIState,
	CaptureMessage,
	ChoiceParam,
	GenArtAPI,
	GenArtAPIOpts,
	ImageParam,
	InfoMessage,
	Maybe,
	MessageType,
	MessageTypeMap,
	NestedParam,
	NestedParamSpecs,
	NotifyType,
	NumListParam,
	Param,
	ParamChangeMessage,
	ParamErrorMessage,
	ParamImpl,
	ParamsMessage,
	ParamSpecs,
	ParamValue,
	PlatformAdapter,
	PRNG,
	RampParam,
	RandomFn,
	RangeParam,
	ResumeMessage,
	StartMessage,
	StateChangeMessage,
	StopMessage,
	StringListParam,
	TextParam,
	TimeProvider,
	Traits,
	TraitsMessage,
	UpdateFn,
	VectorParam,
	WeightedChoiceParam,
} from "./api.js";
import * as math from "./math.js";
import * as params from "./params.js";
import * as prng from "./prng.js";
import { debugTimeProvider } from "./time/debug.js";
import { timeProviderOffline } from "./time/offline.js";
import { timeProviderRAF } from "./time/raf.js";
import * as utils from "./utils.js";

const { ensure, isNumber, isNumericArray, isString } = utils;
const { clamp, clamp01, mix, norm, parseNum, round } = math;

const PARAM_DEFAULTS: Partial<Param<any>> = {
	edit: "protected",
	group: "main",
	order: 0,
	randomize: true,
	update: "event",
	widget: "default",
};

class API implements GenArtAPI {
	protected _opts: GenArtAPIOpts = {
		// auto-generated instance ID
		id: Math.floor(Math.random() * 1e12).toString(36),
		allowExternalConfig: false,
		notifyFrameUpdate: false,
	};

	protected _adapter?: PlatformAdapter;
	protected _time: TimeProvider = timeProviderRAF();
	protected _prng?: PRNG;
	protected _update?: UpdateFn;
	protected _state: APIState = "init";
	protected _traits?: Traits;
	protected _params: Maybe<ParamSpecs>;
	protected _paramTypes: Record<string, ParamImpl> = {
		choice: {
			validate: (spec, value) =>
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
			validate: (_, value) =>
				isString(value) && /^#?[0-9a-f]{6}$/.test(value),
			coerce: (_, value) => (value[0] !== "#" ? "#" + value : value),
			randomize: (_, rnd) => "#" + utils.u24((rnd() * 0x1_00_00_00) | 0),
		},
		date: {
			validate: (_, value) =>
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
			validate: (_, value) =>
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
			validate: (spec, value) => {
				const { width, height } = <ImageParam>spec;
				return isNumericArray(value) && value.length == width * height;
			},
		},
		numlist: {
			validate: (spec, value) => {
				if (!isNumericArray(value)) return false;
				const { min = 0, max = Infinity } = <NumListParam>spec;
				return value.length >= min && value.length <= max;
			},
		},
		ramp: {
			validate: () => false,
			read: (spec, t) => {
				const { stops, mode } = <RampParam>spec;
				let n = stops.length;
				let i = n;
				for (; (i -= 2) >= 0; ) {
					if (t >= stops[i]) break;
				}
				n -= 2;
				const at = stops[i];
				const av = stops[i + 1];
				const bt = stops[i + 2];
				const bv = stops[i + 3];
				return i < 0
					? stops[1]
					: i >= n
					? stops[n + 1]
					: {
							exp: () =>
								mix(av, bv, math.easeInOut5(norm(t, at, bt))),
							linear: () => math.fit(t, at, bt, av, bv),
							smooth: () =>
								mix(av, bv, math.smoothstep01(norm(t, at, bt))),
					  }[mode || "linear"]();
			},
			params: {
				stops: params.numlist({
					name: "Ramp stops",
					desc: "Control points",
					default: [],
				}),
				mode: params.choice<Exclude<RampParam["mode"], undefined>>({
					name: "Ramp mode",
					desc: "Interpolation method",
					options: ["linear", "smooth", "exp"],
				}),
			},
		},
		range: {
			validate: (spec, value) => {
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
		strlist: {
			validate: (spec, value) => {
				const {
					min = 0,
					max = Infinity,
					match,
				} = <StringListParam<any>>spec;
				if (
					!(
						Array.isArray(value) &&
						value.length >= min &&
						value.length <= max &&
						value.every(isString)
					)
				)
					return false;
				if (match) {
					const regExp = isString(match) ? new RegExp(match) : match;
					return value.every((x) => regExp.test(x));
				}
				return true;
			},
		},
		text: {
			validate: (spec, value) => {
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
			validate: (_, value) =>
				isNumericArray(value) ||
				(isString(value) &&
					/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value)),
			coerce: (_, value) =>
				isString(value) ? value.split(":").map(parseNum) : value,
			randomize: (_, rnd) => [
				(rnd() * 24) | 0,
				(rnd() * 60) | 0,
				(rnd() * 60) | 0,
			],
		},
		toggle: {
			validate: (_, value) =>
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
		vector: {
			validate: (spec, value) => {
				const { min, max, size } = <VectorParam>spec;
				return (
					isNumericArray(value) &&
					value.length === size &&
					value.every((x, i) => x >= min[i] && x <= max[i])
				);
			},
			coerce: (spec, value) => {
				const { min, max, step } = <VectorParam>spec;
				return (<number[]>value).map((x, i) =>
					clamp(round(x, step[i]), min[i], max[i])
				);
			},
			randomize: (spec, rnd) => {
				const { min, max, size, step } = <VectorParam>spec;
				return new Array(size)
					.fill(0)
					.map((_, i) =>
						clamp(
							round(mix(min[i], max[i], rnd()), step[i]),
							min[i],
							max[i]
						)
					);
			},
		},
		weighted: {
			validate: (spec, value) =>
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
			validate: (_, value) => isNumericArray(value) && value.length == 2,
			coerce: (_, value) => [clamp01(value[0]), clamp01(value[1])],
			randomize: (_, rnd) => [rnd(), rnd()],
		},
	};

	readonly math = math;
	readonly params = params;
	readonly prng = prng;
	readonly utils = utils;
	readonly time = {
		debug: debugTimeProvider,
		offline: timeProviderOffline,
		raf: timeProviderRAF,
	};

	constructor() {
		window.addEventListener("message", (e) => {
			const data = e.data;
			if (!this.isRecipient(e) || data?.__self) return;
			switch (<MessageType>data.type) {
				case "genart:get-info":
					this.notifyInfo();
					break;
				case "genart:randomize-param":
					this.randomizeParamValue(data.paramID, data.key);
					break;
				case "genart:resume":
					this.start(true);
					break;
				case "genart:configure": {
					const opts = data.opts;
					delete opts.id;
					delete opts.allowExternalConfig;
					this.configure(opts);
					break;
				}
				case "genart:set-param-value":
					this.setParamValue(data.paramID, data.value, data.key);
					break;
				case "genart:start":
					this.start();
					break;
				case "genart:stop":
					this.stop();
					break;
			}
		});
	}

	get version() {
		// DO NOT EDIT! — value will be injected by build script
		return "__VERSION__";
	}

	get id() {
		return this._opts.id;
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
		return (this._prng = ensure(
			this._adapter,
			"missing platform adapter"
		).prng);
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

	get timeProvider() {
		return this._time;
	}

	registerParamType(type: string, impl: ParamImpl) {
		ensureValidType(type);
		if (this._paramTypes[type]) {
			console.warn("overriding impl for param type:", type);
		}
		this._paramTypes[type] = impl;
	}

	paramType(type: string): Maybe<ParamImpl> {
		ensureValidType(type);
		return this._paramTypes[type];
	}

	async setParams<P extends ParamSpecs>(params: P) {
		try {
			// allow platform to pre-initialize params and/or inject additional ones
			if (this._adapter?.augmentParams) {
				params = <P>this._adapter.augmentParams(params);
			}
			// validate & prepare param declarations
			this._params = {};
			for (let id in params) {
				ensureValidID(id);
				const param: Param<any> = { ...PARAM_DEFAULTS, ...params[id] };
				if (param.default == null) {
					const impl = this.ensureParamImpl(param.type);
					if (impl.randomize) {
						param.default = impl.randomize(param, this.random.rnd);
						param.state = "random";
					} else if (impl.read) {
						param.state = "dynamic";
					} else {
						throw new Error(
							`missing default value for param: ${id}`
						);
					}
				} else {
					param.state = "default";
				}
				this._params[id] = param;
			}
			if (this._adapter) {
				// pre-initialize params in platform specific way
				if (this._adapter.initParams) {
					await this._adapter.initParams(this._params);
				}
				// source param values via platform overrides
				await this.updateParams();
			}
			this.notifySetParams();
			return <K extends keyof P>(id: K, t?: number, rnd?: PRNG["rnd"]) =>
				this.getParamValue<P, K>(id, t, rnd);
		} catch (e) {
			this.setState("error", (<Error>e).message);
			// rethrow to propagate to artwork
			throw e;
		}
	}

	setTraits(traits: Traits): void {
		this._traits = traits;
		this.emit<TraitsMessage>({ type: "genart:traits", traits });
	}

	async setAdapter(adapter: PlatformAdapter) {
		this._adapter = adapter;
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
			if (update) {
				for (let key in update) {
					this.setParamValue(id, update[key], key, "none");
				}
			}
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
		let { spec, impl } = this.ensureParam(id);
		if (value != null) {
			let updateSpec = spec;
			if (key) {
				const { spec: nested, impl: nestedImpl } =
					this.ensureNestedParam(spec, key);
				updateSpec = nested;
				impl = nestedImpl;
			}
			if (!impl.validate(updateSpec, value)) {
				this.paramError(id);
				return;
			}
			(<any>spec)[key || "value"] = impl.coerce
				? impl.coerce(updateSpec, value)
				: value;
			if (!key) spec.state = "custom";
		}
		this.emit<ParamChangeMessage>(
			{
				type: "genart:param-change",
				__self: true,
				param: this.asNestedParam(spec),
				paramID: id,
				key,
			},
			notify
		);
	}

	randomizeParamValue(
		id: string,
		key?: string,
		rnd: RandomFn = Math.random,
		notify: NotifyType = "all"
	) {
		const {
			spec,
			impl: { randomize },
		} = this.ensureParam(id);
		const canRandomizeValue = randomize && spec.randomize !== false;
		if (key) {
			const { spec: nested, impl } = this.ensureNestedParam(spec, key);
			const canRandomizeKey =
				impl.randomize && nested.randomize !== false;
			if (canRandomizeKey) {
				this.setParamValue(
					id,
					impl.randomize!(nested, rnd),
					key,
					canRandomizeKey || !canRandomizeValue ? notify : "none"
				);
			}
		}
		if (canRandomizeValue) {
			this.setParamValue(id, randomize(spec, rnd), undefined, notify);
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
		this.emit<ParamErrorMessage>({ type: "genart:param-error", paramID });
	}

	configure(opts: Partial<GenArtAPIOpts>) {
		Object.assign(this._opts, opts);
		this.notifyInfo();
	}

	on<T extends MessageType>(
		type: T,
		listener: (e: MessageTypeMap[T]) => void
	) {
		window.addEventListener("message", (e) => {
			if (this.isRecipient(e) && e.data?.type === type) listener(e.data);
		});
	}

	emit<T extends APIMessage>(
		e: Omit<T, "apiID">,
		notify: NotifyType = "all"
	) {
		if (notify === "none") return;
		(<T>e).apiID = this.id;
		const isAll = notify === "all";
		if (isAll || notify === "self") window.postMessage(e, "*");
		if ((isAll && parent !== window) || notify === "parent")
			parent.postMessage(e, "*");
	}

	start(resume = false) {
		const state = this._state;
		if (state == "play") return;
		if (state !== "ready" && state !== "stop") {
			throw new Error(`can't start in state: ${state}`);
		}
		this.setState("play");
		// re-use same msg object to avoid per-frame allocations
		const msg: AnimFrameMessage = {
			type: "genart:frame",
			__self: true,
			apiID: this.id,
			time: 0,
			frame: 0,
		};
		const update = (time: number, frame: number) => {
			if (this._state != "play") return;
			if (this._update!.call(null, time, frame)) {
				this._time!.next(update);
			} else {
				this.stop();
			}
			// emit frame msg
			if (this._opts.notifyFrameUpdate) {
				msg.time = time;
				msg.frame = frame;
				this.emit<AnimFrameMessage>(msg);
			}
		};
		if (!resume) this._time!.start();
		this._time.next(update);
		this.emit<StartMessage | ResumeMessage>({
			type: `genart:${resume ? "resume" : "start"}`,
			__self: true,
		});
	}

	stop() {
		if (this._state !== "play") return;
		this.setState("stop");
		this.emit<StopMessage>({ type: `genart:stop`, __self: true });
	}

	capture(el?: HTMLCanvasElement | SVGElement) {
		this._adapter?.capture(el);
		this.emit<CaptureMessage>(
			{ type: `genart:capture`, __self: true },
			"parent"
		);
	}

	protected setState(state: APIState, info?: string) {
		this._state = state;
		this.emit<StateChangeMessage>({
			type: "genart:state-change",
			__self: true,
			state,
			info,
		});
	}

	protected ensureParam(id: string) {
		ensureValidID(id);
		const spec = ensure(
			ensure(this._params, "no params defined")[id],
			`unknown param: ${id}`
		);
		return { spec, impl: this.ensureParamImpl(spec.type) };
	}

	protected ensureParamImpl(type: string) {
		ensureValidType(type);
		return ensure(this._paramTypes[type], `unknown param type: ${type}`);
	}

	protected ensureNestedParam(param: Param<any>, key: string) {
		const spec = ensure(
			this.ensureParamImpl(param.type).params?.[key],
			`param type '${param.type}' has no nested: ${key}`
		);
		return { spec, impl: this.ensureParamImpl(spec.type) };
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
	 * Emits {@link ParamsMessage} message (only iff the params specs aren't
	 * empty).
	 */
	protected notifySetParams() {
		if (this._params && Object.keys(this._params).length) {
			this.emit<ParamsMessage>({
				type: "genart:params",
				__self: true,
				params: this.asNestedParams({}, this._params),
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

	protected notifyInfo() {
		const [time, frame] = this._time.now();
		this.emit<InfoMessage>({
			type: "genart:info",
			opts: this._opts,
			state: this._state,
			version: this.version,
			adapter: this._adapter?.id,
			seed: this.random.seed,
			time,
			frame,
		});
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
			(data.apiID === this.id || data.apiID === "*")
		);
	}

	protected asNestedParams(dest: NestedParamSpecs, src: ParamSpecs) {
		for (let id in src) {
			dest[id] = this.asNestedParam(src[id]);
		}
		return dest;
	}

	protected asNestedParam(param: Param<any>) {
		const dest: NestedParam = { ...param };
		const impl = this._paramTypes[param.type];
		if (impl.params) {
			dest.__params = this.asNestedParams({}, impl.params);
		}
		return dest;
	}
}

/** @internal */
const ensureValidID = (id: string, kind = "ID") =>
	ensure(
		!(id === "__proto__" || id === "prototype" || id === "constructor"),
		`illegal param ${kind}: ${id}`
	);

/** @internal */
const ensureValidType = (type: string) => ensureValidID(type, "type");

// @ts-nocheck
globalThis.$genart = new API();

export * from "./api.js";

// @ts-ignore
declare global {
	/**
	 * Globally exposed singleton instance of {@link GenArtAPI}
	 */
	var $genart: GenArtAPI;
}
