import type { PRNG, RandomFn } from "./api/random.js";
import { isFunction } from "./utils.js";

const MAX = 0x1_0000_0000;

/**
 * SFC32 PRNG. Seed: 4x 32bit int
 *
 * @remarks
 * See {@link PRNGBuiltins.SFC32}.
 *
 * Ported from:
 * https://github.com/thi-ng/umbrella/blob/develop/packages/random/src/sfc32.ts
 *
 * @param seed
 */
export class SFC32 implements PRNG {
	buf: Uint32Array<ArrayBuffer>;
	#rnd: RandomFn;

	constructor(public readonly seed: ArrayLike<number>) {
		this.buf = new Uint32Array(4);
		this.buf.set(seed);
		this.#rnd = () => {
			const buf = this.buf;
			const t = (((buf[0] + buf[1]) >>> 0) + buf[3]) >>> 0;
			buf[3] = (buf[3] + 1) >>> 0;
			buf[0] = buf[1] ^ (buf[1] >>> 9);
			buf[1] = (buf[2] + (buf[2] << 3)) >>> 0;
			buf[2] = (((buf[2] << 21) | (buf[2] >>> 11)) + t) >>> 0;
			return t / MAX;
		};
	}

	// allow rnd() to be used as standalone function
	get rnd() {
		return this.#rnd;
	}

	reset() {
		this.buf.set(this.seed);
	}

	copy() {
		return new SFC32(this.buf.slice());
	}
}

/** See {@link PRNGBuiltins.randomBigInt} */
export const randomBigInt = (
	max: bigint,
	rnd: PRNG | RandomFn = Math.random
) => {
	if (!isFunction(rnd)) rnd = rnd.rnd.bind(rnd);
	let value = 0n;
	for (let i = (Math.log2(Number(max)) + 31) >> 5; i-- > 0; )
		value = (value << 32n) | BigInt((rnd() * MAX) >>> 0);
	return value % max;
};
