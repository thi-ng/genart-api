/**
 * No-arg function which returns a pseudo-random number in the semi-open [0,1)
 * interval (like `Math.random()`).
 *
 * @remarks
 * See compatible PRNG implementations:
 *
 * - https://github.com/thi-ng/genart-api/blob/main/src/prng/sfc32.ts
 * - https://github.com/thi-ng/genart-api/blob/main/src/prng/xorshift128.ts
 */
export type RandomFn = () => number;

/**
 * Pseudo-random number generator, obtained from & provided by the currently
 * active {@link PlatformAdapter}.
 */
export interface PRNG {
	/**
	 * The currently configured seed value (as string) used by the PRNG. For
	 * information purposes only.
	 */
	readonly seed: string;
	/**
	 * Re-initializes the PRNG to the configured seed state.
	 */
	reset: () => PRNG["rnd"];
	/**
	 * Returns a pseudo-random number in the semi-open [0,1) interval.
	 */
	rnd: () => number;
}
