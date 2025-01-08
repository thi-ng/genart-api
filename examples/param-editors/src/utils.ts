import type { Param, ParamSpecs } from "@genart-api/core";
import { sortByCachedKey } from "@thi.ng/arrays";
import { compare, compareByKeys2, compareNumAsc } from "@thi.ng/compare";
import { maybeParseInt } from "@thi.ng/strings";
import { groupByObj, pushKeys } from "@thi.ng/transducers";

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

const parseVersion = (version: string) =>
	version
		.substring(1)
		.split(".")
		.map((x) => maybeParseInt(x));

export const isCompatibleVersion = (version: string, expected: string) => {
	const partsA = parseVersion(version);
	const partsB = parseVersion(expected);
	if (partsA.length !== partsB.length) return false;
	return partsA.every((x, i) => x >= partsB[i]);
};

export const numDigits = (x: number | bigint) =>
	Math.max(1, Math.ceil(Math.log10(Number(x))));
