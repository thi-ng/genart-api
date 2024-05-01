import type * as params from "./params.js";
import type * as math from "./math.js";

export type NumOrString = number | string;
export type Maybe<T> = T | undefined;

export type RandomFn = () => number;

export type UpdateFn = (t: number, frame: number) => void;

export type RunMode = "play" | "capture" | "mint";

export type RunState = "init" | "ready" | "play" | "stop" | "error";

export interface GenArtAPI {
	id?: string;
	readonly mode: RunMode;
	readonly screen: ScreenConfig;
	readonly random: PRNG;
	readonly state: RunState;

	readonly params: typeof params;
	readonly math: typeof math;

	registerParamType(type: string, impl: ParamImpl): void;

	setParams<P extends ParamSpecs>(
		specs: P
	): <K extends keyof P>(id: K, t?: number) => ParamValue<P[K]>;

	setAdapter(adapter: PlatformAdapter): void;
	waitForAdapter(): Promise<void>;

	setTimeProvider(time: TimeProvider): void;
	waitForTimeProvider(time: TimeProvider): Promise<void>;

	updateParams(notify?: boolean): void;

	updateParam(id: string, spec: Param<any>, notify?: boolean): void;

	getParamValue<T extends ParamSpecs, K extends keyof T>(
		id: K,
		t?: number
	): ParamValue<T[K]>;

	on<T extends EventType>(
		type: T,
		listener: (e: EventTypeMap[T]) => void
	): void;

	emit<T extends APIEvent>(e: T, target?: "self" | "parent" | "all"): void;

	setUpdate(fn: UpdateFn): void;

	start(resume?: boolean): void;
	stop(): void;

	capture(): void;
}

export interface APIEvent {
	type: EventType;
	id?: string;
	/** @internal */
	__self?: true;
}

export interface ParamChangeEvent extends APIEvent {
	paramID: string;
	spec: any;
}

export interface EventTypeMap {
	"genart:paramchange": ParamChangeEvent;
	"genart:start": APIEvent;
	"genart:resume": APIEvent;
	"genart:stop": APIEvent;
	"genart:capture": APIEvent;
}

export type EventType = keyof EventTypeMap;

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
