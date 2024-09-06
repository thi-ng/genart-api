import type { Maybe, RandomFn } from "../api.js";

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

export interface DateParam extends Param<Date> {
	type: "date";
}

export interface DateTimeParam extends Param<Date> {
	type: "datetime";
}

export interface TimeParam extends Param<[number, number, number]> {
	type: "time";
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

/**
 * Set of functions used to implement a parameter type.
 */
export type ParamImpl<T = any> = {
	/**
	 * Called from {@link GenArtAPI.setParamValue} to pre-validate a given
	 * value. Returns true only if the given value can be principally used for
	 * updating this param spec using {@link ParamImpl.update} or
	 * {@link ParamImpl.coerce}.
	 *
	 * @remarks
	 * If this validator returns false, the param update will be terminated
	 * immediately and {@link GenArtAPI.setParamValue} will emit a
	 * {@link ParamErrorMsg} message (by default).
	 *
	 * @param spec
	 * @param key
	 * @param value
	 */
	valid: (
		spec: Readonly<Param<T>>,
		key: Maybe<string>,
		value: any
	) => boolean;
	/**
	 * Intended for param types which define their actual values indirectly
	 * (e.g. a {@link RampParam}'s control points). Called from
	 * {@link GenArtAPI.setParamValue}, this function is used to update the
	 * param spec with given `value` in a type-specific, undisclosed manner.
	 *
	 * @remarks
	 * The `value` given will already have passed the {@link ParamImpl.valid}
	 * check.
	 *
	 * If given, this function takes priority over {@link ParamImpl.coerce}.
	 *
	 * Of the built-in param types only {@link RangeParam} and
	 * {@link WeightedChoiceParam} make use of this type of update.
	 *
	 * @param spec
	 * @param key
	 * @param value
	 */
	update?: (spec: Param<T>, key: Maybe<string>, value: any) => void;
	/**
	 * Called from {@link GenArtAPI.setParamValue}, this function is used to
	 * coerce (or otherwise prepare) the given `value` in a type-specific,
	 * undisclosed manner. The returned value is then assigned to the param
	 * spec.
	 *
	 * @remarks
	 * The `value` given will already have passed the {@link ParamImpl.valid}
	 * check.
	 *
	 * @param spec
	 * @param value
	 */
	coerce?: (spec: Readonly<Param<T>>, value: any) => T;
	/**
	 * If given this function is used to produce a random value based on
	 * constraints of the provided param spec and MUST use the provided `rnd`
	 * random function to do so.
	 *
	 * @param spec
	 * @param rnd
	 */
	randomize?: (spec: Readonly<Param<T>>, rnd: RandomFn) => T;
	/**
	 * Used for param types which only can provide values indirectly, derived
	 * from their other config options (e.g. {@link RampParam}'s curve control
	 * points). Also if a parameter can produce time-based and/or randomized
	 * values, this function is called from {@link GenArtAPI.getParamValue} to
	 * compute a value for given `t` and/or `rnd` random function.
	 *
	 * @remarks
	 * If this function is not given, {@link GenArtAPI.getParamValue} will
	 * simply return {@link Param.value} or fallback to {@link Param.default}.
	 *
	 * Of the built-in param types only {@link RangeParam} and
	 * {@link WeightedChoiceParam} make use of this feature.
	 *
	 * @param spec
	 * @param t
	 * @param rnd
	 */
	read?: (spec: Readonly<Param<T>>, t: number, rnd: RandomFn) => T;
};
