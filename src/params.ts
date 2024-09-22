import type {
	BaseParam,
	ChoiceParam,
	ColorParam,
	DateParam,
	DateTimeParam,
	RampParam,
	RangeParam,
	TextParam,
	TimeParam,
	ToggleParam,
	WeightedChoiceParam,
	XYParam,
} from "./api.js";

/**
 * Defines a new CSS hex color parameter. Randomizable.
 *
 * @remarks
 * CSS hex color value (6 digits only). Other/newer color types (e.g. `oklch()`)
 * might be supported later, but currently omitted due to lack of native browser
 * widgets for editing these colors...
 *
 *
 * @param spec
 */
export const color = (spec: BaseParam<ColorParam>): ColorParam => ({
	type: "color",
	...spec,
});

/**
 * Defines a new choice/enum parameter. Only supports string values/options.
 * Randomizable.
 *
 * @param spec
 */
export const choice = <T extends string>(
	spec: BaseParam<ChoiceParam<T>>
): ChoiceParam<T> => ({
	type: "choice",
	...spec,
});

/**
 * Defines a new date-time parameter providing UNIX epoch timestamps (in UTC).
 *
 * @remarks
 * Also see {@link date} and {@link time}.
 *
 * @param spec
 */
export const datetime = (spec: BaseParam<DateTimeParam>): DateTimeParam => ({
	type: "datetime",
	randomize: false,
	...spec,
});

/**
 * Defines a new date parameter providing `Date` values (in UTC) at the
 * resolution of full days.
 *
 * @remarks
 * Also see {@link datetime} and {@link time}.
 *
 * @param spec
 */
export const date = (spec: BaseParam<DateParam>): DateParam => ({
	type: "date",
	randomize: false,
	...spec,
});

/**
 * Defines a new time parameter providing time-of-day values (in UTC) in the
 * form of 3-tuples: `[hour,minute,second]`.
 *
 * @remarks
 * Also see {@link datetime} and {@link date}.
 *
 * @param spec
 */
export const time = (spec: BaseParam<TimeParam>): TimeParam => ({
	type: "time",
	randomize: false,
	...spec,
});

/**
 * Defines a new ramp parameter, a curve defined by stops/keyframes in the [0,1]
 * interval (each a `[pos,value]`-tuple). Unlike other param types the actual
 * value of this ramp will be sampled from the curve by providing a `time` arg
 * (also in [0,1] range) to getter function returned by
 * {@link GenArtAPI.setParams}) (or when calling {@link GenArtAPI.getParamValue}
 * directly).
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
export const ramp = (
	spec: BaseParam<RampParam, "stops" | "default"> &
		Partial<Pick<RampParam, "stops" | "default">>
): RampParam => ({
	type: "ramp",
	randomize: false,
	default: 0,
	mode: "linear",
	stops: [
		[0, 0],
		[1, 1],
	],
	...spec,
});

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
export const range = (
	spec: BaseParam<RangeParam, "min" | "max"> &
		Partial<Pick<RangeParam, "min" | "max">>
): RangeParam => ({
	type: "range",
	min: 0,
	max: 100,
	step: 1,
	...spec,
});

/**
 * Defines a text/string param with optional `min`/`max` length and/or regexp
 * validation pattern.
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
export const text = (spec: BaseParam<TextParam>): TextParam => ({
	type: "text",
	randomize: false,
	...spec,
});

/**
 * Defines a on/off switch (boolean) param. Randomizable.
 *
 * @param spec
 */
export const toggle = (spec: BaseParam<ToggleParam>): ToggleParam => ({
	type: "toggle",
	...spec,
});

/**
 * Similar to the {@link choice} param type, but here each option also has an
 * associated weight.
 *
 * @remarks
 * Along with {@link ramp}, this is another non-static parameter type, intended
 * for time-based works, here producing a new random value each time the
 * parameter is read and yielding a probability distribution defined by the
 * relative weights given to each option.
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
export const weighted = <T extends string>(
	spec: BaseParam<WeightedChoiceParam<T>, "total">
): WeightedChoiceParam<T> => ({
	...spec,
	type: "weighted",
	options: spec.options.sort((a, b) => b[0] - a[0]),
	total: spec.options.reduce((acc, x) => acc + x[0], 0),
});

/**
 * Defines a 2D dimensional tuple param which with values in the [0,0] .. [1,1]
 * range. Useful to control two co-dependent parameters using an XY
 * controller/touchpad...
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
export const xy = (spec: BaseParam<XYParam>): XYParam => ({
	type: "xy",
	...spec,
});
