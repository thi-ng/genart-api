export type TypedArray =
	| Float32Array
	| Float64Array
	| Int8Array
	| Int16Array
	| Int32Array
	| Uint8Array
	| Uint8ClampedArray
	| Uint16Array
	| Uint32Array;

export interface Utils {
	/**
	 * Throws an error if `x` is non-truthy, otherwise returns `x`.
	 *
	 * @param x
	 * @param msg
	 */
	ensure<T>(x: T, msg: string): T;
	/**
	 * Checks given arguments for value-based equality. Supports the following
	 * types:
	 *
	 * - JS primitives (boolean, number, string)
	 * - Arrays (incl. nested)
	 * - TypedArrays
	 * - Date
	 * - RegExp
	 *
	 * @param a
	 * @param b
	 */
	equiv(a: any, b: any): boolean;
	/**
	 * Pairwise applies {@link Utils.equiv} to all items of the two given
	 * arraylike arguments and returns true if it successful.
	 *
	 * @param a
	 * @param b
	 */
	equivArrayLike(a: ArrayLike<any>, b: ArrayLike<any>): boolean;
	/**
	 * Returns true if `x` is a function.
	 *
	 * @param x
	 */
	isFunction<T extends Function>(x: any): x is T;
	/**
	 * Returns true if `x` is a number and not NaN.
	 *
	 * @param x
	 */
	isNumber(x: any): x is number;
	/**
	 * Returns true if `x` is a bigint.
	 *
	 * @param x
	 */
	isBigInt(x: any): x is bigint;
	/**
	 * Returns true if `x` is a typedarray or JS array with all of its items
	 * numbers.
	 *
	 * @param x
	 */
	isNumericArray(x: any): x is number[];
	/**
	 * Returns true if `x` is an array with all of its items strings.
	 *
	 * @param x
	 */
	isStringArray(x: any): x is string[];
	/**
	 * Returns true if `x` is a typedarray.
	 *
	 * @param x
	 */
	isTypedArray(x: any): x is TypedArray;
	/**
	 * Returns true if `x` is a string.
	 *
	 * @param x
	 */
	isString(x: any): x is string;
	/**
	 * Returns true, iff `x` is in closed `[min,max]` interval.
	 *
	 * @param x
	 * @param min
	 * @param max
	 */
	isInRange(x: number, min: number, max: number): boolean;
	/**
	 * Formats a number as unsigned 8bit hex string (2 digits).
	 *
	 * @param x
	 */
	u8(x: number): string;
	/**
	 * Formats a number as unsigned 16bit hex string (4 digits).
	 *
	 * @param x
	 */
	u16(x: number): string;
	/**
	 * Formats a number as unsigned 24bit hex string (6 digits).
	 *
	 * @param x
	 */
	u24(x: number): string;
	/**
	 * Formats a number as unsigned 32bit hex string (8 digits).
	 *
	 * @param x
	 */
	u32(x: number): string;
	/**
	 * Stringifies given bigint `x`, optionally using `radix` (default: 10).
	 *
	 * @remarks
	 * Unlike `BigInt.prototype.toString()`, this function stringifies values
	 * including a radix-based prefix to ensure proper roundtrip functionality
	 * (e.g. via {@link Utils.parseBigInt}).
	 *
	 * @example
	 * ```ts
	 * serializeBigInt(-0x1234n, 16) // => "-0x1234"
	 * BigInt(-0x1234).toString(16) // => "-1234"
	 *
	 * serializeBigInt(255n, 2) // => "0b11111111"
	 * BigInt(255).toString(2) // => "11111111"
	 *
	 * // roundtrip
	 * parseBigInt(serializeBigInt(-255n, 2)) // -255n
	 * BigInt(BigInt(-255).toString(2)) // -11111111n (WRONG!)
	 * ``
	 *
	 * @param x
	 * @param radix
	 */
	stringifyBigInt(x: bigint, radix?: 2 | 8 | 10 | 16): string;
	/**
	 * Parses prevalidated string value as JS bigint, correctly handling sign
	 * and radix-based prefixes. See {@link Utils.stringifyBigInt} for further
	 * details.
	 *
	 * @example
	 * ```ts
	 * parseBigInt("-0x3ff") // -1023
	 * ```
	 *
	 * @param x
	 */
	parseBigInt(x: string): bigint;
	/**
	 * Returns number of fractional digits for given `step` size. Helper for
	 * {@link Utils.formatValuePrec}.
	 *
	 * @param step
	 */
	valuePrec(step: number): number;
	/**
	 * Returns a string formatting function which uses the appropriate number of
	 * fractional digits for given `step` size (using {@link Utils.valuePrec}).
	 */
	formatValuePrec(step: number): (x: number) => string;
}
