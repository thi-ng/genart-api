import { expect, test } from "bun:test";
import { randomBigInt, SFC32 } from "../src/prng.js";
import { parseUUID } from "../src/utils.js";

test("randomBigInt", () => {
	const rnd = new SFC32(parseUUID("6b47d962-ce9c-4774-b48a-5d4fa81695d7"));
	expect(randomBigInt(2n ** 128n, rnd)).toBe(
		BigInt("0xe1fab6adcfeee6f6ec8346f5da285e63")
	);
	expect(randomBigInt(2n ** 128n, rnd)).toBe(
		BigInt("0x27d04ad48944c41949892898e126ba5")
	);
});

test("SFC32", () => {
	const seed = "decafbad_ace0fba5e_cafed00d_f0cacc1a";
	const parsedSeed = seed.split("_").map((x) => parseInt(x, 16));
	const rnd = new SFC32(parsedSeed);
	expect(rnd.rnd()).toBe(0.6158067074138671);
	expect(rnd.rnd()).toBe(0.8834358497988433);
	rnd.reset();
	const rnd2 = rnd.copy();
	expect(rnd2.rnd()).toBe(0.6158067074138671);
	expect(rnd2.rnd()).toBe(0.8834358497988433);
	expect(rnd.rnd()).toBe(0.6158067074138671);
	expect(rnd2.rnd()).toBe(0.6797624193131924);
});
