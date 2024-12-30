import type { ParamImpl, WeightedChoiceParam } from "../api";

export const weighted: ParamImpl = {
	validate: (spec, value) =>
		!!(<WeightedChoiceParam<any>>spec).options.find((x) => x[1] === value),
	randomize: (spec, rnd) => {
		let {
			options,
			total,
			default: fallback,
		} = <WeightedChoiceParam<any>>spec;
		const r = rnd() * total;
		for (let i = 0, n = options.length; i < n; i++) {
			total -= options[i][0];
			if (total <= r) return options[i][1];
		}
		return fallback;
	},
};
