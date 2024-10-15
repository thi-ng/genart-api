import type {
	BaseParam,
	ChoiceParam,
	ColorParam,
	DateParam,
	DateTimeParam,
	ImageParam,
	NumListParam,
	Param,
	RampParam,
	RangeParam,
	StringListParam,
	TextParam,
	TimeParam,
	ToggleParam,
	WeightedChoiceParam,
	XYParam,
} from "./api.js";

const $ = <T extends Param<any>>(
	type: T["type"],
	spec: Partial<T>,
	randomize = true
) =>
	<T>{
		type,
		state: "void",
		randomize,
		...spec,
	};

export const choice = <T extends string>(spec: BaseParam<ChoiceParam<T>>) =>
	$<ChoiceParam<T>>("choice", spec);

export const color = (spec: BaseParam<ColorParam>) =>
	$<ColorParam>("color", spec);

export const datetime = (
	spec: BaseParam<DateTimeParam> & { default: string }
) => $<DateTimeParam>("datetime", spec, false);

export const date = (spec: BaseParam<DateParam> & { default: string }) =>
	$<DateParam>("date", spec, false);

export const image = (spec: BaseParam<ImageParam>) =>
	$<ImageParam>(
		"img",
		{
			default: spec.default || new Uint8Array(spec.width * spec.height),
			...spec,
		},
		false
	);

export const numlist = (spec: BaseParam<NumListParam>): NumListParam =>
	$<NumListParam>(
		"numlist",
		{
			default: [],
			...spec,
		},
		false
	);

export const ramp = (
	spec: BaseParam<RampParam, "stops"> & { stops?: [number, number][] }
) =>
	$<RampParam>(
		"ramp",
		{
			name: spec.name,
			desc: spec.desc,
			doc: spec.doc,
			stops: spec.stops ? spec.stops.flat() : [0, 0, 1, 1],
			mode: spec.mode || "linear",
			default: 0,
		},
		false
	);

export const range = (
	spec: BaseParam<RangeParam, "min" | "max" | "step"> &
		Partial<Pick<RangeParam, "min" | "max" | "step">>
) =>
	$<RangeParam>("range", {
		min: 0,
		max: 100,
		step: 1,
		...spec,
	});

export const strlist = <T extends string>(
	spec: BaseParam<StringListParam<T>>
) =>
	$<StringListParam<T>>(
		"strlist",
		{
			default: [],
			...spec,
		},
		false
	);

export const text = (spec: BaseParam<TextParam>) =>
	$<TextParam>("text", spec, false);

export const time = (spec: BaseParam<TimeParam>) => $<TimeParam>("time", spec);

export const toggle = (spec: BaseParam<ToggleParam>) =>
	$<ToggleParam>("toggle", spec);

export const weighted = <T extends string>(
	spec: BaseParam<WeightedChoiceParam<T>, "total">
) =>
	$<WeightedChoiceParam<T>>("weighted", {
		...spec,
		options: spec.options.sort((a, b) => b[0] - a[0]),
		total: spec.options.reduce((acc, x) => acc + x[0], 0),
	});

export const xy = (spec: BaseParam<XYParam>) => $<XYParam>("xy", spec);
