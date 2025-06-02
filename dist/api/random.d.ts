import type { SFC32 } from "../prng.js";
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
     * Re-initializes the PRNG to the configured seed state.
     */
    reset(): void;
    /**
     * Intended for artworks requiring multiple PRNG instances. Creates a copy
     * of the PRNG with its state entirely separate, but seeded with the PRNG's
     * current state.
     *
     * @remarks
     * To create multiple PRNGs with identical seed states do something like:
     *
     * ```js
     * // reset PRNG to seed state
     * $genart.random.reset();
     *
     * // create multiple copies (all sharing same initial state)
     * const rnd2 = $genart.random.copy();
     * const rnd3 = $genart.random.copy();
     * ```
     */
    copy(): PRNG;
    /**
     * Returns a pseudo-random number in the semi-open [0,1) interval.
     */
    rnd: RandomFn;
}
/**
 * Built-in {@link PRNG}-related functions & utilities.
 */
export interface PRNGBuiltins {
    /**
     * SFC32 PRNG implementation. Seed: 4x 32bit int.
     */
    SFC32: typeof SFC32;
    /**
     * Returns a random bigint in the `[0,max)` interval, using provided `rnd`
     * generator (default: `Math.random()`).
     *
     * @param max
     * @param rnd
     */
    randomBigInt(max: bigint, rnd?: PRNG | RandomFn): bigint;
}
