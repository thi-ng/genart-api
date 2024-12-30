import type { ParamImpl, TextParam } from "../api/params.js";
import { isInRange, isString } from "../utils.js";

export const text: ParamImpl = {
	validate: (spec, value) => {
		if (!isString(value)) return false;
		const { minLength, maxLength, match } = <TextParam>spec;
		if (match) {
			const regexp = isString(match) ? new RegExp(match) : match;
			if (!regexp.test(value)) return false;
		}
		return isInRange(value.length, minLength, maxLength);
	},
};
