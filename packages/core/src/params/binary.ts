import type { BinaryParam, ParamImpl } from "../api/params.js";

export const binary: ParamImpl = {
	validate: (spec, value) => {
		const { minLength, maxLength } = <BinaryParam>spec;
		return (
			value instanceof Uint8Array &&
			value.length >= minLength &&
			value.length <= maxLength
		);
	},
};
