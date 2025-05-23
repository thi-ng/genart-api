import { expect, test } from "bun:test";
import "../src/genart.js";
import { SFC32 } from "../src/prng.js";

$genart.setAdapter({
	id: "test",
	mode: "play",
	screen: { width: 100, height: 100, dpr: 1 },
	prng: new SFC32($genart.utils.hashString("1234")),
	seed: "1234",
	async updateParam() {},

	capture() {},
});

test("setParams", async (done) => {
	await $genart.setParams({
		a: $genart.params.ramp({ name: "a" }),
	});
	expect($genart.paramSpecs).toEqual(<any>{
		a: {
			name: "a",
			type: "ramp",
			desc: "TODO description",
			edit: "protected",
			group: "main",
			mode: "linear",
			order: 0,
			randomize: false,
			state: "default",
			update: "event",
			widget: "default",
			stops: [0, 0, 1, 1],
			default: 0,
		},
	});
	done();
});
