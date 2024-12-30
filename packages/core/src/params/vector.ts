import type { ParamImpl, VectorParam } from "../api/params.js";
import { clamp, mix, round } from "../math.js";
import { isInRange, isNumericArray } from "../utils.js";

export const vector: ParamImpl = {
	validate: (spec, value) => {
		const { min, max, size } = <VectorParam>spec;
		return (
			isNumericArray(value) &&
			value.length === size &&
			value.every((x, i) => isInRange(x, min[i], max[i]))
		);
	},
	coerce: (spec, value) => {
		const { min, max, step } = <VectorParam>spec;
		return (<number[]>value).map((x, i) =>
			clamp(round(x, step[i]), min[i], max[i])
		);
	},
	randomize: (spec, rnd) => {
		const { min, max, size, step } = <VectorParam>spec;
		return new Array(size)
			.fill(0)
			.map((_, i) =>
				clamp(
					round(mix(min[i], max[i], rnd()), step[i]),
					min[i],
					max[i]
				)
			);
	},
};
