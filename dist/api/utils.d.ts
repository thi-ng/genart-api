export type TypedArray = Float32Array | Float64Array | Int8Array | Int16Array | Int32Array | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array;
export interface Utils {
    /**
     * Returns true if `x` is a number and not NaN.
     *
     * @param x
     */
    isNumber(x: any): x is number;
    /**
     * Returns true if `x` is a typedarray or JS array with all of its items
     * numbers.
     *
     * @param x
     */
    isNumericArray(x: any): x is number[];
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
