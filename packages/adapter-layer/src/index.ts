import type {
	ChoiceParam,
	GenArtAPI,
	Param,
	ParamSpecs,
	PlatformAdapter,
	RangeParam,
	ResizeMessage,
	TextParam,
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
};

const { isString } = $genart.utils;

class LayerAdapter implements PlatformAdapter {
	readonly mode = "play";

	protected params: ParamSpecs | undefined;
	protected cache: Record<string, any> = {};
	// protected layerParams!: Record<string, Parameter> | undefined;

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
			const param = this.params?.[id];
			// only update param if no reload required
			if (param && param.update !== "reload") {
				if (param.type === "color") value = (<ColorResult>value).hex;
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

	async updateParam(id: string, param: Param<any>) {
		let value: any = $layer.parameters[id];
		if (param.type === "color") {
			if (!isString(value)) value = value.hex;
		}
		// console.log(
		// 	"layeradapter:",
		// 	id,
		// 	"new value",
		// 	value,
		// 	"cached",
		// 	this.cache[id]
		// );
		if (value == null || this.cache[id] === value) return;
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
				description: src.desc,
				default: src.default,
				customization_level:
					src.edit === "private"
						? "ARTIST"
						: src.edit === "public"
						? "VIEWER"
						: "CURATOR",
			};
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
					$dest.minLength = $src.min;
					$dest.maxLength = $src.max;
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
				}
			}
			layerParams.push(dest);
		}
		await $layer.params(...layerParams);
	}

	setTraits() {}

	capture(canvas: HTMLCanvasElement) {
		$layer.registerCanvas(canvas);
	}
}

$genart.setAdapter(new LayerAdapter());

export * from "./api.js";
