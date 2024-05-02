import type * as params from "./params.js";
import type * as math from "./math.js";

export type NumOrString = number | string;
export type Maybe<T> = T | undefined;

export type RandomFn = () => number;

export type UpdateFn = (t: number, frame: number) => void;

export type RunMode = "play" | "capture" | "mint";

export type RunState = "init" | "ready" | "play" | "stop";

export interface GenArtAPI {
	id?: string;
	readonly mode: RunMode;
	readonly screen: ScreenConfig;
	readonly random: PRNG;
	readonly state: RunState;

	readonly params: typeof params;
	readonly math: typeof math;

	registerParamType(type: string, impl: ParamImpl): void;

	/**
	 * Called during initialization of the art piece to declare all of its
	 * available parameters, their configs and default values. If the platform
	 * adapter is already set (via {@link GenArtAPI.setAdapter}), this function
	 * also calls {@link GenArtAPI.updateParams} to apply any param
	 * customizations/overrides sourced via the adapter. Then posts a
	 * {@link SetParamsMsg} message to current & parent window, for other
	 * software components to be notified (e.g. param editors)
	 *
	 * Returns a typesafe getter function (based on the declared param specs) to
	 * obtain (possibly time-based) param values (wraps
	 * {@link GenArtAPI.getParamValue}).
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

	/**
	 * Called from {@link GenArtAPI.updateParams} to apply any param
	 * customizations/overrides sourced via the adapter.
	 *
	 * @remarks
	 * If {@link GenArtAPI.state} is `ready`, `play`, `stop`, posts a
	 * {@link ParamChangeMsg} message to current window if the param's value has
	 * been updated.
	 *
	 * @param id
	 * @param spec
	 */
	updateParam(id: string, spec: Param<any>, notify?: boolean): void;

	getParamValue<T extends ParamSpecs, K extends keyof T>(
		id: K,
		t?: number
	): ParamValue<T[K]>;

	on<T extends MessageType>(
		type: T,
		listener: (e: MessageTypeMap[T]) => void
	): void;

	emit<T extends APIMessage>(e: T, notify?: NotifyType): void;

	setUpdate(fn: UpdateFn): void;

	start(resume?: boolean): void;
	stop(): void;

	capture(): void;
}

export interface APIMessage {
	type: MessageType;
	apiID?: string;
	/** @internal */
	__self?: boolean;
}

export interface ParamChangeMsg extends APIMessage {
	paramID: string;
	spec: any;
}

export interface SetParamsMsg extends APIMessage {
	params: Record<string, Param<any>>;
}

export interface MessageTypeMap {
	"genart:setparams": SetParamsMsg;
	"genart:paramchange": ParamChangeMsg;
	"genart:start": APIMessage;
	"genart:resume": APIMessage;
	"genart:stop": APIMessage;
	"genart:capture": APIMessage;
}

export type MessageType = keyof MessageTypeMap;
export type MessageSource = "api" | "adapter" | "art";

export type NotifyType = "self" | "parent" | "all";

export interface Param<T> {
	type: string;
	doc: string;
	tooltip?: string;
	default: T;
	value?: T;
	update?: "reload" | "event";
}

export interface ChoiceParam<T extends string> extends Param<T> {
	type: "choice";
	options: (T | [T, string])[];
}

export interface ColorParam extends Param<string> {
	type: "color";
	options?: string[];
}

export interface RampParam extends Param<number> {
	type: "ramp";
	stops: [number, number][];
	mode?: "linear" | "smooth";
}

export interface RangeParam extends Param<number> {
	type: "range";
	min: number;
	max: number;
	step?: number;
	exp?: number;
}

export interface TextParam extends Param<string> {
	type: "text";
	min?: number;
	max?: number;
	multiline?: boolean;
	/** String-encoded regexp pattern */
	match?: string;
}

export interface ToggleParam extends Param<boolean> {
	type: "toggle";
}

export interface WeightedChoiceParam<T extends string> extends Param<T> {
	type: "weighted";
	options: [number, T, string?][];
	total: number;
}

export interface XYParam extends Param<[number, number]> {
	type: "xy";
}

export type ParamSpecs = Record<string, Param<any>>;

export type ParamValues<T extends ParamSpecs> = {
	[id in keyof T]: ParamValue<T[id]>;
};

export type ParamValue<T extends Param<any>> = NonNullable<T["value"]>;

export type ParamImpl<T = any> = (
	spec: Param<T>,
	t: number,
	rnd: RandomFn
) => T;

export interface TimeProvider {
	start(fn: UpdateFn): void;
	next(fn: () => void): void;
	tick(): [number, number];
}

export interface PlatformAdapter {
	readonly mode: RunMode;
	readonly screen: ScreenConfig;
	readonly prng: PRNG;

	updateParam(id: string, spec: Param<any>): boolean;
	capture(): void;
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
