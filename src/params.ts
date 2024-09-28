import type {
	BaseParam,
	ChoiceParam,
	ColorParam,
	DateParam,
	DateTimeParam,
	ImageParam,
	ListParam,
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

export const datetime = (
	spec: BaseParam<DateTimeParam> & { default: string }
): DateTimeParam => ({
	type: "datetime",
	randomize: false,
	...spec,
});

export const date = (
	spec: BaseParam<DateParam> & { default: string }
): DateParam => ({
	type: "date",
	randomize: false,
	...spec,
});

export const image = (spec: BaseParam<ImageParam>): ImageParam => ({
	type: "img",
	randomize: false,
	default: spec.default || new Uint8Array(spec.width * spec.height),
	...spec,
});

export const list = <T>(
	spec: BaseParam<ListParam<T>> & { default: T[] }
): ListParam<T> => ({
	type: "list",
	randomize: false,
	...spec,
});

export const ramp = (
	spec: BaseParam<RampParam, "stops"> & Partial<Pick<RampParam, "stops">>
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
	spec: BaseParam<RangeParam, "min" | "max" | "step"> &
		Partial<Pick<RangeParam, "min" | "max" | "step">>
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

export const time = (spec: BaseParam<TimeParam>): TimeParam => ({
	type: "time",
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
