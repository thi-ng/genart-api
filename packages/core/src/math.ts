export const parseNum = (x: string | null, fallback = 0) => {
	const y = x ? parseFloat(x) : Number.NaN;
	return isNaN(y) ? fallback : y;
};

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const fit = (x: number, a: number, b: number, c: number, d: number) =>
	c + (d - c) * norm(x, a, b);

export const clamp = (x: number, min: number, max: number) =>
	x < min ? min : x > max ? max : x;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const round = (x: number, y: number) => Math.round(div(x, y)) * y;

export const norm = (x: number, a: number, b: number) => div(x - a, b - a);

export const div = (x: number, y: number) => (y != 0 ? x / y : 0);

export const smoothstep = (edge0: number, edge1: number, x: number) =>
	smoothstep01(clamp01(div(x - edge0, edge1 - edge0)));

export const smoothstep01 = (x: number) => x * x * (3 - 2 * x);

const __easeInOut = (k: number) => {
	const k2 = 2 ** (k - 1);
	return (t: number) => (t < 0.5 ? k2 * t ** k : 1 - (-2 * t + 2) ** k / 2);
};

export const easeInOut5 = __easeInOut(5);
