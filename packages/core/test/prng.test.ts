import { expect, test } from "bun:test";
import { randomBigInt, sfc32 } from "../src/prng.js";
import { parseUUID } from "../src/utils.js";

test("randomBigInt", () => {
	const rnd = sfc32(parseUUID("6b47d962-ce9c-4774-b48a-5d4fa81695d7"));
	expect(randomBigInt(2n ** 128n, rnd)).toBe(
		BigInt("0xe1fab6adcfeee6f6ec8346f5da285e63")
	);
	expect(randomBigInt(2n ** 128n, rnd)).toBe(
		BigInt("0x27d04ad48944c41949892898e126ba5")
	);
});
