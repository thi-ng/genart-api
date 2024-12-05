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
	VectorParam,
	WeightedChoiceParam,
	XYParam,
} from "./api.js";
import { ensure, isNumber } from "./utils.js";

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

export const text = (spec: BaseParam<TextParam> & { default: string }) =>
	$<TextParam>("text", spec, false);

export const time = (spec: BaseParam<TimeParam>) => $<TimeParam>("time", spec);

export const toggle = (spec: BaseParam<ToggleParam>) =>
	$<ToggleParam>("toggle", spec);

export const vector = (
	spec: BaseParam<VectorParam, "min" | "max" | "step" | "labels"> & {
		min?: number | number[];
		max?: number | number[];
		step?: number | number[];
		labels?: string[];
	}
) => {
	const $vec = (
		n: number,
		value: number | number[] | undefined,
		defaultValue = 0
	) =>
		Array.isArray(value)
			? (ensure(value.length === n, "wrong vector size"), value)
			: new Array(n).fill(isNumber(value) ? value : defaultValue);

	if (spec.default) {
		ensure(
			spec.default.length == spec.dim,
			`wrong vector size, expected ${spec.dim} values`
		);
	}
	if (spec.labels) {
		ensure(spec.labels.length >= spec.dim, `expected ${spec.dim} labels`);
	} else {
		ensure(spec.dim <= 4, "missing vector labels");
	}
	return $<VectorParam>("vector", {
		...spec,
		min: $vec(spec.dim, spec.min, 0),
		max: $vec(spec.dim, spec.max, 1),
		step: $vec(spec.dim, spec.step, 0.01),
		labels: spec.labels || ["X", "Y", "Z", "W"].slice(0, spec.dim),
	});
};

export const weighted = <T extends string>(
	spec: BaseParam<WeightedChoiceParam<T>, "total">
) =>
	$<WeightedChoiceParam<T>>("weighted", {
		...spec,
		options: spec.options.sort((a, b) => b[0] - a[0]),
		total: spec.options.reduce((acc, x) => acc + x[0], 0),
	});

export const xy = (spec: BaseParam<XYParam>) => $<XYParam>("xy", spec);
