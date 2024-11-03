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
    /**
     * Similar to {@link TimeProviders.raf}, but also collects FPS samples and
     * injects a canvas overlay to visualize recent frame rates and compute
     * moving averages. Visualization can be configured via provided options.
     *
     * @param opts
     */
    debug(opts?: Partial<DebugTimeProviderOpts>): TimeProvider;
}
export interface DebugTimeProviderOpts {
    /**
     * @defaultValue 60
     */
    targetFPS: number;
    /**
     * Window size (number of frames) of recorded FPS samples and to compute the moving average frame rate
     *
     * @defaultValue 200
     */
    period: number;
    /**
     * Canvas width in pixels
     *
     * @defaultValue same as {@link DebugTimeProviderOpts.period}
     */
    width: number;
    /**
     * Canvas width in pixels
     *
     * @defaultValue 100
     */
    height: number;
    /**
     * Custom CSS to attach to canvas element.
     *
     * @remarks
     * By default the canvas is positioned in the top-right corner.
     */
    style: string;
    /**
     * Background color
     *
     * @defaultValue `#222`
     */
    bg: string;
    /**
     * Tuple of color values for the area plot gradient, in the following order:
     *
     * - target framerate
     * - target framerate - 1
     * - half target framerate
     * - zero
     *
     * @defaultValue `["#0f0", "#ff0", "#f00", "#300"]`
     */
    fps: [string, string, string, string];
    /**
     * Text color
     *
     * @defaultValue `#fff`
     */
    text: string;
}
