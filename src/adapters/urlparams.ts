import type {
	ChoiceParam,
	ColorParam,
	Param,
	PlatformAdapter,
	RampParam,
	RangeParam,
	RunMode,
	TextParam,
	XYParam,
} from "../api.js";

const { clamp, clamp01, parseNum } = $genart.math;

class URLParamsAdapter implements PlatformAdapter {
	params: URLSearchParams;
	cache: Record<string, string> = {};

	constructor() {
		this.params = new URLSearchParams(location.hash.substring(1));
		window.addEventListener("hashchange", () => {
			this.params = new URLSearchParams(location.hash.substring(1));
			$genart.updateParams(true);
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
		return {
			seed: this.params.get("__seed") || String(Date.now()),
			rnd: () => Math.random(),
		};
	}

	updateParam(id: string, spec: Param<any>) {
		let value = this.params.get(id);
		if (!value || this.cache[id] === value) return false;
		this.cache[id] = value;
		switch (spec.type) {
			case "choice":
				{
					const $spec = <ChoiceParam<any>>spec;
					const idx = parseNum(value, -1);
					if (idx < 0 || idx >= $spec.options.length)
						return illegalArg(id, value);
					const choice = $spec.options[idx];
					$spec.value = Array.isArray(choice) ? choice[0] : choice;
				}
				break;
			case "color":
				if (!/^[a-z0-9]{6}$/.test(value)) return illegalArg(id, value);
				(<ColorParam>spec).value = `#` + value;
				break;
			case "ramp":
				{
					const [mode, ...stops] = value.split(",");
					if (!mode || stops.length < 4 || stops.length & 1)
						return illegalArg(id, value);
					const $spec = <RampParam>spec;
					$spec.mode =
						(<const>{ l: "linear", s: "smooth" })[mode] || "linear";
					$spec.stops = [];
					for (let i = 0; i < stops.length; i += 2) {
						$spec.stops.push([
							clamp01(parseNum(stops[i])),
							clamp01(parseNum(stops[i + 1])),
						]);
					}
					$spec.stops.sort((a, b) => a[0] - b[0]);
				}
				break;
			case "range":
				{
					const $spec = <RangeParam>spec;
					const $value = +value;
					if (
						isNaN($value) ||
						$value < $spec.min ||
						$value > $spec.max
					)
						return illegalArg(id, value);
					$spec.value = clamp($value, $spec.min, $spec.max);
				}
				break;
			case "text":
				{
					const $spec = <TextParam>spec;
					if (
						($spec.min && value.length < $spec.min) ||
						($spec.max && value.length > $spec.max) ||
						($spec.match && !new RegExp($spec.match).test(value))
					)
						return illegalArg(id, value);
					$spec.value = value;
				}
				break;
			case "xy":
				{
					const coords = value.split(",").map((x) => +x);
					if (
						coords.length !== 2 ||
						isNaN(coords[0]) ||
						isNaN(coords[1])
					)
						return illegalArg(id, value);
					(<XYParam>spec).value = [
						clamp01(coords[0]),
						clamp01(coords[1]),
					];
				}
				break;
		}
		return true;
	}

	capture() {
		console.log("TODO handle capture...");
	}
}

const illegalArg = (id: string, value: string) => {
	console.warn("illegal param value: ", id, value);
	return false;
};

$genart.setAdapter(new URLParamsAdapter());
