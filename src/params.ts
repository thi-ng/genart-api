import type {
	ChoiceParam,
	ColorParam,
	Param,
	RampParam,
	RangeParam,
	TextParam,
	ToggleParam,
	WeightedChoiceParam,
	XYParam,
} from "./api.js";

type BaseParam<T extends Param<any>, K extends string = ""> = Omit<
	T,
	"type" | "tooltip" | K
> & {
	tooltip?: string;
};

export const color = (spec: BaseParam<ColorParam>): ColorParam => ({
	type: "color",
	...spec,
});

export const choice = <T extends string>(
	spec: BaseParam<ChoiceParam<T>>
): ChoiceParam<T> => ({
	type: "choice",
	...spec,
});

export const ramp = (
	spec: BaseParam<RampParam, "stops" | "default"> &
		Partial<Pick<RampParam, "stops" | "default">>
): RampParam => ({
	type: "ramp",
	default: 0,
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
	tooltip: "text",
	...spec,
});

export const toggle = (spec: BaseParam<ToggleParam>): ToggleParam => ({
	type: "toggle",
	tooltip: "on/off switch",
	...spec,
});

export const weighted = <T extends string>(
	spec: BaseParam<WeightedChoiceParam<T>>
): WeightedChoiceParam<T> => ({
	type: "weighted",
	tooltip: "weighted choice",
	...spec,
	options: spec.options.sort((a, b) => b[0] - a[0]),
	total: spec.options.reduce((acc, x) => acc + x[0], 0),
});

export const xy = (spec: BaseParam<XYParam>): XYParam => ({
	type: "xy",
	tooltip: "xy pad",
	...spec,
});
