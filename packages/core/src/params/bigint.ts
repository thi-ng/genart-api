import type { BigIntParam, ParamImpl } from "../api/params.js";
import { fit } from "../math.js";
import { isBigInt, isNumber, isString, parseBigInt } from "../utils.js";

export const bigint: ParamImpl = {
	validate: (spec, value) => {
		const { min, max } = <BigIntParam>spec;
		if (isString(value)) {
			if (!/^-?([0-9]+|0x[0-9a-f]+|0b[01]+|0o[0-7]+)$/.test(value)) {
				return false;
			}
			value = parseBigInt(value);
		} else if (isNumber(value) || isBigInt(value)) {
			value = BigInt(value);
		} else {
			return false;
		}
		return value >= min && value <= max;
	},
	coerce: (_, value) =>
		isString(value) ? parseBigInt(value) : BigInt(value),
	randomize: (spec, rnd) => {
		const { min, max } = <BigIntParam>spec;
		return BigInt(fit(rnd(), 0, 1, Number(min), Number(max)));
	},
};
