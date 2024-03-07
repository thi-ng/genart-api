import type {
	ParamSpec,
	ParamSpecs,
	ParamValue,
	ParamValues,
	PlatformAdapter,
	PRNG,
} from "./api.js";

const prefix = "genart:";

globalThis.$genartAPI = new (class {
	protected _adapter?: PlatformAdapter;
	protected _specs?: ParamSpecs;
	protected _prng?: PRNG;

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

	setAdapter(adapter: PlatformAdapter) {
		this._adapter = adapter;
	}

	setParams(specs: ParamSpecs) {
		this._specs = specs;
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

	capture() {
		this._adapter?.capture(),
			parent.postMessage({ id: `${prefix}capture`, __self: !0 });
	}

	protected ensureAdapter() {
		if (!this._adapter) throw new Error("missing platform adapter");
	}
})();
