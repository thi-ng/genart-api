import type { ParamImpl } from "../api/params.js";
import { isString } from "../utils.js";

export const toggle: ParamImpl = {
	validate: (_, value) =>
		isString(value)
			? /^(true|false|0|1)$/.test(value)
			: value === 1 || value === 0 || typeof value === "boolean",
	coerce: (_, value) =>
		value === "true" || value === "1"
			? true
			: value === "false" || value === "0"
			? false
			: !!value,
	randomize: (_, rnd) => rnd() < 0.5,
};
