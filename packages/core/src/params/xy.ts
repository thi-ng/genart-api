import type { ParamImpl } from "../api/params.js";
import { clamp01 } from "../math.js";
import { isNumericArray } from "../utils.js";

export const xy: ParamImpl = {
	validate: (_, value) => isNumericArray(value) && value.length == 2,
	coerce: (_, value) => [clamp01(value[0]), clamp01(value[1])],
	randomize: (_, rnd) => [rnd(), rnd()],
};
