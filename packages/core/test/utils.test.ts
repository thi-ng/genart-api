import { expect, test } from "bun:test";
import {
	equiv,
	equivArrayLike,
	formatValuePrec,
	hashString,
	parseBigInt,
	parseUUID,
	stringifyBigInt,
	valuePrec,
} from "../src/utils.js";
import { parseNum } from "../src/math.js";

test("parseNum", () => {
	expect(parseNum("1.234")).toBe(1.234);
	expect(parseNum("abc")).toBe(0);
	expect(parseNum("abc", -1)).toBe(-1);
});

test("valuePrec", () => {
	expect(valuePrec(0)).toBe(0);
	expect(valuePrec(1)).toBe(0);
	expect(valuePrec(0.1)).toBe(1);
	expect(valuePrec(0.01)).toBe(2);
	expect(valuePrec(0.001)).toBe(3);
	expect(valuePrec(0.0005)).toBe(4);
});

test("formatValuePrec", () => {
	expect(formatValuePrec(1)(1.2345)).toBe("1");
	expect(formatValuePrec(0.1)(1.2345)).toBe("1.2");
	expect(formatValuePrec(0.01)(1.2345)).toBe("1.23");
	expect(formatValuePrec(0.001)(1.2345)).toBe("1.234");
});

test("equiv", () => {
	const FN0 = () => {};
	const FN1 = (_: any) => {};
	expect(equiv(null, undefined)).toBe(true);
	expect(equiv(undefined, null)).toBe(true);
	expect(equiv(null, 0)).toBe(false);
	expect(equiv(0, null)).toBe(false);
	expect(equiv(0, 0)).toBe(true);
	expect(equiv(0n, 0n)).toBe(true);
	expect(equiv(0n, 0)).toBe(false);
	expect(equiv(Number.NaN, Number.NaN)).toBe(true);
	expect(equiv(Number.NaN, 0)).toBe(false);
	expect(equiv(0, Number.NaN)).toBe(false);
	expect(equiv(0, "0")).toBe(false);
	expect(equiv(0n, "0")).toBe(false);
	expect(equiv("0", 0)).toBe(false);
	expect(equiv("0", 0n)).toBe(false);
	expect(equiv("0", "0")).toBe(true);
	expect(equiv("0", "")).toBe(false);
	expect(equiv({}, {})).toBe(true);
	expect(equiv({ a: 1 }, { a: 1 })).toBe(true);
	expect(equiv({ a: 1 }, { b: 1 })).toBe(false);
	expect(equiv({ a: 1 }, { a: 2 })).toBe(false);
	expect(equiv({ a: 1 }, { a: 1, b: 2 })).toBe(false);
	expect(equiv({}, [])).toBe(false);
	expect(equiv({ a: 1 }, [1])).toBe(false);
	expect(equiv({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
	expect(equiv({ a: { b: [1] } }, { a: { b: [1] } })).toBe(true);
	expect(equiv(/[a-z]/, /[a-z]/)).toBe(true);
	expect(equiv(/[a-z]/, /[a-z]/)).toBe(true);
	expect(equiv(/[a-z]/, /[A-Z]/)).toBe(false);
	expect(equiv(new Date(1234567), new Date(1234567))).toBe(true);
	expect(equiv(new Date(1234567), new Date())).toBe(false);
	expect(equiv([1, 2, 3], [1, 2, 3])).toBe(true);
	expect(equiv([1, 2, 3], new Uint8Array([1, 2, 3]))).toBe(true);
	expect(equiv([1, 2, 3], [1, 2])).toBe(false);
	expect(equiv([1, 2, 3], [1, 2, 4])).toBe(false);
	expect(equiv(FN0, FN0)).toBe(true);
	expect(equiv(FN0, () => {})).toBe(false);
	expect(equiv([], FN0)).toBe(false);
	expect(equiv(FN0, [])).toBe(false);
	expect(equiv(FN0, "")).toBe(false);
	expect(equiv([1], FN1)).toBe(false);
	expect(equiv(FN1, [1])).toBe(false);
});

test("equivArraylike", () => {
	expect(equivArrayLike([], [])).toBe(true);
	expect(equivArrayLike([1], [1])).toBe(true);
	expect(equivArrayLike([1], [])).toBe(false);
	expect(equivArrayLike([1, 2], [1, 2])).toBe(true);
	expect(equivArrayLike([1, 2], ["1", 2])).toBe(false);
	expect(equivArrayLike([1, "2"], ["1", 2])).toBe(false);
	expect(equivArrayLike([[1], [[2]]], [[1], [[2]]])).toBe(true);
	expect(
		equivArrayLike(
			[[{ a: 1 }], [[{ a: { b: [2] } }]]],
			[[{ a: 1 }], [[{ a: { b: [2] } }]]]
		)
	).toBe(true);
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

test("parseUUID", () => {
	expect(parseUUID("7BAE2631-E2A7-45F9-A53B-B36E818927B2")).toEqual(
		new Uint32Array([0x7bae2631, 0xe2a745f9, 0xa53bb36e, 0x818927b2])
	);
});

test("hashString", () => {
	expect(hashString("hello world")).toEqual(
		new Uint32Array([1078762872, 2874048563, 3120053844, 1898755490])
	);
	expect(hashString("hello world", 0xdecafbad)).toEqual(
		new Uint32Array([4060365908, 714030859, 1695666134, 3377875181])
	);
	expect(
		hashString(
			"Consequat tempor exercitation adipisicing ea do magna aute occaecat voluptate non ex ipsum duis. Et anim elit non nulla tempor nostrud incididunt adipisicing quis commodo cupidatat amet deserunt qui. Dolore sint nulla cupidatat mollit consequat non in magna culpa. Cillum duis ut id ut aliqua dolor esse anim aliquip qui sunt proident."
		)
	).toEqual(new Uint32Array([1568633690, 3468689631, 3570207888, 117405665]));
});
