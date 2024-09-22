import type { Maybe, RandomFn } from "../api.js";

/**
 * Declarative data-only description of a single parameter declared by the art
 * work and registered via {@link GenArtAPI.setParams}.
 *
 * @remarks
 * These param objects are forming the basis for much of {@link GenArtAPI}'s
 * core features and are designed to be sendable via {@link GenArtAPI.emit}
 * messages (aka `window.postMessage()`) between different windows.
 */
export interface Param<T> {
	type: string;
	/**
	 * Human readable name/label for this parameter for external GUIs or other
	 * display purposes. If omitted, the parameter ID should be used by default.
	 */
	name?: string;
	/**
	 * Brief description/documentation for external GUIs or other display
	 * purposes.
	 */
	desc: string;
	/**
	 * Optional, additional documentation/hints about this param, its role,
	 * usage etc.
	 */
	doc?: string;
	/**
	 * Default value. If omitted, a randomized default value will be generated,
	 * iff the param type DOES provide a {@link ParamImpl.randomize} function.
	 * Otherwise, {@link GenArtAPI.setParams} will throw an error if no default is
	 * given and the param type ISN'T randomizable.
	 *
	 * @remarks
	 * Randomization of default values will use the {@link GenArtAPI.random}
	 * PRNG to ensure deterministic behavior.
	 */
	default?: T;
	/**
	 * Current param value, potentially randomized, or provided/customized via
	 * external, platform specific means (e.g. param editors, stored variations).
	 */
	value?: T;
	/**
	 * Update mode/behavior when this param is being updated.
	 *
	 * - `reload`: the piece should be reloaded/relaunched with new param value
	 *   (platform providers are responsible to honor & implement this)
	 * - `event`: the API will trigger a {@link ParamChangeMsg} via
	 *   {@link GenArtAPI.emit}
	 *
	 * @defaultValue "event"
	 */
	update?: "reload" | "event";
	/**
	 * Defines which party or agent should be able to edit this parameter.
	 *
	 * @remarks
	 * The interpretation of this value is platform specific, but generally
	 * should be honored by a platform and align with:
	 *
	 * - `private`: artist-only modifications
	 * - `protected`: artists and trusted parties (curator/gallery)
	 * - `public`: collectors/viewers
	 *
	 * @defaultValue "protected"
	 */
	edit?: "private" | "protected" | "public";
	/**
	 * If true (default), this param's value can be randomized (but also needs
	 * to be supported by corresponding {@link ParamImpl})
	 *
	 * @defaultValue true
	 */
	randomize?: boolean;
}

export type BaseParam<T extends Param<any>, EXCLUDE extends string = ""> = Omit<
	T,
	"type" | EXCLUDE
>;

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
	/**
	 * Minimum value (should be a multiple of {@link RangeParam.step}).
	 *
	 * @defaultValue 0
	 */
	min: number;
	/**
	 * Maximum value (should be a multiple of {@link RangeParam.step}).
	 *
	 * @defaultValue 0
	 */
	max: number;
	/**
	 * Step value, i.e. the final param value will be:
	 * `value = clamp(round(value, step), min, max)`
	 *
	 * @defaultValue 1
	 */
	step?: number;
	/**
	 * Optional exponent for defining exponential and hinting GUI param editors
	 * to use an exponential slider/controller (if available) to adjust the
	 * param value.
	 *
	 * @remarks
	 * If used, a GUI controller should internally operate in the [0,1] range
	 * and use the following formula to compute the actual param value:
	 *
	 * ```
	 * paramValue = min + (max - min) * (sliderValue ** exponent)
	 * ```
	 *
	 * Using this formula, exponents > 1 will cause an "ease-in"
	 * behavior/mapping, whilst exponents in the (0,1) range will cause
	 * "ease-out".
	 */
	exponent?: number;
}

export interface TextParam extends Param<string> {
	type: "text";
	/** Minimum length */
	min?: number;
	/** Maximum length */
	max?: number;
	/** Hint for param editors to provide multiline input */
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
export interface ParamImpl<T = any> {
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
	 * Used for param types which produce time-based values and only can provide
	 * values indirectly, derived from the param's other config options (e.g. a
	 * {@link RampParam}'s curve control points). If given, this function will
	 * be called from {@link GenArtAPI.getParamValue} to compute a value for
	 * given time `t` (where `t` is usually in the [0,1] range).
	 *
	 * @remarks
	 * If this function is not given, {@link GenArtAPI.getParamValue} will
	 * simply return {@link Param.value} or fallback to {@link Param.default}.
	 *
	 * @param spec
	 * @param t
	 */
	read?: (spec: Readonly<Param<T>>, t: number) => T;
}
