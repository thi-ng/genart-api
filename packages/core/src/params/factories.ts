import type {
	BaseParam,
	BigIntParam,
	BinaryParam,
	ChoiceParam,
	ColorParam,
	DateParam,
	DateTimeParam,
	ImageParam,
	NumListParam,
	Param,
	ParamImpl,
	RampParam,
	RangeParam,
	StringListParam,
	TextParam,
	TimeParam,
	ToggleParam,
	VectorParam,
	WeightedChoiceParam,
	XYParam,
} from "../api.js";
import { ensure, isNumber } from "../utils.js";
import { date as dateImpl } from "./date.js";
import { datetime as datetimeImpl } from "./datetime.js";
import { time as timeImpl } from "./time.js";
import { vector as vecImpl } from "./vector.js";

export const PARAM_DEFAULTS: Partial<Param<any>> = {
	desc: "TODO description",
	edit: "protected",
	group: "main",
	order: 0,
	randomize: true,
	state: "void",
	update: "event",
	widget: "default",
};

/** @internal */
const $ = <T extends Param<any>>(
	type: T["type"],
	spec: Partial<T>,
	randomize = true
) => {
	ensure(spec.name, "missing param `name`");
	return <T>{
		...PARAM_DEFAULTS,
		type,
		randomize,
		...spec,
	};
};

const $default = (impl: ParamImpl, value: any) =>
	value != null
		? ensure(
				impl.validate(<any>null, value),
				`invalid default value: ${value}`
		  ) && impl.coerce!(<any>null, value)
		: value;

/** @internal */
const minMaxLength = (
	spec: { minLength?: number; maxLength?: number },
	maxDefault = 10
) => {
	let min = 0,
		max = spec.maxLength || maxDefault;
	if (spec.minLength) {
		min = spec.minLength;
		if (!spec.maxLength) max = Math.max(min, maxDefault);
	}
	ensure(min <= max, `invalid list length constraint`);
	return [min, max];
};

export const bigint = (
	spec: BaseParam<BigIntParam, "min" | "max"> &
		Partial<Pick<BigIntParam, "min" | "max">>
) =>
	$<BigIntParam>("bigint", {
		min: 0n,
		max: 0xffff_ffff_ffff_ffffn,
		...spec,
	});

export const binary = (
	spec: BaseParam<BinaryParam, "minLength" | "maxLength" | "randomize"> &
		Partial<Pick<BinaryParam, "minLength" | "maxLength">>
) =>
	$<BinaryParam>(
		"binary",
		{
			minLength: 0,
			maxLength: 1024,
			...spec,
		},
		false
	);

export const choice = <T extends string>(spec: BaseParam<ChoiceParam<T>>) =>
	$<ChoiceParam<T>>("choice", spec);

export const color = (spec: BaseParam<ColorParam>) =>
	$<ColorParam>("color", spec);

export const date = (
	spec: BaseParam<DateParam, "default"> & { default: Date | string }
) =>
	$<DateParam>(
		"date",
		{
			...spec,
			default: $default(dateImpl, spec.default),
		},
		false
	);

export const datetime = (
	spec: BaseParam<DateTimeParam, "default"> & { default: Date | string }
) =>
	$<DateTimeParam>(
		"datetime",
		{
			...spec,
			default: $default(datetimeImpl, spec.default),
		},
		false
	);

export const image = (spec: BaseParam<ImageParam, "randomize">) =>
	$<ImageParam>(
		"img",
		{
			default:
				spec.default ||
				new (spec.format === "gray" ? Uint8Array : Uint32Array)(
					spec.width * spec.height
				),
			...spec,
		},
		false
	);

export const numlist = (
	spec: BaseParam<NumListParam, "minLength" | "maxLength"> &
		Partial<Pick<NumListParam, "minLength" | "maxLength">>
): NumListParam => {
	const [minLength, maxLength] = minMaxLength(spec, 10);
	return $<NumListParam>(
		"numlist",
		{
			default: spec.default || new Array(minLength).fill(0),
			minLength,
			maxLength,
			...spec,
		},
		false
	);
};

export const ramp = (
	spec: BaseParam<RampParam, "stops" | "default"> & {
		stops?: [number, number][];
	}
) =>
	$<RampParam>(
		"ramp",
		{
			...spec,
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
	spec: BaseParam<StringListParam<T>, "minLength" | "maxLength"> &
		Partial<Pick<StringListParam<T>, "minLength" | "maxLength">>
) => {
	const [minLength, maxLength] = minMaxLength(spec, 10);
	return $<StringListParam<T>>(
		"strlist",
		{
			default: spec.default || new Array(minLength).fill(""),
			minLength,
			maxLength,
			...spec,
		},
		false
	);
};

export const text = (
	spec: BaseParam<TextParam, "minLength" | "maxLength"> &
		Partial<Pick<TextParam, "minLength" | "maxLength">> & {
			default: string;
		}
) =>
	$<TextParam>(
		"text",
		{ minLength: 0, maxLength: 1024, multiline: false, ...spec },
		false
	);

export const time = (
	spec: BaseParam<TimeParam, "default"> & {
		default?: [number, number, number] | string;
	}
) => {
	return $<TimeParam>("time", {
		...spec,
		default:
			spec.default != null
				? ensure(timeImpl.validate(<any>null, spec.default), ``) &&
				  timeImpl.coerce!(<any>null, spec.default)
				: spec.default,
	});
};

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
	if (spec.labels) {
		ensure(spec.labels.length >= spec.size, `expected ${spec.size} labels`);
	} else {
		ensure(spec.size <= 4, "missing vector labels");
	}
	const $vec = (
		n: number,
		value: number | number[] | undefined,
		defaultValue = 0
	) =>
		Array.isArray(value)
			? (ensure(value.length === n, "wrong vector size"), value)
			: new Array<number>(n).fill(isNumber(value) ? value : defaultValue);
	const limits = {
		min: $vec(spec.size, spec.min, 0),
		max: $vec(spec.size, spec.max, 1),
		step: $vec(spec.size, spec.step, 0.01),
	};
	return $<VectorParam>("vector", {
		...spec,
		...limits,
		default: spec.default
			? ensure(
					spec.default.length == spec.size,
					`wrong vector size, expected ${spec.size} values`
			  ) && vecImpl.coerce!(<any>limits, spec.default)
			: spec.default,
		labels: spec.labels || ["X", "Y", "Z", "W"].slice(0, spec.size),
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
