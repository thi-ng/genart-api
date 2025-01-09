import type { RandomFn } from "./random.js";

/**
 * Common configuration options for all parameter types. See {@link Param}.
 */
export interface ParamOpts {
	/**
	 * Human readable name/label for this parameter for external GUIs or other
	 * display purposes. If omitted, the parameter ID should be used by default.
	 */
	name: string;
	/**
	 * Brief description/documentation for external GUIs or other display
	 * purposes.
	 */
	desc: string;
	/**
	 * Optional, additional documentation/hints about this param, its role,
	 * intended usage etc. How this information is used is left to external
	 * tooling.
	 */
	doc?: string;
	/**
	 * Optional group name/key provided as hint for 3rd party tooling (e.g.
	 * editor UIs) to group param controls.
	 *
	 * @defaultValue "main"
	 */
	group: string;
	/**
	 * Optional param ordering index provided as hint for 3rd party tooling
	 * (e.g. editor UIs) to sort parameters (in ascending order).
	 *
	 * @remarks
	 * If {@link ParamOpts.group} is used, the ordering given here only applies
	 * to establish the param order in that group.
	 *
	 * **IMPORTANT**: It's highly recommended to specify this value to avoid
	 * later confusion when an artwork is published on platforms which don't
	 * support param names and/or not display their labels (e.g.
	 * [editart.xyz](https://editart.xyz)). In these cases, the order of
	 * parameters can only be deduced from the ordering specified here.
	 *
	 * @defaultValue 0
	 */
	order: number;
	/**
	 * Update mode/behavior when this param is being updated. See
	 * {@link ParamUpdateBehavior} for details.
	 *
	 * @defaultValue "event"
	 */
	update: ParamUpdateBehavior;
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
	edit: "private" | "protected" | "public";
	/**
	 * If true (default), this param's value can be randomized (but also needs
	 * to be supported by corresponding {@link ParamImpl})
	 *
	 * @defaultValue true
	 */
	randomize: boolean;
	/**
	 * Optional, non-binding hint for param editors to customize which GUI
	 * widget to use for this param. (e.g. a {@link RangeParam} might be
	 * represented as a slider by default, but offer a numeric input field for
	 * more precise inputs as alternative, esp. if the number range is very
	 * large)
	 *
	 * @defaultValue "default"
	 */
	widget: ParamWidgetType;
}

/**
 * Declarative data-only description of a single parameter declared by the art
 * work and registered via {@link GenArtAPI.setParams}.
 *
 * @remarks
 * These param objects are forming the basis for much of {@link GenArtAPI}'s
 * core features and are designed to be sendable via {@link GenArtAPI.emit}
 * messages (aka `window.postMessage()`) between different windows.
 */
export interface Param<T> extends ParamOpts {
	type: string;
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
	 * This value is only for information purposes and initialized during
	 * {@link GenArtAPI.setParams} and {@link GenArtAPI.updateParams}. See
	 * {@link ParamState} for meaning of the possible values.
	 */
	state: ParamState;
}

/**
 * Possible states a parameter can be in:
 *
 * - `custom`: The param value has been customized/overridden (by whatever
 *   means, e.g. via platform adapter)
 * - `default`: The param uses an artist provided default value
 * - `dynamic`: The param value will only be determined via the
 *   {@link ParamImpl.read} method.
 * - `random`: The param uses a randomized default value (because the artist
 *   hasn't provided one, also see note below)
 * - `void`: The param has only been declared but not yet initialized (internal use only)
 *
 * **Note:** Artists can omit defaults only for randomizable parameter types.
 */
export type ParamState = "custom" | "default" | "dynamic" | "random" | "void";

/**
 * Value type for {@link ParamOpts.widget}.
 */
export type ParamWidgetType = "default" | "alt" | "precise";

/**
 * Value type for {@link ParamOpts.update}. Defines the update mode/behavior
 * when a param is being updated. Platform providers are responsible to honor &
 * implement this setting (if possible).
 *
 * - `reload`: the piece should be reloaded/relaunched with new param value (a
 *   manual or externally triggered reload might be required for some
 *   platforms).
 * - `event`: the API will trigger a {@link ParamChangeMessage} via
 *   {@link GenArtAPI.emit}.
 */
export type ParamUpdateBehavior = "reload" | "event";

/**
 * {@link ParamOpts} field names which are optional in {@link BaseParam} and
 * param factory functions.
 */
export type BaseParamOptionals =
	| "desc"
	| "edit"
	| "group"
	| "order"
	| "randomize"
	| "update"
	| "widget";

export type BaseParam<T extends Param<any>, EXCLUDE extends string = ""> = Omit<
	T,
	"type" | "state" | BaseParamOptionals | EXCLUDE
> &
	Partial<Omit<Pick<ParamOpts, BaseParamOptionals>, EXCLUDE>>;

/**
 * Parameter type for big integer values. Randomizable by default. Factory
 * function: {@link ParamFactories.bigint}.
 */
export interface BigIntParam extends Param<bigint> {
	type: "bigint";
	/**
	 * Min value.
	 *
	 * @default 0n
	 */
	min: bigint;
	/**
	 * Max value.
	 *
	 * @default 0xffff_ffff_ffff_ffffn
	 */
	max: bigint;
}

/**
 * Parameter type for binary data (byte arrays). Non-randomizable. Factory
 * function: {@link ParamFactories.binary}.
 */
export interface BinaryParam extends Param<Uint8Array> {
	type: "binary";
	/**
	 * Min number of bytes.
	 *
	 * @defaultValue 0
	 */
	minLength: number;
	/**
	 * Max number of bytes.
	 *
	 * @defaultValue 1024
	 */
	maxLength: number;
}

/**
 * Choice/enum parameter for string-based values/options. Randomizable by
 * default. Factory function: {@link ParamFactories.choice}.
 *
 * @remarks
 * Also see {@link WeightedChoiceParam} for alternative.
 */
export interface ChoiceParam<T extends string> extends Param<T> {
	type: "choice";
	/**
	 * List of possible choices/options, each given either as string or as
	 * 2-tuple of `[value, label]`. If no label is specified for an option, it's
	 * value will be used instead.
	 */
	options: (T | [T, string])[];
}

/**
 * CSS hex color parameter. Randomizable. Factory function:
 * {@link ParamFactories.color}
 *
 * @remarks
 * CSS hex color value (6 digits only). Other/newer color types (e.g. `oklch()`)
 * might be supported later, but currently omitted due to lack of native browser
 * widgets for editing these colors...
 */
export interface ColorParam extends Param<string> {
	type: "color";
}

/**
 * Date parameter providing JS `Date` values (UTC) at the resolution of full
 * days. Not randomizable by default. Factory function:
 * {@link ParamFactories.date}
 *
 * @remarks
 * Intended for long running artworks to configure an important date for state
 * or behavior changes etc.
 *
 * Also see {@link DateTimeParam} and {@link TimeParam}.
 */
export interface DateParam extends Param<Date> {
	type: "date";
}

/**
 * Date-time parameter providing JS `Date` values (UTC). Not randomizable by
 * default. Factory function: {@link ParamFactories.datetime}
 *
 * @remarks
 * Intended for long running artworks to configure an important moments for
 * state or behavior changes etc.
 *
 * Also see {@link DateParam} and {@link TimeParam}.
 */
export interface DateTimeParam extends Param<Date> {
	type: "datetime";
}

/**
 * Image parameter, i.e. an integer based pixel buffer (in different formats),
 * intended for obtaining spatially varied parameters (e.g. gradient maps).
 * Non-randomizable.
 */
export interface ImageParam
	extends Param<Uint8Array | Uint8ClampedArray | Uint32Array> {
	type: "image";
	/** Image width */
	width: number;
	/** Height width */
	height: number;
	/**
	 * Image mode:
	 *
	 * - `gray` (requires `Uint8Array` or `Uint8ClampedArray`)
	 * - `rgba` (requires `Uint32Array`)
	 */
	format: "gray" | "rgba";
}

/**
 * List parameter, holding a number of string-based values and optionally
 * supports min/max list sizes. Not randomizable by default.
 */
export interface StringListParam<T extends string> extends Param<T[]> {
	type: "strlist";
	/** Minimum list size */
	minLength: number;
	/** Maximum list size */
	maxLength: number;
	/** Regexp or string-encoded regexp pattern */
	match?: string | RegExp;
}

/**
 * List parameter, holding a number of numeric values and optionally supports
 * min/max list sizes. Not randomizable by default.
 */
export interface NumListParam extends Param<number[]> {
	type: "numlist";
	/** Minimum list size */
	minLength: number;
	/** Maximum list size */
	maxLength: number;
}

/**
 * Ramp parameter, a curve defined by stops/keyframes in the closed [0,1]
 * interval (each a `[pos,value]`-tuple). Unlike other built-in param types, the
 * actual value of a ramp will be dynamically sampled from its curve by
 * providing a `time` arg (clamped to the [0,1] range) to the getter function
 * returned by {@link GenArtAPI.setParams}) (or when calling
 * {@link GenArtAPI.getParamValue} or {@link GenArtAPI.paramValueGetter}
 * directly). Not randomizable by default.
 *
 * Factory function: {@link ParamFactories.ramp}
 */
export interface RampParam extends Param<number> {
	type: "ramp";
	/**
	 * Ramp curve control points. A flat array of alternating `time`, `value`
	 * pairs, where `time` is normalized in [0,1] range.
	 */
	stops: number[];
	/**
	 * Ramp interpolation mode to obtain curve values between stops/keyframes.
	 *
	 * @defaultValue "linear"
	 */
	mode?: "linear" | "smooth" | "exp";
}

/**
 * Numeric param within a defined min/max range and optional step size.
 * Randomizable by default. Factory function: {@link ParamFactories.range}
 */
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
	 * @defaultValue 100
	 */
	max: number;
	/**
	 * Step value, i.e. the final param value will be:
	 * `value = clamp(round(value, step), min, max)`
	 *
	 * @defaultValue 1
	 */
	step: number;
	/**
	 * Optional exponent for hinting GUI param editors to use an exponential
	 * slider/controller (if available) to adjust the param value.
	 *
	 * @remarks
	 * If this option is respected, a GUI controller should internally model its
	 * value in the [0,1] range and then use the following formula to compute
	 * the actual param value:
	 *
	 * ```
	 * paramValue = min + (max - min) * (sliderValue ** exponent)
	 * ```
	 *
	 * Using this formula, exponents > 1 will cause an "ease-in"
	 * behavior/mapping, whilst exponents in the (0,1) range will cause
	 * "ease-out" curvature. If not given, a default exponent of 1 is assumed,
	 * resulting in linear mapping.
	 *
	 * @defaultValue 1
	 */
	exponent?: number;
}

/**
 * Text/string param with optional min/max length and/or regexp validation
 * pattern. Not randomizable by default. Factory function:
 * {@link ParamFactories.text}
 */
export interface TextParam extends Param<string> {
	type: "text";
	/**
	 * Minimum length
	 *
	 * @defaultValue 0
	 */
	minLength: number;
	/**
	 * Maximum length
	 *
	 * @defaultValue 32
	 */
	maxLength: number;
	/**
	 * Hint for param editors to provide multiline input
	 *
	 * @defaultValue false
	 */
	multiline?: boolean;
	/** Regexp or string-encoded regexp pattern */
	match?: RegExp | string;
}

/**
 * Parameter providing time-of-day values (local time at the deployment
 * target/client) in the form of a 3-tuple: `[hour, minute, second]` (24h format
 * only). Randomizable by default.
 *
 * @remarks
 * Intended for long running artworks to configure an important time in the day
 * for state or behavior changes etc. (e.g. scheduling daily sleep mode)
 *
 * Also see {@link DateParam} and {@link DateTimeParam}.
 */
export interface TimeParam extends Param<[number, number, number]> {
	type: "time";
}

/**
 * On/off switch/toggle (boolean) parameter type. Randomizable by default.
 * Factory function: {@link ParamFactories.toggle}
 */
export interface ToggleParam extends Param<boolean> {
	type: "toggle";
}

/**
 * n-dimensional vector parameter type. Randomizable by default. Factory
 * function: {@link ParamFactories.vector}
 *
 * @remarks
 * Also see {@link XYParam} for alternative.
 */
export interface VectorParam extends Param<number[]> {
	type: "vector";
	/**
	 * Vector dimensions/size. Required.
	 */
	size: number;
	/**
	 * Minimum vector value. Each vector component should be a multiple of
	 * {@link VectorParam.step}.
	 *
	 * @defaultValue 0
	 */
	min: number[];
	/**
	 * Maximum vector value. Each vector component should be a multiple of
	 * {@link VectorParam.step}.
	 *
	 * @defaultValue 1
	 */
	max: number[];
	/**
	 * Step vector value.
	 *
	 * @defaultValue 0.01
	 */
	step: number[];
	/**
	 * Semi-optional array of labels for the different vector components. If not
	 * given, the following label sets are used:
	 *
	 * - 2d: ["X", "Y"]
	 * - 3d: ["X", "Y", "Z"]
	 * - 4d: ["X", "Y", "Z", "W"]
	 * - nd: must be defined by artist (error, if missing)
	 */
	labels: string[];
}

/**
 * Choice/enum parameter for string-based values/options with associated weights
 * to control randomization behavior. Randomizable by default. Factory function:
 * {@link ParamFactories.weighted}
 *
 * @remarks
 * Also see {@link ChoiceParam} for alternative.
 *
 * This param type is identical to {@link ChoiceParam} excluding the case when
 * this param is evaluated with an optional {@link RandomFn} given to
 * {@link GenArtAPI.getParamValue} (aka the param accessor function returned by
 * {@link GenArtAPI.setParams}). In that case a random parameter value is
 * produced with a probability distribution defined by the relative weights
 * given to each option.
 */
export interface WeightedChoiceParam<T extends string> extends Param<T> {
	type: "weighted";
	/**
	 * List of possible choices/options, each with associated weight. Each
	 * option is defined as 3-tuple of `[weight, value, label]` (labels are
	 * optional).
	 */
	options: [number, T, string?][];
	/**
	 * Total sum of weights (will be precomputed by factory function).
	 *
	 * @internal
	 */
	total: number;
}

/**
 * 2D dimensional vector param with values in the closed [0,1] interval. Useful
 * to control two co-dependent parameters using an XY controller/touchpad (the
 * recommended UI widget for this param type). Randomizable by default. Factory
 * function: {@link ParamFactories.xy}
 */
export interface XYParam extends Param<[number, number]> {
	type: "xy";
}

export type ParamSpecs = Record<string, Param<any>>;

export type NestedParamSpecs = Record<string, NestedParam>;

export type NestedParam = Param<any> & { __params?: NestedParamSpecs };

export type ParamValues<T extends ParamSpecs> = {
	[id in keyof T]: ParamValue<T[id]>;
};

export type ParamValue<T extends Param<any>> = NonNullable<T["value"]>;

/**
 * Set of functions used to implement a parameter type.
 */
export interface ParamImpl<T = any> {
	/**
	 * Called from {@link GenArtAPI.setParamValue} to pre-validate a given value
	 * before updating a param spec. Returns true if the given value can be used
	 * for updating a param spec directly or via {@link ParamImpl.coerce}.
	 *
	 * @remarks
	 * If this validator returns false, the param update will be terminated
	 * immediately and {@link GenArtAPI.setParamValue} will emit a
	 * {@link ParamErrorMessage} message (by default).
	 *
	 * @param spec
	 * @param value
	 */
	validate: (spec: Readonly<Param<T>>, value: any) => boolean;
	/**
	 * Called from {@link GenArtAPI.setParamValue}, this function is used to
	 * coerce (or otherwise prepare) the given `value` in a type-specific,
	 * undisclosed manner. The returned value is then assigned to the param
	 * spec.
	 *
	 * @remarks
	 * The `value` given will already have passed the {@link ParamImpl.validate}
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
	/**
	 * Optional parameter specs for composite or nested params. These nested
	 * params can be used to define constraints and possible controls for
	 * aspects of the main parameter.
	 *
	 * @remarks
	 * For example, conceptually, a {@link RampParam} is a composite of
	 * {@link RampParam.stops} (a {@link NumListParam}) and
	 * {@link RampParam.mode} (a {@link ChoiceParam}).
	 *
	 * These param specs can be used to delegate {@link ParamImpl} tasks to the
	 * implementations of those embedded params.
	 */
	params?: ParamSpecs;
}

export interface ParamFactories {
	/**
	 * Factory function to define a {@link BigIntParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.bigint({
	 *     name: "Test",
	 *     desc: "Binary data",
	 *     default: 0x1234_5678_9abc_deffn,
	 * });
	 * ```
	 *
	 * @param spec
	 */
	bigint(
		spec: BaseParam<BigIntParam, "min" | "max"> &
			Partial<Pick<BigIntParam, "min" | "max">>
	): BigIntParam;

	/**
	 * Factory function to define a {@link BinaryParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.binary({
	 *     name: "Test",
	 *     desc: "Binary data",
	 *     default: new Uint8Array([0xde, 0xca, 0xfb, 0xad]),
	 * });
	 * ```
	 *
	 * @param spec
	 */
	binary(
		spec: BaseParam<BinaryParam, "minLength" | "maxLength" | "randomize"> &
			Partial<Pick<BinaryParam, "minLength" | "maxLength">>
	): BinaryParam;

	/**
	 * Factory function to define a {@link ChoiceParam}.
	 *
	 * @remarks
	 * Also see {@link ParamFactories.weighted} for alternative.
	 *
	 * @example
	 * ```ts
	 * $genart.params.choice({
	 *     name: "Test",
	 *     desc: "Color theme",
	 *     default: "dark",
	 *     options: ["dark", "light", "radiant"]
	 * });
	 * ```
	 *
	 * @param spec
	 */
	choice<T extends string>(spec: BaseParam<ChoiceParam<T>>): ChoiceParam<T>;

	/**
	 * Factory function to define a {@link ColorParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.color({
	 *     name: "Test",
	 *     desc: "Base color",
	 *     default: "#aabbcc",
	 * });
	 * ```
	 *
	 * @param spec
	 */
	color(spec: BaseParam<ColorParam>): ColorParam;

	/**
	 * Factory function to define a {@link DateParam}.
	 *
	 * @remarks
	 * If `default` is given as string, it must be in `yyyy-MM-dd` format.
	 *
	 * Also see {@link ParamFactories.datetime} and {@link ParamFactories.time}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.date({
	 *     name: "Test",
	 *     desc: "End of license date",
	 *     default: new Date(Date.UTC(2025, 0, 1)),
	 * });
	 * ```
	 *
	 * @param spec
	 */
	date(spec: BaseParam<DateParam> & { default: Date | string }): DateParam;

	/**
	 * Factory function to define a {@link DateTimeParam}.
	 *
	 * @remarks
	 * If `default` is given as string, it must be in ISO8601 format, e.g.
	 * `yyyy-MM-ddTHH:mm:ssZ`.
	 *
	 * Also see {@link ParamFactories.date} and {@link ParamFactories.time}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.datetime({
	 *     name: "Test",
	 *     desc: "End of license date",
	 *     default: new Date(Date.UTC(2025, 0, 1)),
	 * });
	 * ```
	 *
	 * @param spec
	 */
	datetime(
		spec: BaseParam<DateTimeParam> & { default: Date | string }
	): DateTimeParam;

	/**
	 * Factory function to define a {@link ImageParam}.
	 *
	 * $genart.params.image({
	 *     name: "Test",
	 *     desc: "Test gradient",
	 *     width: 6,
	 *     height: 1,
	 *     default: new Uint8Array([0x00, 0x33, 0x66, 0x99, 0xcc, 0xff]),
	 * });
	 * ```
	 *
	 * @param spec
	 */
	image(spec: BaseParam<ImageParam>): ImageParam;

	/**
	 * Factory function to define a {@link NumListParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.numlist({
	 *     name: "Test",
	 *     desc: "Numbers",
	 *     default: [23, 42, 66],
	 * });
	 * ```
	 *
	 * @param spec
	 */
	numlist(
		spec: BaseParam<NumListParam, "minLength" | "maxLength"> &
			Partial<Pick<NumListParam, "minLength" | "maxLength">>
	): NumListParam;

	/**
	 * Factory function to define a {@link StringListParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.strlist({
	 *     name: "Test",
	 *     desc: "Names",
	 *     default: ["alice", "bob", "charlie"],
	 * });
	 * ```
	 *
	 * @param spec
	 */
	strlist<T extends string>(
		spec: BaseParam<StringListParam<T>, "minLength" | "maxLength"> &
			Partial<Pick<StringListParam<T>, "minLength" | "maxLength">>
	): StringListParam<T>;

	/**
	 * Factory function to define a {@link RampParam}.
	 *
	 * @remarks
	 * If `stops` are given, at least 2 pairs need to be provided. Internally,
	 * these stops are stored flattened (see {@link RampParam.stops} for
	 * details), but here they must be provided as array of tuples (as shown in
	 * the example below).
	 *
	 * @example
	 * ```ts
	 * // ramp parameter defining a triangular shape "/\"
	 * const param = $genart.setParams({
	 *     test: $genart.params.ramp({
	 *         name: "Test",
	 *         desc: "A simple triangle curve",
	 *         stops: [[0, 0], [0.5, 1], [1, 0]]
	 *     })
	 * });
	 *
	 * // read param @ t=0.25
	 * param("test", 0.25)
	 * // 0.5
	 *
	 * // read param @ t=0.25
	 * param("test", 0.6)
	 * // 0.8
	 * ```
	 *
	 * @param spec
	 */
	ramp(
		spec: BaseParam<RampParam, "stops"> & { stops?: [number, number][] }
	): RampParam;

	/**
	 * Factory function to define a {@link RangeParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.range({
	 *     name: "Test",
	 *     desc: "Pick a number between 0-100",
	 *     min: 0,
	 *     max: 100,
	 *     step: 5,
	 * });
	 * ```
	 *
	 * @param spec
	 */
	range(
		spec: BaseParam<RangeParam, "min" | "max" | "step"> &
			Partial<Pick<RangeParam, "min" | "max" | "step">>
	): RangeParam;

	/**
	 * Factory function to define a {@link TextParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.text({
	 *     name: "Test",
	 *     desc: "Seed phrase",
	 *     maxLength: 256,
	 *     match: "^[a-z ]+$",
	 *     multiline: true,
	 * });
	 * ```
	 *
	 * @param spec
	 */
	text(
		spec: BaseParam<TextParam, "minLength" | "maxLength"> &
			Partial<Pick<TextParam, "minLength" | "maxLength">> & {
				default: string;
			}
	): TextParam;

	/**
	 * Factory function to define a {@link TimeParam}.
	 *
	 * @remarks
	 * Also see {@link ParamFactories.datetime} and {@link ParamFactories.date}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.time({
	 *     name: "Test",
	 *     desc: "Sleep mode time",
	 *     default: [22, 30, 0],
	 * });
	 * ```
	 *
	 * @param spec
	 */
	time(spec: BaseParam<TimeParam>): TimeParam;

	/**
	 * Factory function to define a {@link ToggleParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.toggle({
	 *     name: "Test",
	 *     desc: "Switch",
	 *     default: true,
	 * });
	 * ```
	 *
	 * @param spec
	 */
	toggle(spec: BaseParam<ToggleParam>): ToggleParam;

	/**
	 * Factory function to define an n-dimensional {@link VectorParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.vector({
	 *     name: "Test",
	 *     desc: "3D vector",
	 *     size: 3,
	 *     min: -1,
	 *     max: 1,
	 *     step: [0.1, 0.2, 0.5],
	 *     default: [0, 0, 0]
	 * });
	 * ```
	 *
	 * @param spec
	 */
	vector(
		spec: BaseParam<VectorParam, "min" | "max" | "step" | "labels"> & {
			min?: number | number[];
			max?: number | number[];
			step?: number | number[];
			labels?: string[];
		}
	): VectorParam;

	/**
	 * Factory function to define a {@link WeightedChoiceParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.weighted({
	 *     name: "Test",
	 *     desc: "Weighted color options",
	 *     options: [
	 *         [8, "black"],
	 *         [4, "cyan"],
	 *         [2, "magenta"],
	 *         [1, "yellow"],
	 *     ],
	 * });
	 *
	 * // optionally, labels can be provided for each option
	 * $genart.params.weighted({
	 *     name: "Test",
	 *     desc: "Weighted color options with labels",
	 *     options: [
	 *         [8, "#000", "black"],
	 *         [4, "#0ff", "cyan"],
	 *         [2, "#f0f", "magenta"],
	 *         [1, "#ff0", "yellow"],
	 *     ],
	 * });
	 * ```
	 *
	 * @param spec
	 */
	weighted<T extends string>(
		spec: BaseParam<WeightedChoiceParam<T>, "total">
	): WeightedChoiceParam<T>;

	/**
	 * Factory function to define a {@link XYParam}.
	 *
	 * @example
	 * ```ts
	 * $genart.params.xy({
	 *     name: "Test",
	 *     desc: "Bottom-left: [dark,dry] / Top-right: [bright,wet]",
	 *     default: [0.5, 0.5],
	 * });
	 * ```
	 *
	 * @param spec
	 */
	xy(spec: BaseParam<XYParam>): XYParam;
}
