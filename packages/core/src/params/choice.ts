import type { ChoiceParam, ParamImpl } from "../api/params.js";
import { isString } from "../utils.js";

export const choice: ParamImpl = {
	validate: (spec, value) =>
		!!(<ChoiceParam<any>>spec).options.find(
			(x) => (isString(x) ? x : x[0]) === value
		),
	randomize: (spec, rnd) => {
		const opts = (<ChoiceParam<any>>spec).options;
		const value = opts[(rnd() * opts.length) | 0];
		return isString(value) ? value : value[0];
	},
};
