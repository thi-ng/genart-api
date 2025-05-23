import type { MathOps } from "./api/math.js";
import type {
	APIMessage,
	MessageType,
	MessageTypeMap,
	NotifyType,
} from "./api/messages.js";
import type {
	Param,
	ParamFactories,
	ParamImpl,
	ParamSpecs,
	ParamValue,
} from "./api/params.js";
import type { PlatformAdapter, RunMode } from "./api/platform.js";
import type { PRNG, PRNGBuiltins, RandomFn } from "./api/random.js";
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
 *
 * @remarks
 * Arguments are information sourced from {@link TimeProvider.now}.
 *
 * @param time
 * @param frame
 */
export type UpdateFn = (time: number, frame: number) => boolean;

/**
 * Configuration options for {@link GenArtAPI.configure}.
 */
export interface GenArtAPIOpts {
	/**
	 * See {@link GenArtAPI.id} for details.
	 *
	 * @defaultValue random string, generated at startup
	 */
	id: string;
	/**
	 * If true, the API will accept {@link ConfigureMessage}s allowing the API
	 * behavior to be reconfigured by external tooling.
	 *
	 * @remarks
	 * For security reasons, this option is disabled and should only be enabled
	 * during development. Also see {@link GenArtAPI.configure} and {@link ConfigureMessage}.
	 *
	 * @example
	 * ```ts
	 * // enable re-configuration via IPC messages (e.g. sent from editors/tooling)
	 * $genart.configure({ allowExternalConfig: true });
	 *
	 * // using Vite.js, this will enable the option only for dev mode:
	 * $genart.configure({ allowExternalConfig: import.meta.env.DEV });
	 * ```
	 *
	 * @defaultValue false
	 */
	allowExternalConfig: boolean;
	/**
	 * If true, the API will emit a {@link AnimFrameMessage} for each single
	 * frame update.
	 *
	 * @remarks
	 * This option is disabled by default, but can be enabled (e.g. by tooling
	 * interested in this information) by sending a {@link ConfigureMessage} to
	 * the GenArtAPI instance.
	 *
	 * @defaultValue false
	 */
	notifyFrameUpdate: boolean;
}

export interface GenArtAPI {
	/**
	 * Unique ID for this GenArtAPI instance, intended for use cases where
	 * multiple `<iframe>` elements with genart pieces exist within a parent
	 * document and to allow sending messages to specific instances only.
	 *
	 * The value can be customized via {@link GenArtAPI.configure}.
	 *
	 * @remarks
	 * The ID will be part of any {@link APIMessage} sent and will also be
	 * checked by any `genart:...` message received. A message will only be
	 * processed if its {@link APIMessage.apiID} matches this value or if equal
	 * to the string `"*""`, i.e. the wildcard catch-all ID, which will be
	 * matched by any active `GenArtAPI` instance.
	 *
	 * Use cases for the wildcard ID (`"*"`) are related to managing multiple
	 * artworks running in multiple iframes (e.g. in an online gallery
	 * scenario), for example:
	 *
	 * - Detection/registration of all currently running `GenArtAPI` instances
	 *   by broadcasting a {@link GetInfoMessage}, to which each instance then
	 *   responds with a {@link InfoMessage} (which then also includes each
	 *   instance's actual configured `id`)
	 * - Starting/stopping all currently running `GenArtAPI` instances via
	 *   single message, e.g. `postMessage({ type: "genart:start", apiID: "*"
	 *   }, "*")`.
	 *
	 * The initial ID value is auto-generated, but it's considered best practice
	 * to set it at startup of the artwork (via {@link GenArtAPI.configure}).
	 */
	readonly id: string;

	/**
	 * API version in semantic versioning format (e.g. 0.12.3).
	 *
	 * @remarks
	 * This information can be used to implement API compatibility checks in
	 * artworks or platform adapters.
	 */
	readonly version: string;

	/**
	 * Current deploy/run mode, proxy accessor for {@link PlatformAdapter.mode}.
	 */
	readonly mode: RunMode;

	/**
	 * Proxy accessor for {@link PlatformAdapter.collector}.
	 */
	readonly collector?: string;

	/**
	 * Proxy accessor for {@link PlatformAdapter.iteration}.
	 */
	readonly iteration?: number;

	/**
	 * Returns the platform's configured screen/canvas dimensions & pixel
	 * density.
	 *
	 * @remarks
	 * Also see {@link ResizeMessage}.
	 */
	readonly screen: ScreenConfig;

	/**
	 * Returns the platform's configured pseudo-random number generator.
	 *
	 * @remarks
	 * Please see related issue: https://github.com/thi-ng/genart-api/issues/1
	 */
	readonly random: PRNG;
	/**
	 * The currently configured stringified random seed value, as
	 * defined/determined by the platform provider and used by the
	 * {@link GenArtAPI.random} PRNG. For information purposes only.
	 */
	readonly seed: string;
	/**
	 * The API's current state.
	 *
	 * @remarks
	 * Also see {@link StateChangeMessage}.
	 */
	readonly state: APIState;

	/**
	 * Readonly access to all parameter definitions declared by the artwork
	 * (incl. any additionally declared params defined by the platform adapter).
	 *
	 * @remarks
	 * Also see {@link PlatformAdapter.augmentParams}.
	 */
	readonly paramSpecs: Maybe<Readonly<ParamSpecs>>;
	/** Readonly access to the registered {@link PlatformAdapter} */
	readonly adapter: Maybe<PlatformAdapter>;
	/** Readonly access to the registered {@link TimeProvider} */
	readonly timeProvider: Maybe<TimeProvider>;

	/** Built-in math utilities */
	readonly math: MathOps;
	/** Built-in parameter declaration functions */
	readonly params: ParamFactories;
	/** Built-in PRNG implementations */
	readonly prng: PRNGBuiltins;
	/** Built-in utilities */
	readonly utils: Utils;
	/** Built-in time provider factory functions */
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
	 * Called during initialization of the artwork to declare all of its
	 * available parameters, their configurations and (optional) default values.
	 *
	 * @remarks
	 * This function assumes a {@link PlatformAdapter} has already been
	 * configured (via {@link GenArtAPI.setAdapter}). To ensure that's the case
	 * from the artwork's POV, the artwork should always begin with waiting for
	 * {@link GenArtAPI.waitForAdapter} before calling `setParams()`.
	 *
	 * This function first calls {@link PlatformAdapter.augmentParams} (if
	 * available) to allow for any additional platform-specific params to be
	 * injected, then validates all params, validates default values or defines
	 * random default values for those params with missing defaults (note:
	 * defaults are only used & checked for param types which have no
	 * {@link ParamImpl.read} method).
	 *
	 * If available, the function then calls and waits for
	 * {@link PlatformAdapter.initParams} to pre-initialize any
	 * platform-specific param handling and then calls
	 * {@link GenArtAPI.updateParams} to apply any param
	 * customizations/overrides sourced via the adapter. Finally, once done, it
	 * sends a {@link ParamsMessage} message to the current & parent window for
	 * other software components to be notified (e.g. param editors).
	 *
	 * The function is async and returns a promise of a typesafe getter function
	 * (based on the declared param specs) to obtain param values (wraps
	 * {@link GenArtAPI.getParamValue}). See that function's documentation for
	 * optional uses like obtaining randomized or time-based values.
	 *
	 * **Parameter IDs declared by the artwork MUST not start with `__`, which
	 * is a reserved prefix!**
	 *
	 * @example
	 * ```ts
	 * const param = await $genart.setParams({
	 *   color: $genart.params.color({
	 *     name: "brush color",
	 *     desc: "base color for brush strokes",
	 *     default: "#ffff00",
	 *   }),
	 *   size: $genart.params.range({
	 *     name: "brush size",
	 *     desc: "base brush size (normalized)",
	 *     doc: "percentage of shortest canvas size",
	 *     default: 10,
	 *     min: 5,
	 *     max: 50,
	 *   }),
	 *   density: $genart.params.ramp({
	 *     name: "brush density",
	 *     desc: "density distribution curve",
	 *     stops: [[0, 0.5], [0.5, 0.5], [1, 1]],
	 *   }),
	 * });
	 *
	 * // get possibly customized param values (typesafe)
	 * const color = param("color"); // inferred as string
	 * const size = param("size"); // inferred as number
	 *
	 * // get a randomized value
	 * // (within constraints & rules defined by the param)
	 * const randomSize = param("size", $genart.random.rnd);
	 *
	 * // some param types (e.g. ramp) can produce time-based values
	 * // (here `t` is in [0,1] range). the time arg defaults to 0 and
	 * // is ignored by other param types...
	 * const density = param("density", 0.5);
	 * ```
	 *
	 * @param params
	 */
	setParams<P extends ParamSpecs>(
		params: P
	): Promise<
		<K extends keyof P>(
			id: K,
			timeOrRnd?: number | RandomFn
		) => ParamValue<P[K]>
	>;

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
	 * `notify` is given, sends a {@link ParamChangeMessage} for each changed
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
	 * params' value, then emits a {@link ParamChangeMessage} (depending on
	 * `notify`, default: "all")
	 *
	 * @param id
	 * @param value
	 * @param key
	 * @param notify
	 */
	setParamValue(
		id: string,
		value: any,
		key?: string,
		notify?: NotifyType
	): void;

	/**
	 * Triggers randomization of the given param's value, or if `key` is
	 * specified one its nested params. Only params which support randomization
	 * will be handled, otherwise silently ignored. If randomization succeeded,
	 * calls {@link GenArtAPI.setParamValue} to apply the new value and emit a
	 * {@link ParamChangeMessage} (depending on `notify`, default: "all").
	 *
	 * @remarks
	 * The optional `rnd` function is passed to {@link ParamImpl.randomize} to
	 * produce a new random value. The default is `Math.random`.
	 *
	 * In the reference implementation of {@link GenArtAPI}, this function can
	 * also be triggered via a {@link RandomizeParamMessage}.
	 *
	 * @param id
	 * @param key
	 * @param rnd
	 * @param notify
	 */
	randomizeParamValue(
		id: string,
		key?: string,
		rnd?: RandomFn,
		notify?: NotifyType
	): void;

	/**
	 * Returns the value for previously registered parameter `id`, possibly
	 * time-based (if the param type supports such) or randomized (if a
	 * {@link RandomFn} is given and iff the param type supports randomization).
	 * A type-safe wrapper of this function (based on declared params) is
	 * returned by {@link GenArtAPI.setParams}.
	 *
	 * @remarks
	 * Also see {@link GenArtAPI.paramValueGetter} for an alternative.
	 *
	 * The following logic is used to produce a param's value:
	 *
	 * For non-randomized uses of `getParamValue()`, if a param type defines a
	 * {@link ParamImpl.read} function, it will take precedent and is called
	 * with given `time` (default: 0). Otherwise, the param's currently defined
	 * {@link Param.value} or {@link Param.default} will be returned.
	 *
	 * The the `timeOrRnd` arg defaults to zero and is only used if the param
	 * type supports time-based values, otherwise ignored. Of the built-in param
	 * types only {@link RampParam} uses time-based values.
	 *
	 * If the `timeOrRnd` arg is a {@link RandomFn}, it's only used if the param
	 * type also supports randomization. In that case `getParamValue()` will
	 * produce a randomized value using {@link ParamImpl.randomize}, but this
	 * value is ephemeral and will NOT modify the param's {@link Param.value}
	 * nor trigger a {@link RandomizeParamMessage} message being broadcast.
	 *
	 * **Important: It's the artist's responsibility to ensure deterministic
	 * behavior of an artwork/variation and if the `rnd` arg is used, most
	 * likely the currently configured {@link PRNG} function (aka
	 * `$genart.random.rnd`) SHOULD be used!**
	 *
	 * @param id
	 * @param timeOrRnd
	 */
	getParamValue<T extends ParamSpecs, K extends keyof T>(
		id: K,
		timeOrRnd?: number | RandomFn
	): ParamValue<T[K]>;

	/**
	 * Higher order version of {@link GenArtAPI.getParamValue}. Returns a
	 * pre-defined function to access the param for given `id` and is faster
	 * than `getParamValue()`, since internal validations will only be performed
	 * once.
	 *
	 * @example
	 * ```ts
	 * // (assuming a prior call to $genart.setParams() already happened...)
	 *
	 * // create a pre-validated getter for param "A"
	 * const paramA = $genart.paramValueGetter("A");
	 *
	 * // get A's current value
	 * const valueA = paramA();
	 *
	 * // get A's value at time = 1000 (only for time-based params)
	 * const valueA = paramA(1000);
	 *
	 * // get a randomized value of A (without changing it's stored value)
	 * const valueA = paramA($genart.random.rnd);
	 * ```
	 *
	 * @param id
	 */
	paramValueGetter<T extends ParamSpecs, K extends keyof T>(
		id: K
	): (opt?: number | RandomFn) => ParamValue<T[K]>;

	/**
	 * Emits a {@link ParamErrorMessage} message (called from
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
	 * also emits a {@link TraitsMessage} message to the current & parent
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
	 * Configures optional behavior of the API. See {@link GenArtAPIOpts} and
	 * {@link ConfigureMessage} for details.
	 *
	 * @param opts
	 */
	configure(opts: Partial<GenArtAPIOpts>): void;

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
	on<T extends MessageType>(
		type: T,
		listener: (e: MessageTypeMap[T]) => void
	): void;

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
	 * {@link StateChangeMessage} message. In most cases, a platform adapter
	 * should react to this message and call {@link GenArtAPI.start} to trigger
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
	 * {@link StateChangeMessage}, as well as `genart:start` or `genart:resume`
	 * messages. Function is idempotent if API is already in `play` state.
	 *
	 * An error will be thrown if API is not in `ready` or `stop` state, i.e.
	 * the API must have a {@link PlatformAdapter}, a {@link TimeProvider} and a
	 * {@link UpdateFn} must have been configured.
	 *
	 * Whilst the animation loop is active, a {@link AnimFrameMessage} will be
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
