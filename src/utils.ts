/**
 * Returns true if `x` is a number and not NaN.
 *
 * @param x
 */
export const isNumber = (x: any): x is number =>
	typeof x === "number" && !isNaN(x);

/**
 * Returns true if `x` is a string.
 *
 * @param x
 */
export const isString = (x: any): x is string => typeof x === "string";

/**
 * Returns true if `x` is an array and all of its items numbers.
 *
 * @param x
 */
export const isNumericArray = (x: any): x is number[] =>
	Array.isArray(x) && x.every(isNumber);

/**
 * Formats a number as unsigned 8bit hex string (2 digits).
 *
 * @param x
 */
export const u8 = (x: number) => (
	(x &= 0xff), (x < 16 ? "0" : "") + x.toString(16)
);

/**
 * Formats a number as unsigned 16bit hex string (4 digits).
 *
 * @param x
 */
export const u16 = (x: number) => u8(x >>> 8) + u8(x);

/**
 * Formats a number as unsigned 24bit hex string (6 digits).
 *
 * @param x
 */
export const u24 = (x: number) => u16(x >>> 8) + u8(x & 0xff);

/**
 * Formats a number as unsigned 32bit hex string (8 digits).
 *
 * @param x
 */
export const u32 = (x: number) => u16(x >>> 16) + u16(x);
