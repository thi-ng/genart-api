import type * as params from "./params.js";
import type * as math from "./math.js";
import type * as utils from "./utils.js";
import type { Param, ParamImpl, ParamSpecs, ParamValue } from "./api/params.js";
import type {
	APIMessage,
	MessageType,
	MessageTypeMap,
	NotifyType,
} from "./api/messages.js";

export * from "./api/params.js";
export * from "./api/messages.js";

export type NumOrString = number | string;
export type Maybe<T> = T | undefined;

export type RandomFn = () => number;

export type UpdateFn = (t: number, frame: number) => void;

export type RunMode = "play" | "capture" | "mint";

export type RunState = "init" | "ready" | "play" | "stop";

export type Features = Record<string, number | string | boolean>;

export interface GenArtAPI {
	id?: string;
	readonly mode: RunMode;
	readonly screen: ScreenConfig;
	readonly random: PRNG;
	readonly state: RunState;

	readonly paramSpecs: ParamSpecs;
	readonly adapter: Maybe<PlatformAdapter>;
	readonly time: Maybe<TimeProvider>;

	readonly params: typeof params;
	readonly math: typeof math;
	readonly utils: typeof utils;

	/**
	 * Registers a new parameter type and its implementation. Supports
	 * overriding default types, but prints a warning in the console when doing
	 * so...
	 *
	 * @remarks
	 * When a platform registers any own types, it should consider namespacing
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
	 * available parameters, their configs and default values. If the platform
	 * adapter is already set (via {@link GenArtAPI.setAdapter}), this function
	 * also calls {@link GenArtAPI.updateParams} to apply any param
	 * customizations/overrides sourced via the adapter. Once done, it then
	 * posts a {@link SetParamsMsg} message to the current & parent window for
	 * other software components to be notified (e.g. param editors)
	 *
	 * Regardless of the above behavior, this function returns a typesafe getter
	 * function (based on the declared param specs) to obtain (possibly
	 * time-based) param values (wraps {@link GenArtAPI.getParamValue}).
	 *
	 * @example
	 * ```ts
	 * const param = $genart.setParams({
	 *   color: $genart.params.color({ doc: "brush color", default: "#ffff00" }),
	 *   size: $genart.params.range({ doc: "brush size", default: 10, min: 5, max: 50 }),
	 *   density: $genart.params.ramp({ doc: "density", stops: [[0, 0.5], [1, 1]] }),
	 * });
	 *
	 * // get possibly customized param values (typesafe)
	 * const color = param("color"); // inferred as string
	 * const size = param("size"); // inferred as number
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
	): <K extends keyof P>(id: K, t?: number) => ParamValue<P[K]>;

	setAdapter(adapter: PlatformAdapter): void;
	waitForAdapter(): Promise<void>;

	setTimeProvider(time: TimeProvider): void;
	waitForTimeProvider(time: TimeProvider): Promise<void>;

	/**
	 * Called from {@link GenArtAPI.setParams} or from {@link PlatformAdapter}
	 * to apply any param customizations/overrides sourced via the adapter (via
	 * {@link GenArtAPI.updateParam}).
	 *
	 * @remarks
	 * If {@link GenArtAPI.state} is `ready`, `play`, `stop`, posts
	 * {@link ParamChangeMsg} messages to the current window for each param
	 * whose value has been updated.
	 */
	updateParams(notify?: boolean): void;

	setParamValue(id: string, value: any, notify?: boolean): void;

	randomizeParamValue(id: string, rnd?: RandomFn, notify?: boolean): void;

	getParamValue<T extends ParamSpecs, K extends keyof T>(
		id: K,
		t?: number
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
	 * (Optionally) Called by the art work to declare a number of "features"
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

	setUpdate(fn: UpdateFn, autoStart?: boolean): void;

	start(resume?: boolean): void;
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
	start(fn: UpdateFn): void;
	next(fn: () => void): void;
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
	): Maybe<{ value?: any; update?: boolean }>;

	setFeatures(features: Features): void;

	/**
	 * Platform-specific handler to deal with capturing a thumbnail/preview of
	 * the art piece. (e.g. by sending a message to the parent window). See
	 * {@link GenArtAPI.capture}.
	 *
	 * @param el
	 */
	capture(el?: HTMLCanvasElement | SVGElement): void;
}

export interface PRNG {
	seed: string;
	rnd: () => number;
}

export interface ScreenConfig {
	width: number;
	height: number;
	dpr: number;
}
