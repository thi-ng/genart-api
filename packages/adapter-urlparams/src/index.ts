import type {
	ImageParam,
	NumListParam,
	Param,
	ParamSpecs,
	PlatformAdapter,
	PRNG,
	RampParam,
	RangeParam,
	ResizeMessage,
	RunMode,
	ScreenConfig,
	VectorParam,
} from "@genart-api/core";
import { base64Decode, base64Encode } from "./base64.js";
import { compressBytes, decompressBytes } from "./compress.js";

const {
	math: { clamp01, parseNum },
	prng: { defPRNG, sfc32, randomBigInt },
	utils: { formatValuePrec, parseBigInt128, stringifyBigInt },
} = $genart;

const AUTO = "__autostart";
const WIDTH = "__width";
const HEIGHT = "__height";
const DPR = "__dpr";
const SEED = "__seed";
const MAX_SEED = 1n << 128n;

class URLParamsAdapter implements PlatformAdapter {
	protected params: URLSearchParams;
	protected cache: Record<string, string> = {};
	protected _prng!: PRNG;
	protected _screen: ScreenConfig;

	constructor() {
		this.params = new URLSearchParams(location.search);
		this._screen = this.screen;
		this.initPRNG();
		$genart.on("genart:param-change", async (e) => {
			const value = await this.serializeParam(e.param);
			this.params.set(e.paramID, value);
			// (optional) send updated params to parent GUI for param editing
			parent.postMessage(
				{
					type: `${this.id}:set-params`,
					params: this.params.toString(),
				},
				"*"
			);
			if (e.param.update === "reload") {
				console.log("reloading w/", this.params.toString());
				location.search = this.params.toString();
			}
		});
		$genart.on("genart:state-change", ({ state }) => {
			if (state === "ready" && this.params.get(AUTO) !== "0") {
				$genart.start();
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
		// broadcast initial set of parameters (e.g. for editors)
		parent.postMessage(
			{
				type: `${this.id}:set-params`,
				params: this.params.toString(),
			},
			"*"
		);
	}

	get id() {
		return "@genart-api/adapter-urlparams";
	}

	get mode() {
		return <RunMode>this.params.get("__mode") || "play";
	}

	get screen() {
		return {
			width: parseNum(this.params.get(WIDTH), window.innerWidth),
			height: parseNum(this.params.get(HEIGHT), window.innerHeight),
			dpr: parseNum(this.params.get(DPR), window.devicePixelRatio || 1),
		};
	}

	get prng() {
		return this._prng;
	}

	augmentParams(params: ParamSpecs) {
		const group = this.id;
		return {
			...params,
			[SEED]: $genart.params.bigint({
				group,
				order: 0,
				name: "PRNG seed",
				desc: "Manually defined seed value",
				min: 0n,
				max: MAX_SEED - 1n,
				default: BigInt(this._prng.seed),
				update: "reload",
			}),
			[WIDTH]: $genart.params.range({
				group,
				order: 1,
				name: "Width",
				desc: "Canvas width",
				min: 100,
				max: 16384,
				default: this._screen.width,
				randomize: false,
				update: "reload",
				widget: "precise",
			}),
			[HEIGHT]: $genart.params.range({
				group,
				order: 2,
				name: "Height",
				desc: "Canvas height",
				min: 100,
				max: 16384,
				default: this._screen.height,
				randomize: false,
				update: "reload",
				widget: "precise",
			}),
			[DPR]: $genart.params.range({
				group,
				order: 3,
				name: "DPR",
				desc: "Device pixel ratio",
				min: 1,
				max: 4,
				default: this._screen.dpr,
				randomize: false,
				update: "reload",
				widget: "precise",
			}),
			[AUTO]: $genart.params.toggle({
				group,
				order: 4,
				name: "Autostart",
				desc: "If enabled, artwork will start playing automatically",
				default: this.params.get(AUTO) !== "0",
				randomize: false,
				update: "reload",
			}),
		};
	}

	async updateParam(id: string, spec: Param<any>) {
		let value = this.params.get(id);
		if (value == null || this.cache[id] === value) return;
		this.cache[id] = value;
		switch (spec.type) {
			case "bigint":
			case "color":
			case "choice":
			case "text":
			case "time":
			case "weighted":
				return { value };

			// special handling...
			case "date":
			case "datetime":
				return { value: new Date(Date.parse(value)) };
			case "binary":
			case "img":
				return { value: await decompressBytes(base64Decode(value)) };
			case "numlist":
				return { value: value.split(",").map((x) => parseNum(x)) };
			case "range":
				return { value: +value };
			case "ramp": {
				const [$mode, ...$stops] = value.split(",");
				if (!$mode || $stops.length < 4 || $stops.length & 1) {
					$genart.paramError(id);
					return;
				}
				const mode =
					(<const>{ l: "linear", s: "smooth", e: "exp" })[$mode] ||
					"linear";
				const stops: [number, number][] = [];
				for (let i = 0; i < $stops.length; i += 2) {
					stops.push([
						clamp01(parseNum($stops[i])),
						clamp01(parseNum($stops[i + 1])),
					]);
				}
				stops.sort((a, b) => a[0] - b[0]);
				return { update: { mode, stops: stops.flat() } };
			}
			case "strlist":
				return { value: value.split(",") };
			case "toggle":
				return { value: value === "1" };
			case "vector":
			case "xy":
				return { value: value.split(",").map((x) => +x) };
		}
	}

	async serializeParam(spec: Param<any>) {
		switch (spec.type) {
			case "bigint":
				return stringifyBigInt(spec.value, 16);
			case "binary":
			case "img":
				return base64Encode(
					await compressBytes((<ImageParam>spec).value!)
				);
			case "color":
				return spec.value.substring(1);
			case "date":
				return spec.value.toISOString().substring(0, 10);
			case "datetime":
				return spec.value.toISOString();
			case "numlist":
			case "strlist":
				return (<NumListParam>spec).value!.join(",");
			case "ramp": {
				const $spec = <RampParam>spec;
				return (
					$spec.mode![0] +
					"," +
					$spec.stops
						.flat()
						.map((x) => x.toFixed(3))
						.join(",")
				);
			}
			case "range":
				return formatValuePrec((<RangeParam>spec).step)(spec.value);
			case "time":
				return spec.value.join(":");
			case "toggle":
				return spec.value ? 1 : 0;
			case "vector":
			case "xy": {
				const $spec = <VectorParam>spec;
				const step = Array.isArray($spec.step) ? $spec.step[0] : 0.001;
				return $spec.value!.map(formatValuePrec(step)).join(",");
			}
			default:
				return spec.value;
		}
	}

	capture(el?: HTMLCanvasElement | SVGElement) {
		console.log("TODO handle capture...", el);
	}

	protected initPRNG() {
		const seedParam = this.params.get(SEED);
		const seed = seedParam ? BigInt(seedParam) : randomBigInt(MAX_SEED);
		this._prng = defPRNG(
			stringifyBigInt(seed),
			parseBigInt128(seed),
			sfc32
		);
	}
}

$genart.setAdapter(new URLParamsAdapter());
