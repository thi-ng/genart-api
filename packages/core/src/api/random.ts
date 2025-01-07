/**
 * No-arg function which returns a pseudo-random number in the semi-open [0,1)
 * interval (like `Math.random()`).
 *
 * @remarks
 * See compatible PRNG implementations:
 *
 * - https://github.com/thi-ng/genart-api/blob/main/packages/core/src/prng.ts
 */
export type RandomFn = () => number;

/**
 * Seedable & resettable pseudo-random number generator, possibly obtained from
 * & provided by the currently active {@link PlatformAdapter}.
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
	reset: () => RandomFn;
	/**
	 * Returns a pseudo-random number in the semi-open [0,1) interval.
	 */
	rnd: RandomFn;
}

/**
 * Built-in {@link PRNG}-related functionality.
 */
export interface PRNGBuiltins {
	/**
	 * SFC32 implementation. Seed: 4x 32bit int
	 *
	 * @remarks
	 * Higher order function. Takes `seed` value and returns a {@link RandomFn}.
	 * Also see {@link PRNGBuiltins.defPRNG}.
	 *
	 * @param seed
	 */
	sfc32(seed: ArrayLike<number>): RandomFn;

	/**
	 * Helper function to construct a full {@link PRNG} instance from given
	 * `seed` string, its parsed version (e.g. via {@link hashString}) and
	 * generator `impl` (e.g. {@link PRNGBuiltins.sfc32}).
	 *
	 * @param seed
	 * @param parsedSeed
	 * @param impl
	 */
	defPRNG<T>(seed: string, parsedSeed: T, impl: (seed: T) => RandomFn): PRNG;
}
