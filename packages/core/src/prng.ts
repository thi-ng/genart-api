import type { PRNG, RandomFn } from "./api/random.js";

/**
 * SFC32 PRNG. Seed: 4x 32bit int
 *
 * @remarks
 * Ported from:
 * https://github.com/thi-ng/umbrella/blob/develop/packages/random/src/sfc32.ts
 *
 * @param seed
 */
export const sfc32 = (seed: ArrayLike<number>): RandomFn => {
	const buf = new Uint32Array(4);
	buf.set(seed);
	return () => {
		const t = (((buf[0] + buf[1]) >>> 0) + buf[3]) >>> 0;
		buf[3] = (buf[3] + 1) >>> 0;
		buf[0] = buf[1] ^ (buf[1] >>> 9);
		buf[1] = (buf[2] + (buf[2] << 3)) >>> 0;
		buf[2] = (((buf[2] << 21) | (buf[2] >>> 11)) + t) >>> 0;
		return t / 0x1_0000_0000;
	};
};

/**
 * XORShift128 PRNG. Seed: 4x 32bit int
 *
 * @remarks
 * Ported from:
 * https://github.com/thi-ng/umbrella/blob/develop/packages/random/src/xorshift128.ts
 *
 * @param seed
 */
export const xorshift128 = (seed: ArrayLike<number>): RandomFn => {
	const buf = new Uint32Array(4);
	buf.set(seed);
	return () => {
		let t = buf[3],
			w: number;
		t ^= t << 11;
		t ^= t >>> 8;
		buf[3] = buf[2];
		buf[2] = buf[1];
		w = buf[1] = buf[0];
		return (buf[0] = (t ^ w ^ (w >>> 19)) >>> 0);
	};
};

/**
 * XsAdd PRNG. Seed: 1x 32bit int
 *
 * @remarks
 * Ported from:
 * https://github.com/thi-ng/umbrella/blob/develop/packages/random/src/xsadd.ts
 *
 * @param seed
 */
export const xsadd = (seed: number): RandomFn => {
	const buf = new Uint32Array(4);
	buf.set([seed, 0, 0, 0]);
	for (let j = 0, i = 1; i < 8; j = i++) {
		let x = (buf[j & 3] ^ (buf[j & 3] >>> 30)) >>> 0;
		x = (0x8965 * x + (((0x6c07 * x) & 0xffff) << 16)) >>> 0;
		buf[i & 3] ^= (i + x) >>> 0;
	}
	return () => {
		let t = buf[0];
		t ^= t << 15;
		t ^= t >>> 18;
		t ^= buf[3] << 11;
		buf[0] = buf[1];
		buf[1] = buf[2];
		buf[2] = buf[3];
		buf[3] = t;
		return (t + buf[2]) >>> 0;
	};
};

export const defPRNG = <T>(
	seed: string,
	parsedSeed: T,
	impl: (seed: T) => RandomFn
): PRNG => {
	const reset = () => impl(parsedSeed);
	return { seed, reset, rnd: reset() };
};
