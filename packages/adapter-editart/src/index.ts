import type {
	ChoiceParam,
	Param,
	ParamSpecs,
	PlatformAdapter,
	PRNG,
	RangeParam,
	ResizeMessage,
	RunMode,
	ScreenConfig,
	WeightedChoiceParam,
} from "@genart-api/core";

declare global {
	var randomSeedEditArt: string;

	function triggerPreview(): void;
}

// @ts-ignore required by editart, but actually unused
globalThis.drawArt = () => {};

const MAX_PARAMS = 5;
const SUPPORTED_TYPES = ["choice", "range", "toggle", "weighted"];

const {
	math: { clamp, round, fit, mix },
	prng: { sfc32 },
	utils: { isString, hashString },
} = $genart;

/**
 * Adapter configuration options. To be used with
 * {@link EditArtAdapter.configure}.
 */
export interface EditArtAdapterOpts {
	/**
	 * List of param IDs to adapt. If given, only these (max. 5) given
	 * parameters will be considered for adaptation (instead of auto-selecting
	 * them).
	 */
	params: string[];
}

export class EditArtAdapter implements PlatformAdapter {
	protected _paramIndex: Record<string, number> = {};
	protected _searchParams: URLSearchParams;
	protected _selectedParamIDs?: string[];
	protected _cache: Record<string, string> = {};
	protected _prng!: PRNG;
	protected _screen: ScreenConfig;

	constructor() {
		this._searchParams = new URLSearchParams(location.search);
		this._screen = this.screen;
		this.initPRNG();
		$genart.on("genart:param-change", ({ paramID, param }) => {
			const index = this._paramIndex[paramID];
			if (index == null) return;
			const value = this.serializeParam(param);
			if (value == null || this._cache[paramID] === value) return;
			this._cache[paramID] = value;
			this._searchParams.set("m" + index, value);
			this.reload();
		});
		$genart.on("genart:state-change", ({ state }) => {
			if (state === "ready") $genart.start();
		});
		// react to editart param changes (see editart SDK)
		window.addEventListener("message", (e) => {
			if (e.data.hasOwnProperty("editartQueryString")) {
				this._searchParams = new URLSearchParams(
					e.data["editartQueryString"]
				);
				this.reload();
			}
		});
		window.addEventListener("resize", () => {
			const { width, height, dpr } = this._screen;
			const newScreen = this.screen;
			if (
				width !== newScreen.width ||
				height !== newScreen.height ||
				dpr !== newScreen.dpr
			) {
				this._screen = newScreen;
				$genart.emit<ResizeMessage>({
					type: "genart:resize",
					screen: newScreen,
				});
			}
		});
	}

	get id() {
		return "@genart-api/adapter-editart";
	}

	get mode() {
		return <RunMode>"play";
	}

	get screen() {
		return {
			width: window.innerWidth,
			height: window.innerHeight,
			dpr: window.devicePixelRatio || 1,
		};
	}

	get prng() {
		return this._prng;
	}

	configure(opts: Partial<EditArtAdapterOpts>) {
		if (opts.params) {
			if (opts.params.length > MAX_PARAMS) {
				throw new Error(
					`${this.id}: only max. ${MAX_PARAMS} can be selected`
				);
			}
			this._selectedParamIDs = opts.params;
		}
	}

	async updateParam(id: string, param: Param<any>) {
		const index = this._paramIndex[id];
		if (index == null) {
			if (!SUPPORTED_TYPES.includes(param.type)) {
				this.warn(
					`ignoring unsupported param: ${id} (type: ${param.type})`
				);
			}
			return;
		}
		const paramVal = this._searchParams.get("m" + index) || "0.5";
		if (this._cache[id] === paramVal) return;
		this._cache[id] = paramVal;
		// replicate value clamping (as done in editart SDK)
		const value = clamp(+paramVal, 0, 0.999999);
		switch (param.type) {
			case "choice": {
				const options = (<ChoiceParam<string>>param).options;
				const selected = options[(value * options.length) | 0];
				return { value: isString(selected) ? selected : selected[0] };
			}
			case "range": {
				const { min, max, step } = <RangeParam>param;
				return {
					value: clamp(round(mix(min, max, value), step), min, max),
				};
			}
			case "toggle":
				return { value: value >= 0.5 };
			case "weighted": {
				const options = (<WeightedChoiceParam<string>>param).options;
				return {
					value: options[(value * options.length) | 0][1],
				};
			}
		}
	}

	async initParams(params: ParamSpecs) {
		let filtered: [string, Param<any>][] = [];
		if (this._selectedParamIDs) {
			for (let id of this._selectedParamIDs) {
				const param = params[id];
				if (param) {
					filtered.push([id, param]);
				} else {
					this.warn(`can't select unknown param: ${id}, skipping...`);
				}
			}
		} else {
			for (let pair of Object.entries(params)) {
				if (
					pair[1].edit !== "private" &&
					SUPPORTED_TYPES.includes(pair[1].type)
				) {
					filtered.push(pair);
				}
			}
			if (filtered.length > MAX_PARAMS) {
				this.warn(
					`found ${filtered.length} eligible params, but platform only supports max. ${MAX_PARAMS} params`
				);
				filtered = filtered.slice(0, MAX_PARAMS);
				this.warn(
					`only using these params (in order):`,
					filtered.map((x) => x[0])
				);
			}
			filtered.sort((a, b) => {
				const ao = a[1].order;
				const bo = b[1].order;
				if (ao === bo) return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
				return ao - bo;
			});
		}
		for (let i = 0, num = filtered.length; i < num; i++) {
			this._paramIndex[filtered[i][0]] = i;
		}
	}

	capture(_?: HTMLCanvasElement | SVGElement) {
		triggerPreview();
	}

	protected reload() {
		console.log(
			`${this.id} reloading with new params:`,
			this._searchParams.toString()
		);
		location.search = this._searchParams.toString();
	}

	protected initPRNG() {
		let seedStr = randomSeedEditArt;
		for (let i = 0; i < MAX_PARAMS; i++) {
			seedStr += this._searchParams.get("m" + i) || "0.5";
		}
		const seed = hashString(seedStr);
		const reset = () => sfc32(seed);
		this._prng = {
			seed: seedStr,
			rnd: reset(),
			reset,
		};
	}

	protected serializeParam(spec: Param<any>) {
		switch (spec.type) {
			case "choice": {
				const options = (<ChoiceParam<any>>spec).options;
				return (
					options.findIndex(
						(x) => (isString(x) ? x : x[0]) === spec.value
					) / options.length
				).toFixed(3);
			}
			case "range": {
				const { min, max } = <RangeParam>spec;
				return fit(spec.value, min, max, 0, 1).toFixed(6);
			}
			case "toggle":
				return spec.value >= 0.5 ? "1" : "0";
			case "weighted": {
				const options = (<WeightedChoiceParam<string>>spec).options;
				return (
					options.findIndex(
						(x) => (isString(x) ? x : x[1]) === spec.value
					) / options.length
				).toFixed(3);
			}
			default:
				return String(spec.value);
		}
	}

	protected warn(msg: string, ...args: any[]) {
		console.warn(`${this.id}:`, msg, ...args);
	}
}

$genart.setAdapter(new EditArtAdapter());
