import type {
	ImageParam,
	NumListParam,
	Param,
	ParamSpecs,
	PlatformAdapter,
	PRNG,
	RampParam,
	RangeParam,
	ResizeMsg,
	RunMode,
	ScreenConfig,
} from "../api.js";
import { sfc32 } from "../prng/sfc32.js";
import { base64Decode, base64Encode } from "./base64.js";

const {
	math: { clamp01, parseNum },
	utils: { formatValuePrec },
} = $genart;

const AUTO = "__autostart";
const WIDTH = "__width";
const HEIGHT = "__height";
const DPR = "__dpr";
const SEED = "__seed";

class URLParamsAdapter implements PlatformAdapter {
	protected params: URLSearchParams;
	protected cache: Record<string, string> = {};
	protected _prng!: PRNG;
	protected _screen: ScreenConfig;

	constructor() {
		this.params = new URLSearchParams(location.search);
		this._screen = this.screen;
		this.initPRNG();
		$genart.on("genart:paramchange", (e) => {
			const value = this.serializeParam(e.param);
			this.params.set(e.paramID, value);
			// (optional) send updated params to parent GUI for param editing
			parent.postMessage(
				{
					type: "paramadapter:update",
					params: this.params.toString(),
				},
				"*"
			);
			if (e.param.update === "reload") {
				console.log("reloading w/", this.params.toString());
				location.search = this.params.toString();
			}
		});
		$genart.on("genart:statechange", ({ state }) => {
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
				$genart.emit<ResizeMsg>({
					type: "genart:resize",
					screen: newScreen,
				});
			}
		});
		// broadcast initial set of parameters (e.g. for editors)
		parent.postMessage(
			{
				type: "paramadapter:update",
				params: this.params.toString(),
			},
			"*"
		);
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

	async setParams(params: ParamSpecs) {
		Object.assign(params, {
			[SEED]: $genart.params.range({
				name: "PRNG seed",
				desc: "Manually defined seed value",
				min: 0,
				max: 1e13,
				default: Number(BigInt(this._prng.seed)),
				update: "reload",
				widget: "precise",
			}),
			[WIDTH]: $genart.params.range({
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
				name: "Autostart",
				desc: "If enabled, artwork will start playing automatically",
				default: this.params.get(AUTO) !== "0",
				randomize: false,
				update: "reload",
			}),
		});
		return params;
	}

	async updateParam(id: string, spec: Param<any>) {
		let value = this.params.get(id);
		if (value == null || this.cache[id] === value) return;
		this.cache[id] = value;
		switch (spec.type) {
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
			case "img":
				return { value: base64Decode(value) };
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
			case "xy":
				return { value: value.split(",").map((x) => +x) };
		}
	}

	serializeParam(spec: Param<any>) {
		switch (spec.type) {
			case "color":
				return spec.value.substring(1);
			case "date":
				return spec.value.toISOString().substring(0, 10);
			case "datetime":
				return spec.value.toISOString();
			case "img":
				return base64Encode((<ImageParam>spec).value!);
			case "numlist":
			case "strlist":
				return (<NumListParam>spec).value!.join(",");
			case "ramp": {
				const $spec = <RampParam>spec;
				return (
					$spec.mode![0] +
					"," +
					$spec.stops.flatMap((x) => x).join(",")
				);
			}
			case "range":
				return formatValuePrec((<RangeParam>spec).step)(spec.value);
			case "time":
				return spec.value.join(":");
			case "toggle":
				return spec.value ? 1 : 0;
			case "xy":
				return (<number[]>spec.value)
					.map((x) => x.toFixed(3))
					.join(",");
			default:
				return spec.value;
		}
	}

	capture(el?: HTMLCanvasElement | SVGElement) {
		console.log("TODO handle capture...", el);
	}

	protected initPRNG() {
		const seedParam = this.params.get(SEED);
		const seed = BigInt(seedParam ?? Date.now());
		const M = 0xffffffffn;
		const reset = () => {
			return (impl.rnd = sfc32([
				Number((seed >> 96n) & M) >>> 0,
				Number((seed >> 64n) & M) >>> 0,
				Number((seed >> 32n) & M) >>> 0,
				Number(seed & M) >>> 0,
			]));
		};
		const impl = <PRNG>{
			seed: "0x" + seed.toString(16),
			reset,
		};
		reset();
		this._prng = impl;
	}
}

$genart.setAdapter(new URLParamsAdapter());
