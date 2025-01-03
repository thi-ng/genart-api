import type { ParamImpl } from "../api/params.js";
import { isString, u24 } from "../utils.js";

export const color: ParamImpl = {
	validate: (_, value) => isString(value) && /^#?[0-9a-f]{6,8}$/i.test(value),
	coerce: (_, value) =>
		(value[0] !== "#" ? "#" + value : value).substring(0, 7),
	randomize: (_, rnd) => "#" + u24((rnd() * 0x1_00_00_00) | 0),
};
