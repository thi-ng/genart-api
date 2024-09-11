import type {
	Features,
	Param,
	PlatformAdapter,
	RampParam,
	RunMode,
} from "../api.js";
import { sfc32 } from "../prng/sfc32.js";

const {
	math: { clamp01, parseNum },
} = $genart;

class URLParamsAdapter implements PlatformAdapter {
	params: URLSearchParams;
	cache: Record<string, string> = {};

	constructor() {
		this.params = new URLSearchParams(location.search);
		$genart.on("genart:paramchange", (e) => {
			const value = this.serializeParam(e.spec);
			this.params.set(e.paramID, value);
			// (optional) send updated params to parent GUI for param editing
			parent.postMessage({
				type: "paramadapter:update",
				params: this.params.toString(),
			});
			if (e.spec.update === "reload") {
				console.log("reloading w/", this.params.toString());
				location.search = this.params.toString();
			}
		});
	}

	get mode() {
		return <RunMode>this.params.get("__mode") || "play";
	}

	get screen() {
		return {
			width: parseNum(this.params.get("__width"), window.innerWidth),
			height: parseNum(this.params.get("__height"), window.innerHeight),
			dpr: parseNum(
				this.params.get("__dpr"),
				window.devicePixelRatio || 1
			),
		};
	}

	get prng() {
		const seedParam = this.params.get("__seed");
		const seed = BigInt(seedParam ? "0x" + seedParam : Date.now());
		return {
			seed: seed.toString(16),
			rnd: sfc32([
				Number(seed >> 96n) >>> 0,
				Number(seed >> 64n) >>> 0,
				Number(seed >> 32n) >>> 0,
				Number(seed) >>> 0,
			]),
		};
	}

	setFeatures(features: Features) {}

	updateParam(id: string, spec: Param<any>) {
		let value = this.params.get(id);
		if (!value || this.cache[id] === value) return;
		this.cache[id] = value;
		switch (spec.type) {
			case "color":
			case "choice":
			case "text":
			case "time":
				return { value };
			case "range":
				return { value: +value };
			case "toggle":
				return { value: value === "1" };
			case "ramp": {
				const [mode, ...stops] = value.split(",");
				if (!mode || stops.length < 4 || stops.length & 1) {
					$genart.paramError(id);
					return;
				}
				const $spec = <RampParam>spec;
				$spec.mode =
					(<const>{ l: "linear", s: "smooth", e: "exp" })[mode] ||
					"linear";
				$spec.stops = [];
				for (let i = 0; i < stops.length; i += 2) {
					$spec.stops.push([
						clamp01(parseNum(stops[i])),
						clamp01(parseNum(stops[i + 1])),
					]);
				}
				$spec.stops.sort((a, b) => a[0] - b[0]);
				return { update: true };
			}
			case "xy":
				return { value: value.split(",").map((x) => +x) };
			case "date":
			case "datetime":
				return { value: new Date(Date.parse(value)) };
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
			case "time":
				return spec.value.join(":");
			case "ramp": {
				const $spec = <RampParam>spec;
				return (
					$spec.mode![0] +
					"," +
					$spec.stops.flatMap((x) => x).join(",")
				);
			}
			case "toggle":
				return spec.value ? 1 : 0;
			case "xy":
				return spec.value.join(",");
			default:
				return spec.value;
		}
	}

	capture(el?: HTMLCanvasElement | SVGElement) {
		console.log("TODO handle capture...", el);
	}
}

$genart.setAdapter(new URLParamsAdapter());
