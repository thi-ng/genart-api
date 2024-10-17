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
