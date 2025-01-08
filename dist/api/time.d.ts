/**
 * A simple plugin component responsible for scheduling animation frames and
 * providing timing and frame number information.
 */
export interface TimeProvider {
    /**
     * (Re)initializes the time provider's internal state.
     */
    start(): void;
    /**
     * Schedules given frame update function to be executed in the future. The
     * given function will be wrapped and called with updated timestamp & frame
     * number ({@link TimeProvider.now} will then return the same values, as
     * tuple).
     *
     * @param fn
     */
    next(fn: (time: number, frame: number) => void): void;
    /**
     * Returns tuple of current `[time, frame]` (where `time` is the current
     * frame's number of milliseconds since start and `frame` the current frame
     * number).
     *
     * @remarks
     * Function is idempotent when called during a single frame update. Can also
     * be called via `$genart.timeProvider.now()`.
     */
    now(): [number, number];
}
/**
 * Collection of default {@link TimeProvider}s.
 */
export interface TimeProviders {
    /**
     * Default {@link TimeProvider}, `requestAnimationFrame()`-based. Start time
     * & frame offsets can be provided (both defaulting to zero).
     *
     * @param timeOffset
     * @param frameOffset
     */
    raf(timeOffset?: number, frameOffset?: number): TimeProvider;
    /**
     * Returns a {@link TimeProvider} for fixed frame rate, offline (aka
     * non-realtime) animation use cases, e.g. recording image sequences.
     *
     * @remarks
     * Supports arbitrary delays between frames (default: 250ms) and reference
     * frame rates (default: 60fps).
     *
     * @param frameDelay
     * @param referenceFPS
     * @param frameOffset
     */
    offline(frameDelay?: number, referenceFPS?: number, frameOffset?: number): TimeProvider;
}
