import { expect, test } from "bun:test";
import { equiv, equivArrayLike } from "../src/utils.js";

test("equiv", () => {
	expect(equiv(null, undefined)).toBe(true);
	expect(equiv(undefined, null)).toBe(true);
	expect(equiv(null, 0)).toBe(false);
	expect(equiv(0, null)).toBe(false);
	expect(equiv(0, 0)).toBe(true);
	expect(equiv(Number.NaN, Number.NaN)).toBe(true);
	expect(equiv(Number.NaN, 0)).toBe(false);
	expect(equiv(0, "0")).toBe(false);
	expect(equiv("0", 0)).toBe(false);
	expect(equiv("0", "0")).toBe(true);
	expect(equiv("0", "")).toBe(false);
	expect(equiv(/[a-z]/, /[a-z]/)).toBe(true);
	expect(equiv(/[a-z]/, /[A-Z]/)).toBe(false);
	expect(equiv(new Date(1234567), new Date(1234567))).toBe(true);
	expect(equiv(new Date(1234567), new Date())).toBe(false);
});

test("equivArraylike", () => {
	expect(equivArrayLike([], [])).toBe(true);
	expect(equivArrayLike([1], [1])).toBe(true);
	expect(equivArrayLike([1], [])).toBe(false);
	expect(equivArrayLike([1, 2], [1, 2])).toBe(true);
	expect(equivArrayLike([1, 2], ["1", 2])).toBe(false);
	expect(equivArrayLike([1, "2"], ["1", 2])).toBe(false);
	expect(equivArrayLike([[1], [[2]]], [[1], [[2]]])).toBe(true);
	expect(equivArrayLike(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(
		true
	);
});
