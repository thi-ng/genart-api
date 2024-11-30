import { sortByCachedKey } from "@thi.ng/arrays";
import { compare, compareByKeys2, compareNumAsc } from "@thi.ng/compare";
import { groupByObj, pushKeys, vals } from "@thi.ng/transducers";
import type { Param, ParamSpecs } from "../../../src/api";

export const valuePrec = (step: number) => {
	const str = step.toString();
	const i = str.indexOf(".");
	return i > 0 ? str.length - i - 1 : 0;
};

export const formatValuePrec = (step: number) => {
	const prec = valuePrec(step);
	return (x: number) => x.toFixed(prec);
};

export const groupParams = (specs: ParamSpecs) =>
	groupByObj<[string, Param<any>], string[]>(
		{ key: (x) => x[1].group || "main", group: pushKeys(0) },
		Object.entries(specs)
	);

export const sortedParamGroups = (specs: ParamSpecs) => {
	const groups = groupParams(specs);
	for (let group of Object.values(groups)) {
		sortByCachedKey(
			group,
			(id) => <[number, string]>[specs[id].order, specs[id].name],
			compareByKeys2(0, 1, compareNumAsc, compare)
		);
	}
	return groups;
};
