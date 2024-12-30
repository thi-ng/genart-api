import type { ParamImpl, RangeParam } from "../api/params.js";
import { clamp, mix, round } from "../math.js";
import { isNumber, isInRange } from "../utils.js";

export const range: ParamImpl = {
	validate: (spec, value) => {
		const { min, max } = <RangeParam>spec;
		return isNumber(value) && isInRange(value, min, max);
	},
	coerce: (spec, value) => {
		const $spec = <RangeParam>spec;
		return clamp(
			round(value ?? $spec.default, $spec.step || 1),
			$spec.min,
			$spec.max
		);
	},
	randomize: (spec, rnd) => {
		const { min, max, step } = <RangeParam>spec;
		return clamp(round(mix(min, max, rnd()), step || 1), min, max);
	},
};
