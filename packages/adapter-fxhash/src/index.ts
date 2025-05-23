import type {
	BigIntParam,
	BinaryParam,
	ChoiceParam,
	Param,
	ParamSpecs,
	ParamUpdateBehavior,
	PlatformAdapter,
	PRNG,
	RangeParam,
	ResizeMessage,
	RunMode,
	ScreenConfig,
	TextParam,
	Traits,
	VectorParam,
	WeightedChoiceParam,
	XYParam,
} from "@genart-api/core";

declare global {
	var $fx: {
		readonly hash: string;
		readonly context: "standalone" | "capture" | "minting";
		readonly minter: string;
		readonly iteration: number;
		params(specs: any[]): void;
		getParam(id: string): any;
		features(features: Record<string, string | number | boolean>): void;
		preview(): void;
		on(
			id: string,
			pre: (...args: any[]) => boolean | Promise<boolean>,
			post: (...args: any[]) => void
		): void;
	};
}

const TYPE_MAP: Record<
	string,
	"bigint" | "boolean" | "bytes" | "color" | "number" | "select" | "string"
> = {
	bigint: "bigint",
	binary: "bytes",
	choice: "select",
	color: "color",
	range: "number",
	toggle: "boolean",
	text: "string",
	vector: "number",
	weighted: "select",
	xy: "number",
};

const UPDATE_MAP: Record<ParamUpdateBehavior, FxParam["update"]> = {
	reload: "page-reload",
	event: "sync",
};

const {
	prng: { SFC32 },
	utils: { equiv, isString, hashString },
} = $genart;

const BIGINT_MAX = 2n ** 63n;

/**
 * Adapter configuration options. To be used with
 * {@link FxhashAdapter.configure}.
 */
export interface FxhashAdapterOpts {}

interface AdaptedParam {
	/**
	 * Original param ID
	 */
	id: string;
	/**
	 * Function to convert adapted param value to original type.
	 *
	 * @param value
	 */
	adapt(value: any): any;
}

interface FxParam {
	id: string;
	name: string;
	type: string;
	update?: "page-reload" | "sync" | "code-driven";
	default?: any;
	options?: any;
}

export class FxhashAdapter implements PlatformAdapter {
	protected _searchParams: URLSearchParams;
	protected _params?: ParamSpecs;
	protected _cache: Record<string, any> = {};
	protected _adaptations: Record<string, AdaptedParam> = {};
	protected _prng!: PRNG;
	protected _screen: ScreenConfig;

	constructor() {
		this._searchParams = new URLSearchParams(location.search);
		this._screen = this.screen;
		$genart.on("genart:state-change", ({ state }) => {
			if (state === "ready") $genart.start();
		});
		$fx.on(
			"params:update",
			() => true,
			(_, rawParam) => {
				let [id, value] = Object.entries(rawParam)[0];
				const adaptedParam = this._adaptations[id];
				if (adaptedParam) {
					id = adaptedParam.id;
					value = adaptedParam.adapt(value);
				}
				const param = this._params?.[id];
				if (!param) {
					this.warn(`ignoring change for unknown param: ${id}...`);
					return false;
				}
				if (equiv(this._cache[id], value)) return false;
				this._cache[id] = value;
				// only update param if no reload required
				// (note: this check might be obsolete since fxhash only seems to call
				// this event handler for params which don't require reload...)
				if (param.update !== "reload") {
					$genart.setParamValue(id, value);
				} else {
					location.reload();
				}
				return true;
			}
		);
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
		return "@genart-api/adapter-fxhash";
	}

	get mode() {
		return (<Record<typeof $fx.context, RunMode>>{
			standalone: "play",
			capture: "preview",
			minting: "edit",
		})[$fx.context];
	}

	get screen() {
		return {
			width: window.innerWidth,
			height: window.innerHeight,
			dpr: window.devicePixelRatio || 1,
		};
	}

	get prng() {
		return this._prng || (this._prng = new SFC32(hashString($fx.hash)));
	}

	get seed() {
		return $fx.hash;
	}

	get collector() {
		return $fx.minter;
	}

	get iteration() {
		return $fx.iteration;
	}

	configure(_: Partial<FxhashAdapterOpts>) {}

	async updateParam(id: string, _: Param<any>) {
		let value: any;
		if (Object.values(this._adaptations).find((x) => x.id === id)) {
			value = this._cache[id];
			return { value };
		} else {
			value = $fx.getParam(id);
		}
		console.log(
			`${this.id}:`,
			id,
			"new value",
			value,
			"cached",
			this._cache[id]
		);
		if (value == null || equiv(this._cache[id], value)) return;
		this._cache[id] = value;
		return { value };
	}

	async initParams(params: ParamSpecs) {
		this._params = params;
		const fxParams = [];
		for (let id in params) {
			const src = params[id];
			const type = TYPE_MAP[src.type];
			if (!type) {
				this.warn(
					`unsupported type '${src.type}' for param id: ${id}, skipping...`
				);
				continue;
			}
			const dest: FxParam = {
				id,
				name: src.name,
				type,
				default: src.default,
				update: UPDATE_MAP[src.update],
			};
			fxParams.push(dest);
			this._cache[id] = src.default;
			switch (src.type) {
				case "bigint": {
					const { min, max } = <BigIntParam>src;
					if (min < -BIGINT_MAX || max >= BIGINT_MAX) {
						this.warn(`value range out of bounds for param: ${id}`);
					}
					dest.options = { min, max };
					break;
				}
				case "binary": {
					const { maxLength } = <BinaryParam>src;
					dest.update = "code-driven";
					dest.options = { length: maxLength };
					break;
				}
				case "choice": {
					const { options } = <ChoiceParam<any>>src;
					dest.options = {
						options: options.map((x) => (isString(x) ? x : x[0])),
					};
					break;
				}
				case "color": {
					this._adaptations[id] = {
						id,
						adapt: (x) => (isString(x) ? x : x.hex.rgb),
					};
					if (dest.default) dest.default = dest.default.substring(1);
					break;
				}
				case "range": {
					const { min, max, step } = <RangeParam>src;
					dest.options = { min, max, step };
					break;
				}
				case "text": {
					const { minLength, maxLength } = <TextParam>src;
					dest.options = { minLength, maxLength };
					break;
				}
				case "vector": {
					// replace vector param with multiple number params
					fxParams.pop();
					const $src = <VectorParam>src;
					const size = $src.size;
					const labels = $src.labels;
					for (let j = 0; j < size; j++) {
						const $dest = { ...dest };
						$dest.id = id + "__" + labels[j];
						$dest.name = $src.name + ` (${labels[j]})`;
						$dest.options = {
							min: $src.min[j],
							max: $src.max[j],
							step: $src.step[j],
						};
						if ($src.default) $dest.default = $src.default[j];
						fxParams.push($dest);
						this._adaptations[$dest.id] = this.adaptVectorParam(
							id,
							j
						);
					}
					break;
				}
				case "weighted": {
					const { options } = <WeightedChoiceParam<any>>src;
					dest.options = { options: options.map((x) => x[1]) };
					break;
				}
				case "xy": {
					// replace XY param with two number params
					fxParams.pop();
					const labels = "XY";
					const $src = <XYParam>src;
					for (let j = 0; j < 2; j++) {
						const $dest = { ...dest };
						$dest.id = id + "__" + labels[j];
						$dest.name = $src.name + ` (${labels[j]})`;
						$dest.options = { min: 0, max: 1, step: 0.001 };
						if ($src.default) $dest.default = $src.default[j];
						fxParams.push($dest);
						this._adaptations[$dest.id] = this.adaptVectorParam(
							id,
							j
						);
					}
				}
			}
		}
		$fx.params(fxParams);

		// only cache adapted param values here
		// other param types will be cached via .updateParam() above...
		for (let [id, adaptedParam] of Object.entries(this._adaptations)) {
			const value = $fx.getParam(id);
			if (value != null) {
				this._cache[adaptedParam.id] = adaptedParam.adapt(value);
			}
		}
	}

	setTraits(traits: Traits) {
		$fx.features(traits);
	}

	capture(_?: HTMLCanvasElement | SVGElement) {
		$fx.preview();
	}

	protected reload() {
		console.log(
			`${this.id} reloading with new params:`,
			this._searchParams.toString()
		);
		location.search = this._searchParams.toString();
	}

	protected adaptVectorParam(id: string, idx: number): AdaptedParam {
		return {
			id,
			adapt: (x) => {
				const value = this._cache[id].slice();
				value[idx] = x;
				return value;
			},
		};
	}

	protected warn(msg: string, ...args: any[]) {
		console.warn(`${this.id}:`, msg, ...args);
	}
}

$genart.setAdapter(new FxhashAdapter());
