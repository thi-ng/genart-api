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
	 * Schedules given no-arg function to be executed in the future.
	 *
	 * @param fn
	 */
	next(fn: () => void): void;
	/**
	 * Returns tuple of current `[time, frame]` (where `time` is in
	 * milliseconds and `frame` the current frame number)
	 */
	now(): [number, number];
	/**
	 * Progresses time & frame count and returns both as tuple (same format as
	 * {@link TimeProvider.now}).
	 */
	tick(): [number, number];
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
	raf: (timeOffset?: number, frameOffset?: number) => TimeProvider;
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
	offline: (
		frameDelay?: number,
		referenceFPS?: number,
		frameOffset?: number
	) => TimeProvider;
}
