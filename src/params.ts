import type { Choice, Color, Flag, ParamSpec, Range } from "./api.js";

type BaseParam<T extends ParamSpec<any>, K extends string = ""> = Omit<
	T,
	"type" | "tooltip" | K
> & {
	tooltip?: string;
};

export const flag = (spec: BaseParam<Flag>): Flag => ({
	type: "flag",
	tooltip: "toggle on/off",
	...spec,
});

export const range = (
	spec: BaseParam<Range, "step"> & { step?: number }
): Range => ({
	type: "range",
	tooltip: "range",
	step: 1,
	...spec,
});

export const color = (spec: BaseParam<Color>): Color => ({
	type: "color",
	tooltip: "rgb",
	...spec,
});

export const choice = (spec: BaseParam<Choice>): Choice => ({
	type: "choice",
	tooltip: "choice",
	...spec,
});
