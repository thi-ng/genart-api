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
	 * Checks given arguments for value-based equality. Directly supports the
	 * following types (any others are compared via `===`):
	 *
	 * - JS primitives (bigint, boolean, number, string, symbol)
	 * - Plain JS objects (incl. nested)
	 * - Arrays (incl. nested)
	 * - TypedArrays
	 * - Date
	 * - RegExp
	 * - NaN
	 *
	 * @remarks
	 * Additional rules apply:
	 *
	 * - Arrays are recursively checked via {@link Utils.equivArrayLike}.
	 * - Plain JS objects are recursively checked via {@link Utils.equivObject}.
	 * - Numeric JS arrays will be considered equal to their TypedArray
	 *   counterpart iff both have the same length and contain the same values.
	 * - Other than the above array case, no type coercions are considered, i.e.
	 *   values will be NOT be considered equal if different types
	 * - `NaN` values will be considered equal (only iff both are `NaN`)
	 * - `null` is considered equal to `undefined`
	 *
	 * @param a
	 * @param b
	 */
	equiv(a: any, b: any): boolean;
	/**
	 * Checks if the two given objects contain the same keys and then pairwise
	 * applies {@link Utils.equiv} to all values and returns true if it
	 * successful.
	 *
	 * @param a
	 * @param b
	 */
	equivObject(a: Record<any, any>, b: Record<any, any>): boolean;
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
	 * Returns true if `x` is a bigint, boolean, number, string or symbol.
	 *
	 * @param x
	 */
	isPrim(x: any): x is bigint | boolean | number | string | symbol;
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
	 * stringifyBigInt(-0x1234n, 16) // => "-0x1234"
	 * BigInt(-0x1234).toString(16) // => "-1234"
	 *
	 * stringifyBigInt(255n, 2) // => "0b11111111"
	 * BigInt(255).toString(2) // => "11111111"
	 *
	 * // roundtrip
	 * parseBigInt(stringifyBigInt(-255n, 2)) // -255n
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
	 * Converts a 128bit uint into an array of 4x 32bit uints.
	 *
	 * @param x
	 */
	parseBigInt128(x: bigint): Uint32Array;
	/**
	 * Like `JSON.stringify(x, null, 4)`, but with direct support for bigint
	 * values (serialized as strings) and typearrays (serialized as normal JS
	 * arrays).
	 *
	 * @remarks
	 * Intended for serializing/debugging param specs.
	 *
	 * @example
	 * ```ts
	 * console.log($genart.utils.stringifyJSON($genart.paramSpecs))
	 * ```
	 *
	 * @param x
	 */
	stringifyJSON(x: any): string;
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
	/**
	 * Parses given UUID string into an `Uint32Array` of four 32bit integers.
	 *
	 * @remarks
	 * Intended to used to compute a PRNG seed value (e.g. from a string) for
	 * functions in {@link PRNGBuiltins}. Also see {@link Utils.parseBigInt128}.
	 *
	 * @example
	 * ```ts
	 * const rnd = $genart.prng.sfc32(
	 *   $genart.utils.parseUUID("ab1d2503-46e0-4956-8f44-cca92992c767")
	 * );
	 * ```
	 *
	 * @param uuid
	 */
	parseUUID(uuid: string): Uint32Array;
	/**
	 * Computes a 128bit hash of given byte array. Returns `Uint32Array` of four
	 * 32bit integers.
	 *
	 * @remarks
	 * Intended to used to compute a PRNG seed value (e.g. from a string) for
	 * functions in {@link PRNGBuiltins}.
	 *
	 * The reference implementation uses MurmurHash3 (128bit version).
	 *
	 * Also see {@link Utils.hashString}.
	 *
	 * @example
	 * ```ts
	 * const rnd = $genart.prng.sfc32(
	 *   $genart.utils.hashBytes(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))
	 * );
	 * ```
	 *
	 * @param buf - byte array
	 * @param seed - optional seed value (default: 0)
	 */
	hashBytes(buf: Uint8Array, seed?: number): Uint32Array;
	/**
	 * Convenience wrapper for {@link Utils.hashBytes} to compute a 128bit hash
	 * of given string.
	 *
	 * @remarks
	 * First converts string into UTF-8 byte array.
	 *
	 * @example
	 * ```ts
	 * const rnd = $genart.prng.sfc32(
	 *   $genart.utils.hashString("hello world!")
	 * );
	 * ```
	 *
	 * @param value
	 * @param seed
	 */
	hashString(value: string, seed?: number): Uint32Array;
}
