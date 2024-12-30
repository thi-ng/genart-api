import type { NumListParam, ParamImpl } from "../api/params.js";
import { isInRange, isNumericArray } from "../utils.js";

export const numlist: ParamImpl = {
	validate: (spec, value) => {
		const { minLength, maxLength } = <NumListParam>spec;
		return (
			isNumericArray(value) &&
			isInRange(value.length, minLength, maxLength)
		);
	},
};
