import type {
	AnimFrameMessage,
	APIMessage,
	APIState,
	CaptureMessage,
	GenArtAPI,
	GenArtAPIOpts,
	InfoMessage,
	Maybe,
	MessageType,
	MessageTypeMap,
	NestedParam,
	NestedParamSpecs,
	NotifyType,
	Param,
	ParamChangeMessage,
	ParamErrorMessage,
	ParamImpl,
	ParamsMessage,
	ParamSpecs,
	ParamValue,
	PlatformAdapter,
	PRNG,
	RandomFn,
	ResumeMessage,
	StartMessage,
	StateChangeMessage,
	StopMessage,
	TimeProvider,
	Traits,
	TraitsMessage,
	UpdateFn,
} from "./api.js";
import * as math from "./math.js";
import * as params from "./params/factories.js";
import { bigint } from "./params/bigint.js";
import { binary } from "./params/binary.js";
import { choice } from "./params/choice.js";
import { color } from "./params/color.js";
import { date } from "./params/date.js";
import { datetime } from "./params/datetime.js";
import { image } from "./params/image.js";
import { numlist } from "./params/numlist.js";
import { ramp } from "./params/ramp.js";
import { range } from "./params/range.js";
import { strlist } from "./params/strlist.js";
import { text } from "./params/text.js";
import { time } from "./params/time.js";
import { toggle } from "./params/toggle.js";
import { vector } from "./params/vector.js";
import { weighted } from "./params/weighted.js";
import { xy } from "./params/xy.js";
import * as prng from "./prng.js";
import { timeProviderOffline } from "./time/offline.js";
import { timeProviderRAF } from "./time/raf.js";
import * as utils from "./utils.js";

const { ensure, isFunction } = utils;

/** @internal */
const hasWindow = typeof window !== "undefined";

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
		bigint,
		binary,
		choice,
		color,
		date,
		datetime,
		image,
		numlist,
		ramp,
		range,
		strlist,
		text,
		time,
		toggle,
		vector,
		weighted,
		xy,
	};

	readonly math = math;
	readonly params = params;
	readonly prng = prng;
	readonly utils = utils;
	readonly time = {
		offline: timeProviderOffline,
		raf: timeProviderRAF,
	};

	constructor() {
		hasWindow &&
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
						if (!this._opts.allowExternalConfig) return;
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

	get collector() {
		return this._adapter?.collector;
	}

	get iteration() {
		return this._adapter?.iteration;
	}

	get screen() {
		return (
			this._adapter?.screen ||
			(hasWindow
				? {
						width: window.innerWidth,
						height: window.innerHeight,
						dpr: window.devicePixelRatio || 1,
				  }
				: { width: 640, height: 640, dpr: 1 })
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
				const param: Param<any> = {
					...params.PARAM_DEFAULTS,
					...params[id],
				};
				const impl = this.ensureParamImpl(param.type);
				if (param.default == null) {
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
					if (!(impl.read || impl.validate(param, param.default))) {
						throw new Error(
							`invalid default value for param: ${id} (${param.default})`
						);
					}
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
			return this.getParamValue.bind(this);
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

	setAdapter(adapter: PlatformAdapter) {
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
		opt?: number | RandomFn
	): ParamValue<T[K]> {
		return this.paramValueGetter<T, K>(id)(opt);
	}

	paramValueGetter<T extends ParamSpecs, K extends keyof T>(
		id: K
	): (opt?: number | RandomFn) => ParamValue<T[K]> {
		const {
			spec,
			impl: { randomize, read },
		} = this.ensureParam(<string>id);
		return (t = 0) => {
			if (isFunction(t)) {
				if (randomize) return randomize(spec, t);
				t = 0;
			}
			return read ? read(spec, t) : spec.value ?? spec.default;
		};
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
		ensure(hasWindow, "current env has no messaging support");
		window.addEventListener("message", (e) => {
			if (this.isRecipient(e) && e.data?.type === type) listener(e.data);
		});
	}

	emit<T extends APIMessage>(
		e: Omit<T, "apiID">,
		notify: NotifyType = "all"
	) {
		if (!hasWindow || notify === "none") return;
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
		const { id, collector, iteration } = this._adapter ?? {};
		this.emit<InfoMessage>({
			type: "genart:info",
			opts: this._opts,
			state: this._state,
			version: this.version,
			seed: this.random.seed,
			adapter: id,
			collector,
			iteration,
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

/**
 * Returns true if the given `id` is legal (i.e. not `__proto__` etc.).
 *
 * @internal
 */
const ensureValidID = (id: string, kind = "ID") =>
	ensure(
		!(id === "__proto__" || id === "prototype" || id === "constructor"),
		`illegal param ${kind}: ${id}`
	);

/** @internal */
const ensureValidType = (type: string) => ensureValidID(type, "type");

// @ts-ignore
globalThis.$genart = new API();

export * from "./api.js";

declare global {
	/**
	 * Globally exposed singleton instance of {@link GenArtAPI}
	 */
	var $genart: GenArtAPI;
}
