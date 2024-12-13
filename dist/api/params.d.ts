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
    group?: string;
    /**
     * Optional param ordering index provided as hint for 3rd party tooling
     * (e.g. editor UIs) to sort parameters (in ascending order).
     *
     * @remarks
     * If {@link ParamOpts.group} is used, the ordering given here only
     * applies to establish the param order in that group.
     *
     * @defaultValue 0
     */
    order?: number;
    /**
     * Update mode/behavior when this param is being updated. Platform providers
     * are responsible to honor & implement this setting.
     *
     * - `reload`: the piece should be reloaded/relaunched with new param value
     *   (a manual or externally triggered reload might be required for some
     *   platforms).
     * - `event`: the API will trigger a {@link ParamChangeMessage} via
     *   {@link GenArtAPI.emit}.
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
    /**
     * Optional, non-binding hint for param editors to customize which GUI
     * widget to use for this param. (e.g. a {@link RangeParam} might be
     * represented as a slider by default, but offer a numeric input field for
     * more precise inputs as alternative, esp. if the number range is very
     * large)
     *
     * @defaultValue "default"
     */
    widget?: ParamWidgetType;
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
export type BaseParam<T extends Param<any>, EXCLUDE extends string = ""> = Omit<T, "type" | "state" | EXCLUDE>;
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
export interface ImageParam extends Param<Uint8Array | Uint8ClampedArray | Uint32Array> {
    type: "img";
    width: number;
    height: number;
    format: "gray" | "rgb" | "rgba";
}
export interface StringListParam<T extends string> extends Param<T[]> {
    type: "strlist";
}
export interface NumListParam extends Param<number[]> {
    type: "numlist";
}
export interface RampParam extends Param<number> {
    type: "ramp";
    /**
     * Ramp curve control points. A flat array of alternating `time`, `value`
     * pairs, where `time` is normalized in [0,1] range.
     */
    stops: number[];
    /**
     * Ramp interpolation mode.
     *
     * @defaultValue "linear"
     */
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
     * If used, a GUI controller should internally operate in the [0,1] range
     * and use the following formula to compute the actual param value:
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
export interface TimeParam extends Param<[number, number, number]> {
    type: "time";
}
export interface ToggleParam extends Param<boolean> {
    type: "toggle";
}
export interface VectorParam extends Param<number[]> {
    type: "vector";
    /**
     * Vector dimensions/size. Required.
     */
    dim: number;
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
export interface WeightedChoiceParam<T extends string> extends Param<T> {
    type: "weighted";
    options: [number, T, string?][];
    total: number;
}
export interface XYParam extends Param<[number, number]> {
    type: "xy";
}
export type ParamSpecs = Record<string, Param<any>>;
export type NestedParamSpecs = Record<string, NestedParam>;
export type NestedParam = Param<any> & {
    __params?: NestedParamSpecs;
};
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
     * {@link RampParam.stops} (a {@link StringListParam}) and
     * {@link RampParam.mode} (a {@link ChoiceParam}).
     *
     * These param specs can be used to delegate {@link ParamImpl} tasks to the
     * implementations of those embedded params.
     */
    params?: ParamSpecs;
}
export interface ParamFactories {
    /**
     * Defines a new choice/enum parameter. Only supports string values/options.
     * Randomizable.
     *
     * @param spec
     */
    choice<T extends string>(spec: BaseParam<ChoiceParam<T>>): ChoiceParam<T>;
    /**
     * Defines a new CSS hex color parameter. Randomizable.
     *
     * @remarks
     * CSS hex color value (6 digits only). Other/newer color types (e.g. `oklch()`)
     * might be supported later, but currently omitted due to lack of native browser
     * widgets for editing these colors...
     *
     * @param spec
     */
    color(spec: BaseParam<ColorParam>): ColorParam;
    /**
     * Defines a new date parameter providing `Date` values (in UTC) at the
     * resolution of full days. Not randomizable.
     *
     * @remarks
     * Intended for long running artworks to configure an important date for
     * state or behavior changes etc.
     *
     * Also see {@link ParamFactories.datetime} and {@link ParamFactories.time}.
     *
     * @param spec
     */
    date(spec: BaseParam<DateParam> & {
        default: Date;
    }): DateParam;
    /**
     * Defines a new date-time parameter providing UNIX epoch timestamps (in
     * UTC). Not randomizable.
     *
     * @remarks
     * Intended for long running artworks to configure an important moments for
     * state or behavior changes etc.
     *
     * Also see {@link ParamFactories.date} and {@link ParamFactories.time}.
     *
     * @param spec
     */
    datetime(spec: BaseParam<DateTimeParam> & {
        default: string;
    }): DateTimeParam;
    /**
     * Defines a new image parameter, i.e. an integer based pixel buffer (in
     * different formats), intended for obtaining spatially varied parameters
     * (e.g. gradient maps).
     *
     * @param spec
     */
    image(spec: BaseParam<ImageParam>): ImageParam;
    /**
     * Defines a new number list parameter. Not randomizable.
     *
     * @param spec
     */
    numlist(spec: BaseParam<NumListParam>): NumListParam;
    /**
     * Defines a new string list parameter. Not randomizable.
     *
     * @param spec
     */
    strlist<T extends string>(spec: BaseParam<StringListParam<T>>): StringListParam<T>;
    /**
     * Defines a new ramp parameter, a curve defined by stops/keyframes in the [0,1]
     * interval (each a `[pos,value]`-tuple). Unlike other param types the actual
     * value of this ramp will be sampled from the curve by providing a `time` arg
     * (also in [0,1] range) to getter function returned by
     * {@link GenArtAPI.setParams}) (or when calling {@link GenArtAPI.getParamValue}
     * directly). Not randomizable.
     *
     * @example
     * ```ts
     * // ramp parameter defining a triangular shape "/\"
     * const param = $genart.setParams({
     *     test: $genart.params.ramp({
     *         desc: "test",
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
    ramp(spec: BaseParam<RampParam, "stops"> & {
        stops?: [number, number][];
    }): RampParam;
    /**
     * Defines a numeric param within a defined `min`/`max` range and optional
     * `step` size. Randomizable.
     *
     * @example
     * ```ts
     * $genart.params.range({
     *     desc: "Pick a number between 0-100",
     *     min: 0,
     *     max: 100,
     *     step: 5,
     * });
     * ```
     *
     * @param spec
     */
    range(spec: BaseParam<RangeParam, "min" | "max" | "step"> & Partial<Pick<RangeParam, "min" | "max" | "step">>): RangeParam;
    /**
     * Defines a text/string param with optional `min`/`max` length and/or regexp
     * validation pattern. Not randomizable.
     *
     * @remarks
     * The `multiline` option is only used as hint for 3rd party tooling.
     *
     * @example
     * ```ts
     * $genart.params.text({
     *     doc: "Seed phrase",
     *     max: 256
     *     match: "^[a-z ]+$"
     *     multiline: true
     * });
     * ```
     *
     * @param spec
     */
    text(spec: BaseParam<TextParam>): TextParam;
    /**
     * Defines a new time parameter providing time-of-day values (in UTC) in the
     * form of 3-tuples: `[hour,minute,second]`. Randomizable.
     *
     * @remarks
     * Intended for long running artworks to configure an important times in the
     * day for state or behavior changes etc. (e.g. triggering sleep mode)
     *
     * Also see {@link ParamFactories.datetime} and {@link ParamFactories.date}.
     *
     * @param spec
     */
    time(spec: BaseParam<TimeParam>): TimeParam;
    /**
     * Defines a on/off switch (boolean) param. Randomizable.
     *
     * @param spec
     */
    toggle(spec: BaseParam<ToggleParam>): ToggleParam;
    /**
     * Defines an n-dimensional vector param. Randomizable.
     *
     * @param spec
     */
    vector(spec: BaseParam<VectorParam, "min" | "max" | "step" | "labels"> & {
        min?: number | number[];
        max?: number | number[];
        step?: number | number[];
        labels?: string[];
    }): VectorParam;
    /**
     * Similar to the {@link ChoiceParam} param type, but here each option also
     * has an associated weight. Randomizable.
     *
     * @remarks
     * Along with {@link RampParam}, this is another non-static parameter type,
     * intended for time-based works, here producing a new random value each
     * time the parameter is read and yielding a probability distribution
     * defined by the relative weights given to each option.
     *
     * @example
     * ```ts
     * $genart.params.weighted({
     *     doc: "Controlled randomness",
     *     options: [
     *         ["black", 8],
     *         ["cyan", 4],
     *         ["magenta", 2],
     *         ["yellow", 1],
     *     ],
     * });
     *
     * // optionally, labels can be provided for each option
     * $genart.params.weighted({
     *     doc: "With labels",
     *     options: [
     *         ["#000", 8, "black"],
     *         ["#0ff", 4, "cyan"],
     *         ["#f0f", 2, "magenta"],
     *         ["#ff0", 1, "yellow"],
     *     ],
     * });
     * ```
     *
     * @param spec
     */
    weighted<T extends string>(spec: BaseParam<WeightedChoiceParam<T>, "total">): WeightedChoiceParam<T>;
    /**
     * Defines a 2D dimensional tuple param which with values in the [0,0] .. [1,1]
     * range. Useful to control two co-dependent parameters using an XY
     * controller/touchpad. Randomizable.
     *
     * ```ts
     * $genart.params.xy({
     *     doc: "Bottom-left: [dark,dry] / Top-right: [bright,wet]",
     *     default: [0.5, 0.5],
     * });
     * ```
     *
     * @param spec
     */
    xy(spec: BaseParam<XYParam>): XYParam;
}
