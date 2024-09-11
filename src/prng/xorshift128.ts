/**
 * XORShift128 PRNG. Seed: 4x 32bit int
 *
 * @param seed
 */
export const xorshift128 = (seed: ArrayLike<number>) => {
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
