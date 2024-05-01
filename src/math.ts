export const parseNum = (x: string, fallback = 0) => {
	const y = parseFloat(x);
	return isNaN(y) ? fallback : y;
};

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const fit = (x: number, a: number, b: number, c: number, d: number) =>
	c + (d - c) * norm(x, a, b);

export const clamp = (x: number, min: number, max: number) =>
	x < min ? min : x > max ? max : x;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const round = (x: number, y: number) => Math.round(x / y) * y;

export const norm = (x: number, a: number, b: number) => div(x - a, b - a);

export const div = (x: number, y: number) => (y != 0 ? x / y : 0);

export const smoothStep = (edge: number, edge2: number, x: number) =>
	smoothStep01(clamp01(div(x - edge, edge2 - edge)));

export const smoothStep01 = (x: number) => x * x * (3 - 2 * x);
