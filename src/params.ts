import type {
	BaseParam,
	ChoiceParam,
	ColorParam,
	RampParam,
	RangeParam,
	TextParam,
	ToggleParam,
	WeightedChoiceParam,
	XYParam,
} from "./api.js";

/**
 * Defines a new color parameter.
 *
 * @param spec
 */
export const color = (spec: BaseParam<ColorParam>): ColorParam => ({
	type: "color",
	...spec,
});

/**
 * Defines a new choice/enum parameter. Only supports string values/options.
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
 * Defines a new ramp parameter, a curve defined by stops/keyframes in the [0,1]
 * interval (each a `[pos,value]`-tuple). Unlike other param types the actual
 * value of this ramp will be sampled from the curve by providing a `time` arg
 * (also in [0,1] range) to {@link GenArtAPI.getParamValue} (or the param getter
 * returned by {@link GenArtAPI.setParams}).
 *
 * @example
 * ```ts
 * const param = $genart.setParams({
 *   test: $genart.params.ramp({ doc: "test", stops: [[0, 0], [0.5, 0.1], [1, 1]] })
 * });
 *
 * // read param @ t=0.25
 * param("test", 0.25)
 * // 0.05
 *
 * // read param @ t=0.25
 * param("test", 0.75)
 * // 0.55
 * ```
 *
 * @param spec
 */
export const ramp = (
	spec: BaseParam<RampParam, "stops" | "default"> &
		Partial<Pick<RampParam, "stops" | "default">>
): RampParam => ({
	type: "ramp",
	default: 0,
	mode: "linear",
	stops: [
		[0, 0],
		[1, 1],
	],
	...spec,
});

export const range = (
	spec: BaseParam<RangeParam, "step"> & Pick<RangeParam, "step">
): RangeParam => ({
	type: "range",
	step: 1,
	...spec,
});

export const text = (spec: BaseParam<TextParam>): TextParam => ({
	type: "text",
	...spec,
});

export const toggle = (spec: BaseParam<ToggleParam>): ToggleParam => ({
	type: "toggle",
	...spec,
});

export const weighted = <T extends string>(
	spec: BaseParam<WeightedChoiceParam<T>>
): WeightedChoiceParam<T> => ({
	type: "weighted",
	...spec,
	options: spec.options.sort((a, b) => b[0] - a[0]),
	total: spec.options.reduce((acc, x) => acc + x[0], 0),
});

export const xy = (spec: BaseParam<XYParam>): XYParam => ({
	type: "xy",
	...spec,
});
