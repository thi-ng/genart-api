/**
 * Attempts to parse given string `x` into a floating point number and returns
 * it if successful (and result isn't a NaN-value). Otherwise returns
 * `fallback`.
 *
 * @param x
 * @param fallback
 */
export const parseNum = (x: string | null, fallback = 0) => {
	const y = x ? parseFloat(x) : Number.NaN;
	return isNaN(y) ? fallback : y;
};

/**
 * Linear interpolation in the closed `[a,b]` interval, based on normalized
 * position `t` in the [0,1] range. Does not perform clamping.
 *
 * @param a
 * @param b
 * @param t
 */
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Fits `x` from the closed `[a,b]` interval to the `[c,d]` interval. Does not
 * perform any clamping. If `a` == `b`, the function always returns `c`.
 *
 * @param x
 * @param a
 * @param b
 * @param c
 * @param d
 */
export const fit = (x: number, a: number, b: number, c: number, d: number) =>
	c + (d - c) * norm(x, a, b);

/**
 * Clamps `x` to the closed `[min,max]` interval.
 *
 * @param x
 * @param min
 * @param max
 */
export const clamp = (x: number, min: number, max: number) =>
	x < min ? min : x > max ? max : x;

/**
 * Clamps `x` to the closed [0,1] interval. Also see {@link clamp}
 *
 * @param x
 */
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * Rounds `x` to multiples of `y`. Returns zero if `y` is zero.
 *
 * @param x
 * @param y
 */
export const round = (x: number, y: number) => Math.round(div(x, y)) * y;

/**
 * Maps `x` into the [0,1] interval, relative to [a,b]. Does not perform
 * clamping and always returns 0 iff `a` == `b`.
 *
 * @param x
 * @param a
 * @param b
 */
export const norm = (x: number, a: number, b: number) => div(x - a, b - a);

/**
 * Safe division, i.e. computes `x / y`. Returns zero iff `y = 0`.
 *
 * @param x
 * @param y
 */
export const div = (x: number, y: number) => (y != 0 ? x / y : 0);

/**
 * Same as GLSL smoothstep(). Returns 0 if `x <= edge0` and 1 if `x >= edge1`,
 * otherwise performs smooth Hermite interpolation between 0 and 1.
 *
 * @param edge0
 * @param edge1
 * @param x
 */
export const smoothstep = (edge0: number, edge1: number, x: number) =>
	smoothstep01(clamp01(div(x - edge0, edge1 - edge0)));

/**
 * Hermite interpolation between 0 and 1, based on `x` (assumed to be in [0,1]
 * interval as well).
 *
 * @param x
 */
export const smoothstep01 = (x: number) => x * x * (3 - 2 * x);

const __easeInOut = (k: number) => {
	const k2 = 2 ** (k - 1);
	return (t: number) => (t < 0.5 ? k2 * t ** k : 1 - (-2 * t + 2) ** k / 2);
};

/**
 * Exponential ease-in-out function for given `t` in [0,1] range.
 *
 * @remarks
 * Interactive graph: https://www.desmos.com/calculator/mm0nxm3unr
 */
export const easeInOut5 = __easeInOut(5);
