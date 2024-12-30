import type { ParamImpl, StringListParam } from "../api/params.js";
import { isInRange, isString, isStringArray } from "../utils.js";

export const strlist: ParamImpl = {
	validate: (spec, value) => {
		const { minLength, maxLength, match } = <StringListParam<any>>spec;
		if (
			!(
				isStringArray(value) &&
				isInRange(value.length, minLength, maxLength)
			)
		)
			return false;
		if (match) {
			const regExp = isString(match) ? new RegExp(match) : match;
			return value.every((x) => regExp.test(x));
		}
		return true;
	},
};
