import type {
	Choice,
	ParamImpl,
	ParamSpec,
	ParamSpecs,
	ParamValue,
	ParamValues,
	PlatformAdapter,
	PRNG,
	Range,
	TimeProvider,
	UpdateFn,
} from "./api.js";
import { timeProviderRAF } from "./time/time-raf.js";

const prefix = "genart:";

const round = (x: number, step: number) => Math.round(x / step) * step;

const clamp = (x: number, min: number, max: number) =>
	Math.min(Math.max(x, min), max);

const u8 = (x: number) => ((x &= 0xff), (x < 16 ? "0" : "") + x.toString(16));

const u16 = (x: number) => ((x &= 0xffff), u8(x >>> 16) + u8(x & 0xff));

const u24 = (x: number) => ((x &= 0xffffff), u16(x >>> 8) + u8(x & 0xff));

globalThis.$genartAPI = new (class {
	protected _time = timeProviderRAF();
	protected _adapter?: PlatformAdapter;
	protected _specs?: ParamSpecs;
	protected _prng?: PRNG;
	protected _update?: UpdateFn;
	protected _running = false;

	protected _paramTypes: Record<string, Pick<ParamImpl<any>, "randomize">> = {
		flag: {
			randomize(rnd) {
				return rnd() < 0.5;
			},
		},
		range: {
			randomize(rnd, spec) {
				const { min, max, step } = <Range>spec;
				return clamp(round(min + rnd() * (max - min), step), min, max);
			},
		},
		color: {
			randomize(rnd) {
				return "#" + u24((rnd() * 0x1_0000_0000) | 0);
			},
		},
		choice: {
			randomize(rnd, spec) {
				const { choices } = <Choice>spec;
				return choices[(rnd() * choices.length) | 0];
			},
		},
	};

	constructor() {
		window.addEventListener("message", (e) => {
			if (e.data == null || typeof e.data !== "object" || e.data.__self)
				return;
			switch (e.data.id) {
				case `${prefix}start`:
					this.start();
					break;
				case `${prefix}resume`:
					this.start(true);
					break;
				case `${prefix}stop`:
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

	get isRunning() {
		return this._running;
	}

	setAdapter(adapter: PlatformAdapter) {
		this._adapter = adapter;
	}

	setTime(time: TimeProvider) {
		this._time = time;
	}

	setParams(specs: ParamSpecs) {
		this._specs = specs;
		parent.postMessage({
			id: `${prefix}params`,
			data: specs,
			__self: true,
		});
	}

	async getParams<T extends ParamSpecs>(time = 0) {
		if (!this._specs) return;
		this.ensureAdapter();
		return Object.entries(this._specs).reduce((acc, [id, spec]) => {
			let val = this._adapter!.paramValue(id, spec, time);
			if (val === undefined) {
				console.warn(`missing param type: ${spec.type} for ${id}`);
				val = spec.default;
			}
			(<any>acc)[id] = val;
			return acc;
		}, <ParamValues<T>>{});
	}

	async getParam<T extends ParamSpec<any>>(id: string, spec: T, t = 0) {
		this.ensureAdapter();
		let val = this._adapter!.paramValue(id, spec, t);
		if (val === undefined) {
			console.warn(`missing param type: ${spec.type} for ${id}`);
			val = spec.default;
		}
		return <ParamValue<T>>val;
	}

	registerParamType<T>(type: string, param: ParamImpl<T>): void {
		this._paramTypes[type] = param;
	}

	setUpdate(fn: UpdateFn) {
		this._update = fn;
	}

	start(resume = false) {
		if (this._running) return;
		if (!this._update) throw new Error("missing update function");
		this.ensureTimeProvider();
		this._running = false;
		const update = () => {
			if (!this._running) return;
			this._update!(...this._time!.tick());
			this._time.next(update);
		};
		resume ? update() : this._time.start(update);
		parent.postMessage({
			id: `${prefix}${resume ? "resume" : "start"}`,
			__self: true,
		});
	}

	stop() {
		this._running = false;
		parent.postMessage({ id: `${prefix}stop`, __self: true });
	}

	capture() {
		this._adapter?.capture();
		parent.postMessage({ id: `${prefix}capture`, __self: true });
	}

	protected ensureAdapter() {
		if (!this._adapter) throw new Error("missing platform adapter");
	}

	protected ensureTimeProvider() {
		if (!this._time) throw new Error("missing time provider");
	}

	utils = {
		round,
		clamp,
		u8,
		u16,
		u24,
	};
})();
