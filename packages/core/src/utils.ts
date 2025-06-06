import type { TypedArray } from "./api/utils";

const M = 0xfffff_ffffn;
const imul = Math.imul;
const OBJP = Object.getPrototypeOf({});

export const ensure = <T>(x: T, msg: string) => {
	if (!x) throw new Error(msg);
	return x;
};

export const isBigInt = (x: any): x is bigint => typeof x === "bigint";

export const isNumber = (x: any): x is number =>
	typeof x === "number" && !isNaN(x);

export const isString = (x: any): x is string => typeof x === "string";

export const isPrim = (
	x: any
): x is bigint | boolean | number | string | symbol => {
	const type = typeof x;
	return (
		type === "bigint" ||
		type === "boolean" ||
		type === "number" ||
		type === "string" ||
		type === "symbol"
	);
};

export const isFunction = <T extends Function>(x: any): x is T =>
	typeof x === "function";

export const isNumericArray = (x: any): x is number[] =>
	isTypedArray(x) || (Array.isArray(x) && x.every(isNumber));

export const isStringArray = (x: any): x is string[] =>
	Array.isArray(x) && x.every(isString);

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

export const isInRange = (x: number, min: number, max: number) =>
	x >= min && x <= max;

export const u8 = (x: number) => (
	(x &= 0xff), (x < 16 ? "0" : "") + x.toString(16)
);

export const u16 = (x: number) => u8(x >>> 8) + u8(x);

export const u24 = (x: number) => u16(x >>> 8) + u8(x & 0xff);

export const u32 = (x: number) => u16(x >>> 16) + u16(x);

export const stringifyBigInt = (x: bigint, radix = 10) => {
	const prefix = { 10: "", 2: "0b", 8: "0o", 16: "0x" }[radix];
	return x < 0n
		? "-" + prefix + (-x).toString(radix)
		: prefix + x.toString(radix);
};

export const parseBigInt = (x: string) =>
	/^-0[box]/.test(x) ? -BigInt(x.substring(1)) : BigInt(x);

export const parseBigInt128 = (x: bigint) =>
	new Uint32Array([
		Number((x >> 96n) & M),
		Number((x >> 64n) & M),
		Number((x >> 32n) & M),
		Number(x & M),
	]);

export const stringifyJSON = (value: any) =>
	JSON.stringify(
		value,
		(_, x) => (isBigInt(x) ? x.toString() : isTypedArray(x) ? [...x] : x),
		4
	);

export const valuePrec = (step: number) => {
	const str = step.toString();
	const i = str.indexOf(".");
	return i > 0 ? str.length - i - 1 : 0;
};

export const formatValuePrec = (step: number) => {
	const prec = valuePrec(step);
	return (x: number) => x.toFixed(prec);
};

/**
 * @remarks
 * Implementation based on [thi.ng/equiv](https://thi.ng/equiv).
 *
 * @param a
 * @param b
 */
export const equiv = (a: any, b: any) => {
	let proto;
	if (a === b) return true;
	if (a == null) return b == null;
	if (b == null) return a == null;
	if (isPrim(a) || isPrim(b) || isFunction(a) || isFunction(b))
		return a === b || (a !== a && b !== b);
	if (a.length != null && b.length != null) {
		return equivArrayLike(a, b);
	}
	if (
		((proto = Object.getPrototypeOf(a)), proto == null || proto === OBJP) &&
		((proto = Object.getPrototypeOf(b)), proto == null || proto === OBJP)
	) {
		return equivObject(a, b);
	}
	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime();
	}
	if (a instanceof RegExp && b instanceof RegExp) {
		return a.toString() === b.toString();
	}
	return a === b;
};

/**
 * @remarks
 * Implementation based on [thi.ng/equiv](https://thi.ng/equiv).
 *
 * @param a
 * @param b
 */
export const equivObject = (a: Record<any, any>, b: Record<any, any>) => {
	if (Object.keys(a).length !== Object.keys(b).length) {
		return false;
	}
	for (let k in a) {
		if (!(b.hasOwnProperty(k) && equiv(a[k], b[k]))) return false;
	}
	return true;
};

/**
 * @remarks
 * Implementation based on [thi.ng/equiv](https://thi.ng/equiv).
 *
 * @param a
 * @param b
 */
export const equivArrayLike = (a: ArrayLike<any>, b: ArrayLike<any>) => {
	if (a.length !== b.length) return false;
	let i = a.length;
	while (i-- > 0 && equiv(a[i], b[i]));
	return i < 0;
};

export const parseUUID = (uuid: string) =>
	parseBigInt128(BigInt("0x" + uuid.replace(/-/g, "").substring(0, 32)));

/**
 * MurmurHash3 128bit.
 *
 * @remarks
 * Based on this implementation:
 * https://github.com/bryc/code/blob/master/jshash/hashes/murmurhash3_128.js
 *
 * Following modifications:
 * - Added various helper fns and use u32 arrays instead of sets of individual
 *   state vars
 * - Refactored & deduplicate internal state to be more compact
 * - Replaced large switch statement for processing remaining bytes
 *
 * @param buf
 * @param seed
 */
export const hashBytes = (buf: Uint8Array, seed = 0) => {
	const u32 = (i: number) =>
		(buf[i + 3] << 24) | (buf[i + 2] << 16) | (buf[i + 1] << 8) | buf[i];

	const rotate = (x: number, r: number) => (x << r) | (x >>> (32 - r));

	const update = (i: number, p: number) => {
		const q = (p + 1) & 3;
		// prettier-ignore
		H[p] = imul(rotate(H[p] ^ imul(rotate(imul(u32(i), P[p]), 15 + p), P[q]), 19 - (p << 1)) + H[q], 5) + K[p];
	};

	const sum = (h: Uint32Array) => {
		const h0 = (h[0] += h[1] + h[2] + h[3]);
		h[1] += h0;
		h[2] += h0;
		h[3] += h0;
		return h;
	};

	const fmix = (h: number) => {
		h ^= h >>> 16;
		h = imul(h, 2246822507);
		h ^= h >>> 13;
		h = imul(h, 3266489909);
		return (h ^= h >>> 16);
	};

	const N = buf.length;
	const K = new Uint32Array([1444728091, 197830471, 2530024501, 850148119]);
	const P = new Uint32Array([597399067, 2869860233, 951274213, 2716044179]);
	const H = P.map((x) => x ^ seed);

	let i = 0;
	for (const blockLimit = N & -16; i < blockLimit; i += 16) {
		update(i, 0);
		update(i + 4, 1);
		update(i + 8, 2);
		update(i + 12, 3);
	}

	K.fill(0);
	for (let j = N & 15; j > 0; j--) {
		const j1 = j - 1;
		if ((j & 3) === 1) {
			const bin = j >> 2;
			K[bin] = rotate(imul(K[bin] ^ buf[i + j1], P[bin]), 15 + bin);
			H[bin] ^= imul(K[bin], P[(bin + 1) & 3]);
		} else {
			K[j1 >> 2] ^= buf[i + j1] << (j1 << 3);
		}
	}

	return sum(sum(H.map((x) => x ^ N)).map(fmix));
};

export const hashString = (x: string, seed?: number) =>
	hashBytes(new TextEncoder().encode(x), seed);
