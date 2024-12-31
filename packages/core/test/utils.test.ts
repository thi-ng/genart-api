import { expect, test } from "bun:test";
import {
	equiv,
	equivArrayLike,
	parseBigInt,
	stringifyBigInt,
} from "../src/utils.js";

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

test("stringifyBigInt", () => {
	expect(stringifyBigInt(-255n, 2)).toBe("-0b11111111");
	expect(stringifyBigInt(-255n, 8)).toBe("-0o377");
	expect(stringifyBigInt(-255n, 10)).toBe("-255");
	expect(stringifyBigInt(-255n, 16)).toBe("-0xff");
});

test("parseBigInt", () => {
	expect(parseBigInt("-0b11111111")).toBe(-255n);
	expect(parseBigInt("-0o377")).toBe(-255n);
	expect(parseBigInt("-255")).toBe(-255n);
	expect(parseBigInt("-0xff")).toBe(-255n);
});
