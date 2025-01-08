import type { PRNG, RandomFn } from "./api/random.js";

const MAX = 0x1_0000_0000;

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
		return t / MAX;
	};
};

export const randomBigInt = (max: bigint, rnd: RandomFn = Math.random) => {
	let value = 0n;
	for (let i = (Math.log2(Number(max)) + 31) >> 5; i-- > 0; )
		value = (value << 32n) | BigInt((rnd() * MAX) >>> 0);
	return value % max;
};

export const defPRNG = <T>(
	seed: string,
	parsedSeed: T,
	impl: (seed: T) => RandomFn
): PRNG => {
	const reset = () => impl(parsedSeed);
	return { seed, reset, rnd: reset() };
};
