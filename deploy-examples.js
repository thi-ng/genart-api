import { execFileSync } from "node:child_process";

for (let ex of [
	"p5-basic",
	"param-custom",
	"param-editors",
	"param-image",
	"param-test",
	"zig-test",
]) {
	console.log("deploying example:", ex);
	try {
		execFileSync("bun", [
			"../umbrella/tools/src/deploy-example.ts",
			"--base",
			"examples",
			"--dest",
			"genart-api",
			ex,
		]);
	} catch (e) {
		console.log(e);
	}
}
