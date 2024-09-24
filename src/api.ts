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
import type { Utils } from "./api/utils.js";

export * from "./api/math.js";
export * from "./api/messages.js";
export * from "./api/params.js";
export * from "./api/utils.js";

export type NumOrString = number | string;
export type Maybe<T> = T | undefined;

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
 * Animation update/draw function. See {@link GenArtAPI.setUpdate}. If the
 * function returns false, the animation loop will be stopped (via
 * {@link GenArtAPI.stop}), otherwise the loop continues until stopped
 * explicitly.
 */
export type UpdateFn = (time: number, frame: number) => boolean;

/**
 * Platform defined presentation mode for the artwork:
 *
 * - `play`: default mode
 * - `preview`: capturing, minting, thumbnail, etc.
 * - `edit`: platform has param editor active
 */
export type RunMode = "play" | "preview" | "edit";

export type APIState = "init" | "ready" | "play" | "stop" | "error";

export type Features = Record<string, number | string | boolean>;

export interface GenArtAPI {
	id?: string;
	/**
	 * Current deploy/run mode, defined by {@link PlatformAdapter.mode}.
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
	readonly time: Maybe<TimeProvider>;

	readonly math: MathOps;
	readonly params: ParamFactories;
	readonly utils: Utils;

	/**
	 * Registers a new parameter type and its implementation. Supports
	 * overriding default types, but prints a warning in the console when doing
	 * so...
	 *
	 * @remarks
	 * When a platform registers any own types, it SHOULD consider namespacing
	 * the the `type` name, e.g. `platformname:customtype`.
	 *
	 * See {@link ParamImpl} for implementation details.
	 *
	 * @param type
	 * @param impl
	 */
	registerParamType(type: string, impl: ParamImpl): void;

	/**
	 * Called during initialization of the art piece to declare all of its
	 * available parameters, their configurations and (optional) default values.
	 *
	 * @remarks
	 * If the {@link PlatformAdapter} is already set (via
	 * {@link GenArtAPI.setAdapter}), this function also calls & waits for
	 * {@link PlatformAdapter.setParams} to pre-initialize platform-specific
	 * param handling and then calls {@link GenArtAPI.updateParams} to apply any
	 * param customizations/overrides sourced via the adapter. Once done, it
	 * then sends a {@link SetParamsMsg} message to the current & parent window
	 * for other software components to be notified (e.g. param editors)
	 *
	 * Regardless of the above behavior, this function returns a promise of a
	 * typesafe getter function (based on the declared param specs) to obtain
	 * param values (wraps {@link GenArtAPI.getParamValue}). For some param
	 * types (e.g. {@link RampParam}), these value lookups can be time-based or
	 * randomized (for param types which support randomization).
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
	setParams<P extends ParamSpecs>(
		params: P
	): Promise<
		<K extends keyof P>(
			id: K,
			t?: number,
			rnd?: PRNG["rnd"]
		) => ParamValue<P[K]>
	>;

	setAdapter(adapter: PlatformAdapter): void;
	waitForAdapter(): Promise<void>;

	setTimeProvider(time: TimeProvider): void;
	waitForTimeProvider(time: TimeProvider): Promise<void>;

	/**
	 * Called from {@link GenArtAPI.setParams} or from {@link PlatformAdapter}
	 * to apply any param customizations/overrides sourced via the adapter.
	 *
	 * @remarks
	 * If {@link GenArtAPI.state} is `ready`, `play`, `stop`, posts
	 * {@link ParamChangeMsg} messages to the current window for each param
	 * whose value has been updated.
	 *
	 * @param notify
	 */
	updateParams(notify?: NotifyType): Promise<void>;

	setParamValue(
		id: string,
		value: any,
		key?: string,
		notify?: NotifyType
	): void;

	randomizeParamValue(id: string, rnd?: RandomFn, notify?: NotifyType): void;

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
	getParamValue<T extends ParamSpecs, K extends keyof T>(
		id: K,
		t?: number,
		rnd?: PRNG["rnd"]
	): ParamValue<T[K]>;

	/**
	 * Emits a {@link ParamErrorMsg} message (called from
	 * {@link GenArtAPI.setParamValue}, if needed, but can be triggered by
	 * others too...)
	 *
	 * @param id
	 */
	paramError(id: string): void;

	/**
	 * (Optionally) Called by the artwork to declare a number of "features"
	 * (aka generated metadata) which should be exposed to the
	 * platform/users/collectors, e.g. to compute the rarity of a variation. The
	 * keys in this object are feature names, their values can be arbitrary
	 * strings, numbers or booleans.
	 *
	 * @remarks
	 * Usually these features are derived from the random seed and currently
	 * configured parameters. The API will forward this object to
	 * {@link PlatformAdapter.setFeatures} for platform-specific processing, but
	 * also emits a {@link SetFeaturesMsg} message to the current & parent
	 * windows.
	 *
	 * @example
	 * ```ts
	 * $genart.setFeatures({
	 *   mood: "bright",
	 *   shapes: "triangles",
	 *   density: 100,
	 *   slowmotion: true
	 * });
	 * ```
	 *
	 * @param features
	 */
	setFeatures(features: Features): void;

	on<T extends MessageType>(
		type: T,
		listener: (e: MessageTypeMap[T]) => void
	): void;

	emit<T extends APIMessage>(e: T, notify?: NotifyType): void;

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

export interface PlatformAdapter {
	readonly mode: RunMode;
	readonly screen: ScreenConfig;
	readonly prng: PRNG;

	/**
	 * Called by {@link GenArtAPI.setParamValue} to possibly augment/update a
	 * single param spec with any customizations sourced via platform-specific
	 * ways (e.g. from URL querystring params).
	 *
	 * @remarks
	 * The function can return one of the following:
	 * - `undefined`: no customizations found/performed
	 * - `{ value: any }`: param value override
	 * - `{ update: true }`: param spec has been modified/customized (e.g. ramp
	 *   stops)
	 *
	 * Any non-nullish value retured will be validated by the responsible
	 * {@link ParamImpl} and if successful is then updated in the param spec via
	 * {@link ParamImpl.coerce}.
	 *
	 * If this function returned a valid `value` and/or `update` flag, and if
	 * the retured value passes param type-specific validation (see
	 * {@link ParamImpl.valid}), then by default {@link GenArtAPI.setParamValue}
	 * emits a {@link ParamChangeMsg} message with the updated param spec. If
	 * this function returns a nullish result, the param will NOT be processed
	 * further.
	 *
	 * @param id
	 * @param spec
	 */
	updateParam(
		id: string,
		spec: Param<any>
	): Promise<Maybe<{ value?: any; update?: boolean }>>;

	/**
	 * Called by {@link GenArtAPI.setParams} to pass parameter specs provided by
	 * the artwork to the platform adapter to prepare itself for param
	 * initialization. The actual param value parsing/overriding then happens
	 * via {@link PlatformAdapter.updateParam}.
	 *
	 * This function is async MUST return true to indicate param
	 * pre-initialization succeeded.
	 *
	 * @param params
	 */
	setParams?(params: ParamSpecs): Promise<boolean>;

	setFeatures?(features: Features): void;

	/**
	 * Platform-specific handler to deal with capturing a thumbnail/preview of
	 * the art piece. (e.g. by sending a message to the parent window). See
	 * {@link GenArtAPI.capture}.
	 *
	 * @param el
	 */
	capture(el?: HTMLCanvasElement | SVGElement): void;
}

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

export interface ScreenConfig {
	width: number;
	height: number;
	dpr: number;
}
