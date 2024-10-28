import type { MathOps } from "./api/math.js";
import type { APIMessage, MessageType, MessageTypeMap, NotifyType } from "./api/messages.js";
import type { ParamFactories, ParamImpl, ParamSpecs, ParamValue } from "./api/params.js";
import type { PlatformAdapter, RunMode } from "./api/platform.js";
import type { PRNG, RandomFn } from "./api/random.js";
import type { ScreenConfig } from "./api/screen.js";
import type { APIState } from "./api/state.js";
import type { TimeProvider, TimeProviders } from "./api/time.js";
import type { Traits } from "./api/traits.js";
import type { Utils } from "./api/utils.js";
export * from "./api/math.js";
export * from "./api/messages.js";
export * from "./api/params.js";
export * from "./api/platform.js";
export * from "./api/random.js";
export * from "./api/screen.js";
export * from "./api/state.js";
export * from "./api/time.js";
export * from "./api/traits.js";
export * from "./api/utils.js";
export type NumOrString = number | string;
export type Maybe<T> = T | undefined;
/**
 * Animation update/draw function. See {@link GenArtAPI.setUpdate}. If the
 * function returns false, the animation loop will be stopped (via
 * {@link GenArtAPI.stop}), otherwise the loop continues until stopped
 * explicitly.
 */
export type UpdateFn = (time: number, frame: number) => boolean;
export interface GenArtAPI {
    /**
     * Unique ID for this GenArtAPI instance, intended for use cases where
     * multiple `<iframe>` elements with genart pieces exist within a parent
     * document and to allow sending messages to specific instances only.
     *
     * @remarks
     * The ID will be part of any {@link APIMessage} sent and will also be
     * checked by any `genart:...` message received. A message will only be
     * processed if its {@link APIMessage.apiID} matches this value.
     *
     * The initial value is auto-generated, but can be overridden by if needed.
     * The ID purely serves to filter out IPC messages received by this
     * GenArtAPI instance.
     */
    id: string;
    /**
     * Current deploy/run mode, proxy accessor for {@link PlatformAdapter.mode}.
     */
    readonly mode: RunMode;
    /**
     * Returns the platform's configured screen/canvas dimensions & pixel
     * density.
     *
     * TODO support & handle resizing, add message type
     */
    readonly screen: ScreenConfig;
    /**
     * Returns the platform's configured pseudo-random number generator, incl.
     * currently used seed value.
     *
     * @remarks
     * Please see related issue: https://github.com/thi-ng/genart-api/issues/1
     */
    readonly random: PRNG;
    /**
     * The API's current state.
     *
     * @remarks
     * Also see {@link StateChangeMsg}.
     */
    readonly state: APIState;
    readonly paramSpecs: Maybe<Readonly<ParamSpecs>>;
    readonly adapter: Maybe<PlatformAdapter>;
    readonly timeProvider: Maybe<TimeProvider>;
    readonly math: MathOps;
    readonly params: ParamFactories;
    readonly utils: Utils;
    readonly time: TimeProviders;
    /**
     * Registers a new parameter type and its implementation. Supports
     * overriding default types, but prints a warning in the console when doing
     * so...
     *
     * @remarks
     * When a platform registers any own types, it SHOULD consider namespacing
     * the the `type` name, e.g. `platformname:customtype`.
     *
     * See {@link ParamImpl} for implementation details. See
     * {@link ParamFactories} for built-in parameter types.
     *
     * @param type
     * @param impl
     */
    registerParamType(type: string, impl: ParamImpl): void;
    /**
     * Returns the registered {@link ParamImpl} for given parameter type.
     *
     * @remarks
     * See {@link GenArtAPI.registerParamType}.
     *
     * @param type
     */
    paramType(type: string): Maybe<ParamImpl>;
    /**
     * Called during initialization of the art piece to declare all of its
     * available parameters, their configurations and (optional) default values.
     *
     * @remarks
     * This function assumes {@link PlatformAdapter} is already set (via
     * {@link GenArtAPI.setAdapter}). It first calls
     * {@link PlatformAdapter.augmentParams} (if available) to allow for any
     * additional platform-specific params to be injected, then validates all
     * params and defines random default values for those params with missing
     * defaults. If available, it then calls and waits for
     * {@link PlatformAdapter.initParams} to pre-initialize any
     * platform-specific param handling and then calls
     * {@link GenArtAPI.updateParams} to apply any param
     * customizations/overrides sourced via the adapter. Finally, once done, it
     * sends a {@link SetParamsMsg} message to the current & parent window for
     * other software components to be notified (e.g. param editors)
     *
     * The function returns a promise of a typesafe getter function (based on
     * the declared param specs) to obtain param values (wraps
     * {@link GenArtAPI.getParamValue}). For some param types (e.g.
     * {@link RampParam}), these value lookups can be time-based or randomized
     * (for param types which support randomization).
     *
     * @example
     * ```ts
     * const param = await $genart.setParams({
     *   color: $genart.params.color({ doc: "brush color", default: "#ffff00" }),
     *   size: $genart.params.range({ doc: "brush size", default: 10, min: 5, max: 50 }),
     *   density: $genart.params.ramp({ doc: "density", stops: [[0, 0.5], [1, 1]] }),
     * });
     *
     * // get possibly customized param values (typesafe)
     * const color = param("color"); // inferred as string
     * const size = param("size"); // inferred as number
     *
     * // get a randomized value (within defined constraints)
     * const randomSize = param("size", 0, $genart.random.rnd);
     *
     * // some param types (e.g. ramp) can produce time-based values
     * // (here `t` is in [0,1] range). the time arg defaults to 0 and
     * // is ignored by other param types...
     * const density = param("density", 0.5);
     * ```
     *
     * @param params
     */
    setParams<P extends ParamSpecs>(params: P): Promise<(<K extends keyof P>(id: K, t?: number, rnd?: PRNG["rnd"]) => ParamValue<P[K]>)>;
    /**
     * Sets the {@link PlatformAdapter} instance to use.
     *
     * @param adapter
     */
    setAdapter(adapter: PlatformAdapter): void;
    /**
     * Artwork should call this function **prior to any other interaction** with
     * the global `$genart` instance to wait for the {@link PlatformAdapter} to
     * be ready.
     *
     * @example
     * ```js
     * await $genart.waitForAdapter();
     * ```
     */
    waitForAdapter(): Promise<void>;
    /**
     * Sets the {@link TimeProvider} instance to use.
     *
     * @param time
     */
    setTimeProvider(time: TimeProvider): void;
    /**
     * Artwork should call this function at start up to wait for the
     * {@link TimeProvider} to be ready.
     *
     * @remarks
     * The reference implementation of the {@link GenArtAPI} provides a number
     * of default {@link TimeProviders}, so this call is not required here (but
     * defined as option for other implementations)...
     */
    waitForTimeProvider(): Promise<void>;
    /**
     * Iterates over all registered parameters and calls
     * {@link PlatformAdapter.updateParam} and {@link GenArtAPI.setParamValue}
     * to apply any param customizations/overrides sourced via the adapter. If
     * `notify` is given, sends a {@link ParamChangeMsg} for each changed
     * param/value.
     *
     * @remarks
     * By default, this function is only called via {@link GenArtAPI.setParams}
     * and will NOT emit any param change messages.
     *
     * @param notify
     */
    updateParams(notify?: NotifyType): Promise<void>;
    /**
     * Updates the given param's value, or if `key` is specified one its nested
     * params' value, then emits a {@link ParamChangeMsg} (depending on
     * `notify`, default: "all")
     *
     * @param id
     * @param value
     * @param key
     * @param notify
     */
    setParamValue(id: string, value: any, key?: string, notify?: NotifyType): void;
    /**
     * Triggers randomization of the given param's value, or if `key` is
     * specified one its nested params. Only params which support randomization
     * will be handled, otherwise silently ignored. If randomization succeeded,
     * calls {@link GenArtAPI.setParamValue} to apply the new value and emit a
     * {@link ParamChangeMsg} (depending on `notify`, default: "all").
     *
     * @remarks
     * The optional `rnd` function is passed to {@link ParamImpl.randomize} to
     * produce a new random value. The default is `Math.random`.
     *
     * In the reference implementation of {@link GenArtAPI}, this function can
     * also be triggered via a {@link RandomizeParamMsg}.
     *
     * @param id
     * @param key
     * @param rnd
     * @param notify
     */
    randomizeParamValue(id: string, key?: string, rnd?: RandomFn, notify?: NotifyType): void;
    /**
     * Returns the value for previously registered parameter `id`, possibly
     * time-based (if the param type supports such) or randomized (if `rnd` is
     * given and iff the param type supports randomization). A type-safe wrapper
     * of this function (based on declared params) is returned by
     * {@link GenArtAPI.setParams}.
     *
     * @remarks
     * The following logic is used to produce a param's value:
     *
     * For non-randomized uses of `getParamValue()`, if a param type defines a
     * {@link ParamImpl.read} function, it will take precedent and is called
     * with given `t`. Otherwise, the param's currently defined
     * {@link Param.value} or {@link Param.default} will be returned.
     *
     * The `t` arg defaults to zero and is only used if the param type supports
     * time-based values, otherwise ignored. Of the built-in param types only
     * {@link RampParam} uses time-based values.
     *
     * The `rnd` arg is only used if the param type supports randomization. If
     * that's the case and `rnd` is given, `getParamValue()` will produce a
     * randomized value using {@link ParamImpl.randomize}, but this value is
     * ephemeral and will NOT modify the param spec's `.value` or trigger a
     * {@link RandomizeParamMsg} message being broadcast. If `rnd` is given but
     * the param type does NOT support randomization, the param's value is
     * produced normally (see above).
     *
     * **Important: It's the artist's responsibility to ensure deterministic
     * behavior of an artwork/variation and if the `rnd` arg is used, most
     * likely the currently configured {@link PRNG} function (aka
     * `$genart.random.rnd`) SHOULD be used!**
     *
     * @param id
     * @param t
     * @param rnd
     */
    getParamValue<T extends ParamSpecs, K extends keyof T>(id: K, t?: number, rnd?: PRNG["rnd"]): ParamValue<T[K]>;
    /**
     * Emits a {@link ParamErrorMsg} message (called from
     * {@link GenArtAPI.setParamValue}, if needed, but can be triggered by
     * others too...)
     *
     * @param id
     */
    paramError(id: string): void;
    /**
     * (Optionally) Called by the artwork to declare an object of "traits" (aka
     * generated metadata) which should be exposed to the platform or
     * viewers/collectors, e.g. to compute the rarity of a variation. The keys
     * in this object are trait/feature names, their values can be arbitrary
     * strings, numbers or booleans.
     *
     * @remarks
     * Usually these traits are derived from the random seed and currently
     * configured parameters. The API will forward this object to
     * {@link PlatformAdapter.setTraits} for platform-specific processing, but
     * also emits a {@link SetTraitsMsg} message to the current & parent
     * windows.
     *
     * @example
     * ```ts
     * $genart.setTraits({
     *   mood: "bright",
     *   shapes: "triangles",
     *   density: 100,
     *   slowmotion: true
     * });
     * ```
     *
     * @param traits
     */
    setTraits(traits: Traits): void;
    /**
     * Registers a handler/listener for given message `type`.
     *
     * @remarks
     * This is just facade for `window.addListener("message",...)` which also
     * handles pre-filtering of received messages and therefore reduces
     * boilerplate in individual listeners. Messages not conforming to the
     * overall {@link APIMessage} format, or which aren't addressed to the
     * configured {@link GenArtAPI.id} or not matching the message `type` will
     * be ignored.
     *
     * @param type
     * @param listener
     */
    on<T extends MessageType>(type: T, listener: (e: MessageTypeMap[T]) => void): void;
    /**
     * Sends an {@link APIMessage} using (optionally) specified `notify` type
     * (default: "all").
     *
     * @remarks
     * Auto-injects {@link GenArtAPI.id} as {@link APIMessage.apiID} to support
     * differentiation of multiple `GenArtAPI` instances running concurrently
     * (in different windows/iframes).
     *
     * If `notify` is `none`, no message will be emitted (default: "all"). See
     * {@link NotifyType} for possible values.
     *
     * @param e
     * @param notify
     */
    emit<T extends APIMessage>(e: Omit<T, "apiID">, notify?: NotifyType): void;
    /**
     * Called from artwork to register the frame loop/update function.
     *
     * @remarks
     * If both platform adapter and time provider are already known, this will
     * trigger the GenArtAPI to go into the `ready` state and emit a
     * {@link StateChangeMsg} message. In most cases, a platform adapter should
     * react to this message and call {@link GenArtAPI.start} to trigger
     * auto-playback of the artwork when `ready` state is entered.
     *
     * @param fn
     */
    setUpdate(fn: UpdateFn): void;
    /**
     * Starts (or resumes) playback of the artwork by triggering an animation
     * loop using the configured update function (also involving the configured
     * {@link TimeProvider}). Emits a `genart:start` or `genart:resume` message.
     *
     * @remarks
     * By default `resume` is false, meaning the time provider will be
     * (re)initialized (otherwise just continues).
     *
     * Triggers the API to go into `play` state and emits a
     * {@link StateChangeMsg}, as well as `genart:start` or `genart:resume`
     * messages. Function is idempotent if API is already in `play` state.
     *
     * An error will be thrown if API is not in `ready` or `stop` state, i.e.
     * the API must have a {@link PlatformAdapter}, a {@link TimeProvider} and a
     * {@link UpdateFn} must have been configured.
     *
     * Whilst the animation loop is active, a {@link AnimFrameMsg} will be
     * emitted at the end of each frame update. These messages contain the time
     * & frame information of the currently rendered frame and are intended for
     * 3rd party tooling (i.e. editors, players, sequencers).
     *
     * @param resume
     */
    start(resume?: boolean): void;
    /**
     * Stops the artwork animation loop
     */
    stop(): void;
    /**
     * Callback to trigger capturing (aka preview/thumbnail generation) of the
     * art piece (optionally given canvas or SVG element). Usually called by the
     * art piece when ready to capture...
     *
     * @param el
     */
    capture(el?: HTMLCanvasElement | SVGElement): void;
}
