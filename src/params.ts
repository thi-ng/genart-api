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

export const choice = <T extends string>(
	spec: BaseParam<ChoiceParam<T>>
): ChoiceParam<T> => ({
	type: "choice",
	...spec,
});

export const color = (spec: BaseParam<ColorParam>): ColorParam => ({
	type: "color",
	...spec,
});

export const datetime = (spec: BaseParam<DateTimeParam>): DateTimeParam => ({
	type: "datetime",
	randomize: false,
	...spec,
});

export const date = (spec: BaseParam<DateParam>): DateParam => ({
	type: "date",
	randomize: false,
	...spec,
});

export const time = (spec: BaseParam<TimeParam>): TimeParam => ({
	type: "time",
	randomize: false,
	...spec,
});

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

export const text = (spec: BaseParam<TextParam>): TextParam => ({
	type: "text",
	randomize: false,
	...spec,
});

export const toggle = (spec: BaseParam<ToggleParam>): ToggleParam => ({
	type: "toggle",
	...spec,
});

export const weighted = <T extends string>(
	spec: BaseParam<WeightedChoiceParam<T>, "total">
): WeightedChoiceParam<T> => ({
	...spec,
	type: "weighted",
	options: spec.options.sort((a, b) => b[0] - a[0]),
	total: spec.options.reduce((acc, x) => acc + x[0], 0),
});

export const xy = (spec: BaseParam<XYParam>): XYParam => ({
	type: "xy",
	...spec,
});
