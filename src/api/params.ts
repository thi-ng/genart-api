import type { RandomFn } from "../api.js";

export interface Param<T> {
	type: string;
	name?: string;
	doc: string;
	tooltip?: string;
	default: T;
	value?: T;
	update?: "reload" | "event";
}

export type BaseParam<T extends Param<any>, K extends string = ""> = Omit<
	T,
	"type" | "tooltip" | K
> & {
	tooltip?: string;
};

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
	mode?: "linear" | "smooth" | "exp";
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
	/** Regexp or string-encoded regexp pattern */
	match?: RegExp | string;
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

export type ParamImpl<T = any> = {
	valid: (spec: Param<T>, value: T) => boolean;
	coerce?: (spec: Param<T>, value: T) => T;
	randomize?: (spec: Param<T>, rnd: RandomFn) => T;
	read?: (spec: Param<T>, t: number, rnd: RandomFn) => T;
};
