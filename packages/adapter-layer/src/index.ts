import type {
	ChoiceParam,
	GenArtAPI,
	Param,
	ParamSpecs,
	PlatformAdapter,
	RangeParam,
	ResizeMessage,
	TextParam,
	VectorParam,
	WeightedChoiceParam,
	XYParam,
} from "@genart-api/core";
import type {
	ColorResult,
	HashParameter,
	LayerSDK,
	ListParameter,
	NumberParameter,
	Parameter,
} from "./api.js";

declare global {
	/**
	 * Globally exposed singleton instance of {@link GenArtAPI}
	 */
	var $layer: LayerSDK;
}

const TYPE_MAP: Record<
	string,
	"BOOLEAN" | "COLOR" | "HASH" | "LIST" | "NUMBER"
> = {
	choice: "LIST",
	color: "COLOR",
	range: "NUMBER",
	toggle: "BOOLEAN",
	text: "HASH",
	vector: "NUMBER",
	xy: "NUMBER",
};

const { equiv, isString } = $genart.utils;

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

class LayerAdapter implements PlatformAdapter {
	readonly mode = "play";

	protected params: ParamSpecs | undefined;
	protected cache: Record<string, any> = {};
	protected adaptations: Record<string, AdaptedParam> = {};
	protected timeoutID?: ReturnType<typeof setTimeout>;

	constructor() {
		$layer.debug = true;
		$genart.on(
			"genart:state-change",
			({ state }) =>
				state === "ready" && !$layer.controlled && $genart.start()
		);
		window.addEventListener("layer:play", () => {
			if ($genart.state === "ready" || $genart.state === "stop") {
				$genart.start($genart.state === "stop");
			}
		});
		window.addEventListener("layer:pause", () => $genart.stop());
		window.addEventListener("layer:paramchange", (e) => {
			let { id, value } = (<CustomEvent>e).detail;
			const adaptedParam = this.adaptations[id];
			if (adaptedParam) {
				id = adaptedParam.id;
				value = adaptedParam.adapt(value);
			}
			const param = this.params?.[id];
			if (!param) {
				console.warn(
					`${this.id}: ignoring change for unknown param: ${id}...`
				);
				return;
			}
			if (equiv(this.cache[id], value)) return;
			this.cache[id] = value;
			if (param.update !== "reload") {
				// only update param if no reload required
				$genart.setParamValue(id, value);
			}
		});
		window.addEventListener("layer:dimensionschange", (e) => {
			$genart.emit<ResizeMessage>({
				type: "genart:resize",
				screen: { ...(<CustomEvent>e).detail, dpr: 1 },
			});
		});
	}

	get id() {
		return "@genart-api/adapter-layer";
	}

	get screen() {
		return {
			width: $layer.width,
			height: $layer.height,
			dpr: 1,
		};
	}

	get prng() {
		return {
			seed: $layer.uuid,
			rnd: $layer.prng,
			reset: () => $layer.prng,
		};
	}

	async updateParam(id: string, _: Param<any>) {
		let value: any;
		if (Object.values(this.adaptations).find((x) => x.id === id)) {
			value = this.cache[id];
			return { value };
		} else {
			value = $layer.parameters[id];
		}
		// console.log(
		// 	`${this.id}:`,
		// 	id,
		// 	"new value",
		// 	value,
		// 	"cached",
		// 	this.cache[id]
		// );
		if (value == null || equiv(this.cache[id], value)) return;
		this.cache[id] = value;
		return { value };
	}

	async initParams(params: ParamSpecs) {
		this.params = params;
		// convert params to Layer params
		const layerParams: Parameter[] = [];
		for (let id in params) {
			const src = params[id];
			const kind = TYPE_MAP[src.type];
			if (!kind) {
				console.warn(
					`${this.id}: unsupported type:`,
					src.type,
					" for param:",
					id,
					", skipping..."
				);
				continue;
			}
			const dest = <Parameter>{
				id,
				kind,
				name: src.name || id,
				description:
					src.desc +
					(src.update === "reload" ? " (requires reload)" : ""),
				default: src.default,
				customization_level:
					src.edit === "private"
						? "ARTIST"
						: src.edit === "public"
						? "VIEWER"
						: "CURATOR",
			};
			layerParams.push(dest);
			this.cache[id] = src.default;
			switch (src.type) {
				case "choice": {
					const $src = <ChoiceParam<any>>src;
					const $dest = <ListParameter>dest;
					$dest.options = $src.options.map((x) =>
						Array.isArray(x)
							? { value: x[0], label: x[1] }
							: { value: x, label: x }
					);
					break;
				}
				case "color": {
					this.adaptations[id] = {
						id,
						adapt: (x) => (isString(x) ? x : (<ColorResult>x).hex),
					};
					break;
				}
				case "range": {
					const $src = <RangeParam>src;
					const $dest = <NumberParameter>dest;
					$dest.min = $src.min;
					$dest.max = $src.max;
					$dest.step = $src.step;
					break;
				}
				case "text": {
					const $src = <TextParam>src;
					const $dest = <HashParameter>dest;
					$dest.minLength = $src.minLength;
					$dest.maxLength = $src.maxLength;
					const pattern =
						$src.match instanceof RegExp
							? $src.match.source
							: $src.match;
					switch (pattern) {
						case "^[0-9a-f]+$":
						case "^[0-9a-fA-F]+$":
							$dest.pattern = "HEX";
							break;
						case "^[a-zA-Z0-9-_=]+$":
							$dest.pattern = "BASE64";
							break;
						case "^[a-zA-Z ]+$":
							$dest.pattern = "ALPHABETICAL";
							break;
						case "^[a-zA-Z0-9-_ ]+$":
							$dest.pattern = "ALPHANUMERIC";
							break;
						default:
							console.warn(
								`${this.id}: couldn't determine pattern type for param:`,
								id,
								", using 'ALPHANUMERIC'..."
							);
							$dest.pattern = "ALPHANUMERIC";
					}
					break;
				}
				case "vector": {
					// replace vector param with multiple number params
					layerParams.pop();
					const $src = <VectorParam>src;
					const size = $src.size;
					const labels = $src.labels;
					for (let j = 0; j < size; j++) {
						const $dest = <NumberParameter>{ ...dest };
						$dest.id = id + "__" + labels[j];
						$dest.name = $src.name + ` (${labels[j]})`;
						$dest.min = $src.min[j];
						$dest.max = $src.max[j];
						$dest.step = $src.step[j];
						if ($src.default) $dest.default = $src.default[j];
						layerParams.push($dest);
						this.adaptations[$dest.id] = this.adaptVectorParam(
							id,
							j
						);
					}
					break;
				}
				case "weighted": {
					const $src = <WeightedChoiceParam<string>>src;
					const $dest = <ListParameter>dest;
					$dest.options = $src.options.map((x) => ({
						value: x[1],
						label: x[2],
					}));
					break;
				}
				case "xy": {
					// replace XY param with two number params
					layerParams.pop();
					const labels = "xy";
					const $src = <XYParam>src;
					for (let j = 0; j < 2; j++) {
						const $dest = <NumberParameter>{ ...dest };
						$dest.id = id + "__" + labels[j];
						$dest.name = $src.name + ` (${labels[j]})`;
						$dest.min = 0;
						$dest.max = 1;
						$dest.step = 0.001;
						if ($src.default) $dest.default = $src.default[j];
						layerParams.push($dest);
						this.adaptations[$dest.id] = this.adaptVectorParam(
							id,
							j
						);
					}
				}
			}
		}
		const paramValues = await $layer.params(...layerParams);
		for (let [id, value] of Object.entries(paramValues)) {
			const adaptedParam = this.adaptations[id];
			if (adaptedParam) {
				// only cache adapted param values here
				// other param types will be cached via .updateParam() above...
				this.cache[adaptedParam.id] = adaptedParam.adapt(value);
			}
		}
	}

	setTraits() {}

	capture(canvas: HTMLCanvasElement) {
		$layer.registerCanvas(canvas);
	}

	protected adaptVectorParam(id: string, idx: number): AdaptedParam {
		return {
			id,
			adapt: (x) => {
				const value = this.cache[id].slice();
				value[idx] = x;
				return value;
			},
		};
	}
}

$genart.setAdapter(new LayerAdapter());

export * from "./api.js";
