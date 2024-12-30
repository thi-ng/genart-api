import type { ImageParam, ParamImpl } from "../api/params.js";
import { isTypedArray } from "../utils.js";

export const image: ParamImpl = {
	validate: (spec, value) => {
		const { width, height, format } = <ImageParam>spec;
		return (
			isTypedArray(value) &&
			value.length == width * height &&
			(format === "gray"
				? value instanceof Uint8Array ||
				  value instanceof Uint8ClampedArray
				: value instanceof Uint32Array)
		);
	},
};
