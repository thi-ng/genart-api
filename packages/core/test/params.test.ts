import { expect, test } from "bun:test";
import type {
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
} from "../src/api.js";
import { bigint } from "../src/params/bigint.js";
import { binary } from "../src/params/binary.js";
import { choice } from "../src/params/choice.js";
import { color } from "../src/params/color.js";
import { date } from "../src/params/date.js";
import { datetime } from "../src/params/datetime.js";
import * as params from "../src/params/factories.js";
import { PARAM_DEFAULTS } from "../src/params/factories.js";
import { image } from "../src/params/image.js";
import { numlist } from "../src/params/numlist.js";
import { ramp } from "../src/params/ramp.js";
import { range } from "../src/params/range.js";
import { strlist } from "../src/params/strlist.js";
import { text } from "../src/params/text.js";
import { time } from "../src/params/time.js";
import { toggle } from "../src/params/toggle.js";
import { vector } from "../src/params/vector.js";
import { weighted } from "../src/params/weighted.js";
import { xy } from "../src/params/xy.js";

const fuzz = (
	spec: Param<any>,
	{ validate, randomize }: ParamImpl,
	n = 1000
) => {
	for (let i = 0; i < n; i++) {
		expect(validate(spec, randomize!(spec, Math.random))).toBeTrue();
	}
};

test("bigint", () => {
	const { validate, coerce } = bigint;
	const spec = params.bigint({
		name: "test",
		default: 123n,
	});
	const spec2 = params.bigint({
		name: "test",
		default: 123n,
		min: -1n,
	});
	expect(spec).toEqual(<BigIntParam>{
		...PARAM_DEFAULTS,
		type: "bigint",
		name: "test",
		desc: "TODO description",
		randomize: true,
		min: 0n,
		max: 0xffff_ffff_ffff_ffffn,
		default: 123n,
	});
	expect(validate(spec, 1n)).toBeTrue();
	expect(validate(spec, 1)).toBeTrue();
	expect(validate(spec, "1")).toBeTrue();
	expect(validate(spec2, "-1")).toBeTrue();
	expect(validate(spec, "0x1")).toBeTrue();
	expect(validate(spec2, "-0x1")).toBeTrue();
	expect(validate(spec, "0b1")).toBeTrue();
	expect(validate(spec2, "-0b1")).toBeTrue();
	expect(validate(spec, "")).toBeFalse();
	expect(validate(spec, "a")).toBeFalse();
	expect(validate(spec, "0xg")).toBeFalse();
	expect(validate(spec, "0b2")).toBeFalse();

	expect(coerce!(spec, 1n)).toBe(1n);
	expect(coerce!(spec, 1)).toBe(1n);
	expect(coerce!(spec, "1")).toBe(1n);
	expect(coerce!(spec, "0x1")).toBe(1n);
	expect(coerce!(spec, "0b1")).toBe(1n);

	fuzz(spec, bigint);
});

test("binary", () => {
	const { validate } = binary;
	const spec = params.binary({ name: "test" });
	expect(spec).toEqual(<BinaryParam>{
		...PARAM_DEFAULTS,
		type: "binary",
		name: "test",
		desc: "TODO description",
		randomize: false,
		minLength: 0,
		maxLength: 1024,
	});

	expect(validate(spec, new Uint8Array([]))).toBeTrue();
	expect(validate(spec, new Uint8Array(1024))).toBeTrue();
	expect(validate(spec, [])).toBeFalse();
	expect(validate(spec, 0)).toBeFalse();
	expect(validate(spec, "")).toBeFalse();
	expect(validate(spec, new Uint8Array(1025))).toBeFalse();
});

test("choice", () => {
	const { validate } = choice;
	const spec = params.choice({
		name: "test",
		options: ["a", ["b", "B"], "c"],
	});
	expect(spec).toEqual(<ChoiceParam<"a" | "b" | "c">>{
		...PARAM_DEFAULTS,
		type: "choice",
		name: "test",
		desc: "TODO description",
		randomize: true,
		options: ["a", ["b", "B"], "c"],
	});

	expect(validate(spec, "a")).toBeTrue();
	expect(validate(spec, "b")).toBeTrue();
	expect(validate(spec, "B")).toBeFalse();
	expect(validate(spec, 0)).toBeFalse();

	fuzz(spec, choice);
});

test("color", () => {
	const { validate } = color;
	const spec = params.color({ name: "test" });
	expect(spec).toEqual(<ColorParam>{
		...PARAM_DEFAULTS,
		type: "color",
		name: "test",
		desc: "TODO description",
		randomize: true,
	});

	expect(validate(spec, "#aabbcc")).toBeTrue();
	expect(validate(spec, "aabbcc")).toBeTrue();
	expect(validate(spec, "#aabbccdd")).toBeFalse();

	fuzz(spec, color);
});

test("date", () => {
	const { validate } = date;
	const spec = params.date({
		name: "test",
		default: "2024-12-30",
	});
	expect(spec).toEqual(<DateParam>{
		...PARAM_DEFAULTS,
		type: "date",
		name: "test",
		desc: "TODO description",
		randomize: false,
		default: new Date(Date.UTC(2024, 11, 30)),
	});

	expect(validate(spec, "2024-12-30")).toBeTrue();
	expect(validate(spec, "2024-12-30T12:34:56Z")).toBeFalse();
});

test("datetime", () => {
	const { validate } = datetime;
	const spec = params.datetime({
		name: "test",
		default: "2024-12-30T12:34:56-08:00",
	});
	expect(spec).toEqual(<DateTimeParam>{
		...PARAM_DEFAULTS,
		type: "datetime",
		name: "test",
		desc: "TODO description",
		randomize: false,
		default: new Date(Date.UTC(2024, 11, 30, 20, 34, 56)),
	});

	expect(validate(spec, "2024-12-30T12:34:56Z")).toBeTrue();
	expect(validate(spec, "2024-12-30T12:34:56+01:00")).toBeTrue();
	expect(validate(spec, "2024-12-30T12:34:56-01:00")).toBeTrue();
	expect(validate(spec, "2024-12-30")).toBeFalse();
});

test("image", () => {
	const { validate } = image;
	const spec = params.image({
		name: "test",
		width: 2,
		height: 2,
		format: "gray",
	});
	const spec2 = params.image({
		name: "test",
		width: 2,
		height: 2,
		format: "rgba",
	});
	expect(spec).toEqual(<ImageParam>{
		...PARAM_DEFAULTS,
		type: "img",
		name: "test",
		desc: "TODO description",
		randomize: false,
		width: 2,
		height: 2,
		format: "gray",
		default: new Uint8Array(4),
	});
	expect(spec2).toEqual(<ImageParam>{
		...PARAM_DEFAULTS,
		type: "img",
		name: "test",
		desc: "TODO description",
		randomize: false,
		width: 2,
		height: 2,
		format: "rgba",
		default: new Uint32Array(4),
	});

	expect(validate(spec, new Uint8Array([1, 2, 3, 4]))).toBeTrue();
	expect(validate(spec, new Uint8ClampedArray([1, 2, 3, 4]))).toBeTrue();
	expect(validate(spec, new Uint32Array([1, 2, 3, 4]))).toBeFalse();
	expect(validate(spec, [1, 2, 3, 4])).toBeFalse();

	expect(validate(spec2, new Uint32Array([1, 2, 3, 4]))).toBeTrue();
	expect(validate(spec2, new Uint8Array([1, 2, 3, 4]))).toBeFalse();
});

test("numlist", () => {
	const { validate } = numlist;
	const spec = params.numlist({ name: "test" });
	expect(spec).toEqual(<NumListParam>{
		...PARAM_DEFAULTS,
		type: "numlist",
		name: "test",
		desc: "TODO description",
		randomize: false,
		minLength: 0,
		maxLength: 10,
		default: [],
	});
	expect(
		params.numlist({
			name: "test",
			minLength: 1,
		}).default
	).toEqual([0]);

	expect(
		() =>
			params.numlist({
				name: "test",
				minLength: 10,
				maxLength: 3,
			}).default
	).toThrow();

	expect(validate(spec, [])).toBeTrue();
	expect(validate(spec, new Array(10).fill(0))).toBeTrue();
	expect(validate(spec, new Array(11).fill(0))).toBeFalse();
	expect(validate(spec, [""])).toBeFalse();
});

test("ramp", () => {
	const spec = params.ramp({ name: "test" });
	expect(spec).toEqual(<RampParam>{
		...PARAM_DEFAULTS,
		type: "ramp",
		name: "test",
		desc: "TODO description",
		randomize: false,
		stops: [0, 0, 1, 1],
		mode: "linear",
		default: 0,
	});

	expect(ramp.read!(spec, 0.25)).toBe(0.25);
	expect(ramp.read!(spec, 0.75)).toBe(0.75);
});

test("range", () => {
	const spec = params.range({ name: "test" });
	expect(spec).toEqual(<RangeParam>{
		...PARAM_DEFAULTS,
		type: "range",
		name: "test",
		desc: "TODO description",
		randomize: true,
		min: 0,
		max: 100,
		step: 1,
	});

	fuzz(spec, range);
});

test("strlist", () => {
	const { validate } = strlist;
	const spec = params.strlist({ name: "test" });
	expect(spec).toEqual(<StringListParam<any>>{
		...PARAM_DEFAULTS,
		type: "strlist",
		name: "test",
		desc: "TODO description",
		randomize: false,
		minLength: 0,
		maxLength: 10,
		default: [],
	});
	expect(
		params.strlist({
			name: "test",
			minLength: 1,
		}).default
	).toEqual([""]);

	expect(
		() =>
			params.strlist({
				name: "test",
				minLength: 10,
				maxLength: 3,
			}).default
	).toThrow();

	expect(validate(spec, [])).toBeTrue();
	expect(validate(spec, new Array(10).fill(""))).toBeTrue();
	expect(validate(spec, new Array(11).fill(""))).toBeFalse();
	expect(validate(spec, [0])).toBeFalse();
});

test("text", () => {
	const { validate } = text;
	const spec = params.text({
		name: "test",
		default: "abc",
		match: "^[a-z]{3,8}$",
	});
	expect(spec).toEqual(<TextParam>{
		...PARAM_DEFAULTS,
		type: "text",
		name: "test",
		desc: "TODO description",
		randomize: false,
		minLength: 0,
		maxLength: 1024,
		multiline: false,
		match: "^[a-z]{3,8}$",
		default: "abc",
	});

	expect(validate(spec, "abc")).toBeTrue();
	expect(validate(spec, "abcdefgh")).toBeTrue();
	expect(validate(spec, 0)).toBeFalse();
	expect(validate(spec, "")).toBeFalse();
	expect(validate(spec, "ab")).toBeFalse();
	expect(validate(spec, "abcdefghi")).toBeFalse();
});

test("time", () => {
	const { validate } = time;
	const spec = params.time({
		name: "test",
	});
	expect(spec).toEqual(<TimeParam>{
		...PARAM_DEFAULTS,
		type: "time",
		name: "test",
		desc: "TODO description",
		randomize: true,
	});

	expect(validate(spec, [0, 0, 0])).toBeTrue();
	expect(validate(spec, [23, 59, 59])).toBeTrue();
	expect(validate(spec, "12:34:56")).toBeTrue();
	expect(validate(spec, [24, 59, 59])).toBeFalse();
	expect(validate(spec, [23, 60, 59])).toBeFalse();
	expect(validate(spec, [23, 59, 60])).toBeFalse();
	expect(validate(spec, "12:34:66")).toBeFalse();
});

test("toggle", () => {
	const { validate } = toggle;
	const spec = params.toggle({
		name: "test",
	});
	expect(spec).toEqual(<ToggleParam>{
		...PARAM_DEFAULTS,
		type: "toggle",
		name: "test",
		desc: "TODO description",
		randomize: true,
	});

	expect(validate(spec, true)).toBeTrue();
	expect(validate(spec, false)).toBeTrue();
	expect(validate(spec, "true")).toBeTrue();
	expect(validate(spec, "false")).toBeTrue();
	expect(validate(spec, 0)).toBeTrue();
	expect(validate(spec, 1)).toBeTrue();
	expect(validate(spec, "")).toBeFalse();
	expect(validate(spec, "a")).toBeFalse();
	expect(validate(spec, -1)).toBeFalse();

	fuzz(spec, toggle);
});

test("vector", () => {
	const { validate } = vector;
	const spec = params.vector({
		name: "test",
		size: 3,
	});
	expect(spec).toEqual(<VectorParam>{
		...PARAM_DEFAULTS,
		type: "vector",
		name: "test",
		desc: "TODO description",
		randomize: true,
		size: 3,
		min: [0, 0, 0],
		max: [1, 1, 1],
		step: [0.01, 0.01, 0.01],
		labels: ["X", "Y", "Z"],
	});

	expect(validate(spec, [0, 0, 0])).toBeTrue();
	expect(validate(spec, [1, 1, 1])).toBeTrue();
	expect(validate(spec, [-1, 1, 1])).toBeFalse();
	expect(validate(spec, [-1, 1, 1])).toBeFalse();
	expect(validate(spec, [1, 1, 1.01])).toBeFalse();
	expect(validate(spec, [1, 1])).toBeFalse();
	expect(validate(spec, "[1,1,1]")).toBeFalse();

	fuzz(spec, vector);
});

test("weighted", () => {
	const { validate } = weighted;
	const spec = params.weighted({
		name: "test",
		options: [
			[1, "a"],
			[2, "b", "B"],
			[3, "c"],
		],
	});
	expect(spec).toEqual(<WeightedChoiceParam<"a" | "b" | "c">>{
		...PARAM_DEFAULTS,
		type: "weighted",
		name: "test",
		desc: "TODO description",
		randomize: true,
		total: 6,
		options: [
			[3, "c"],
			[2, "b", "B"],
			[1, "a"],
		],
	});

	expect(validate(spec, "a")).toBeTrue();
	expect(validate(spec, "b")).toBeTrue();
	expect(validate(spec, "B")).toBeFalse();
	expect(validate(spec, 0)).toBeFalse();

	fuzz(spec, weighted);
});

test("xy", () => {
	const { validate } = xy;
	const spec = params.xy({
		name: "test",
	});
	expect(spec).toEqual(<XYParam>{
		...PARAM_DEFAULTS,
		type: "xy",
		name: "test",
		desc: "TODO description",
		randomize: true,
	});

	expect(validate(spec, [0, 0])).toBeTrue();
});
