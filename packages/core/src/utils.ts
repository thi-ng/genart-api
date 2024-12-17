import type { TypedArray } from "./api/utils";

export const ensure = <T>(x: T, msg: string) => {
	if (!x) throw new Error(msg);
	return x;
};

export const isNumber = (x: any): x is number =>
	typeof x === "number" && !isNaN(x);

export const isString = (x: any): x is string => typeof x === "string";

export const isNumericArray = (x: any): x is number[] =>
	isTypedArray(x) || (Array.isArray(x) && x.every(isNumber));

export const isTypedArray = (x: any): x is TypedArray =>
	!!x &&
	(x instanceof Float32Array ||
		x instanceof Float64Array ||
		x instanceof Uint32Array ||
		x instanceof Int32Array ||
		x instanceof Uint8Array ||
		x instanceof Int8Array ||
		x instanceof Uint16Array ||
		x instanceof Int16Array ||
		x instanceof Uint8ClampedArray);

export const u8 = (x: number) => (
	(x &= 0xff), (x < 16 ? "0" : "") + x.toString(16)
);

export const u16 = (x: number) => u8(x >>> 8) + u8(x);

export const u24 = (x: number) => u16(x >>> 8) + u8(x & 0xff);

export const u32 = (x: number) => u16(x >>> 16) + u16(x);

export const valuePrec = (step: number) => {
	const str = step.toString();
	const i = str.indexOf(".");
	return i > 0 ? str.length - i - 1 : 0;
};

export const formatValuePrec = (step: number) => {
	const prec = valuePrec(step);
	return (x: number) => x.toFixed(prec);
};

export const equiv = (a: any, b: any) => {
	if (a === b) return true;
	if (a == null) return b == null;
	if (b == null) return a == null;
	if (isString(a) || isNumber(a)) return a === b;
	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime();
	}
	if (a instanceof RegExp && b instanceof RegExp) {
		return a.toString() === b.toString();
	}
	if (a.length != null && b.length != null) {
		return equivArrayLike(a, b);
	}
	return a === b || (a !== a && b !== b);
};

export const equivArrayLike = (a: ArrayLike<any>, b: ArrayLike<any>) => {
	if (a.length !== b.length) return false;
	let i = a.length;
	while (i-- > 0 && equiv(a[i], b[i]));
	return i < 0;
};
