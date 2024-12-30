import type { ParamImpl } from "../api/params.js";
import { isNumber, isString } from "../utils.js";

const RE_DATETIME =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[-+]\d{2}:\d{2})$/;

export const datetime: ParamImpl = {
	validate: (_, value) =>
		value instanceof Date ||
		isNumber(value) ||
		(isString(value) && RE_DATETIME.test(value)),
	coerce: (_, value) =>
		isNumber(value)
			? new Date(value)
			: isString(value)
			? new Date(Date.parse(value))
			: value,
};
