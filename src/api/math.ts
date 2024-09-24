export interface MathOps {
	/**
	 * Clamps `x` to the closed `[min,max]` interval.
	 *
	 * @remarks
	 * Also see {@link MathOps.clamp01}
	 *
	 * @param x
	 * @param min
	 * @param max
	 */
	clamp(x: number, min: number, max: number): number;

	/**
	 * Clamps `x` to the closed [0,1] interval.
	 *
	 * @remarks
	 * Also see {@link MathOps.clamp}
	 *
	 * @param x
	 */
	clamp01(x: number): number;

	/**
	 * Safe division, i.e. computes `x / y`. Returns zero iff `y = 0`.
	 *
	 * @param x
	 * @param y
	 */
	div(x: number, y: number): number;

	/**
	 * Fits `x` from the closed `[a,b]` interval to the `[c,d]` interval. Does
	 * not perform any clamping. If `a` == `b`, the function always returns `c`.
	 *
	 * @param x
	 * @param a
	 * @param b
	 * @param c
	 * @param d
	 */
	fit(x: number, a: number, b: number, c: number, d: number): number;

	/**
	 * Linear interpolation in the closed `[a,b]` interval, based on normalized
	 * position `t` in the [0,1] range. Does not perform clamping.
	 *
	 * @param a
	 * @param b
	 * @param t
	 */
	mix(a: number, b: number, t: number): number;

	/**
	 * Maps `x` into the [0,1] interval, relative to [a,b]. Does not perform
	 * clamping and always returns 0 iff `a` == `b`.
	 *
	 * @param x
	 * @param a
	 * @param b
	 */
	norm(x: number, a: number, b: number): number;

	/**
	 * Attempts to parse given string `x` into a floating point number and
	 * returns it if successful (and result isn't a NaN-value). Otherwise
	 * returns `fallback` (default: 0).
	 *
	 * @param x
	 * @param fallback
	 */
	parseNum(x: string | null, fallback?: number): number;

	/**
	 * Rounds `x` to multiples of `y`. Returns zero if `y` is zero.
	 *
	 * @param x
	 * @param y
	 */
	round(x: number, y: number): number;

	/**
	 * Same as GLSL smoothstep(). Returns 0 if `x <= edge0` and 1 if `x >=
	 * edge1`, otherwise performs smooth Hermite interpolation between 0 and 1.
	 *
	 * @remarks
	 * Also see {@link MathOps.smoothstep01}.
	 *
	 * @param edge0
	 * @param edge1
	 * @param x
	 */
	smoothstep(edge0: number, edge1: number, x: number): number;

	/**
	 * Hermite interpolation between 0 and 1, based on `x` (assumed to be in
	 * [0,1] interval as well).
	 *
	 * @remarks
	 * Also see {@link MathOps.smoothstep}.
	 *
	 * @param x
	 */
	smoothstep01(x: number): number;
}
