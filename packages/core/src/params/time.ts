import type { ParamImpl } from "../api/params.js";
import { parseNum } from "../math.js";
import { isInRange, isNumericArray, isString } from "../utils.js";

export const time: ParamImpl = {
	validate: (_, value) =>
		(isNumericArray(value) &&
			value.length === 3 &&
			isInRange(value[0], 0, 23) &&
			isInRange(value[1], 0, 59) &&
			isInRange(value[2], 0, 59)) ||
		(isString(value) && /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value)),
	coerce: (_, value) =>
		isString(value) ? value.split(":").map(parseNum) : value,
	randomize: (_, rnd) => [
		(rnd() * 24) | 0,
		(rnd() * 60) | 0,
		(rnd() * 60) | 0,
	],
};
