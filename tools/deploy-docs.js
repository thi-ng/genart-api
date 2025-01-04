import { execFileSync } from "node:child_process";

for (let pkg of [
	"core",
	"adapter-editart",
	"adapter-fxhash",
	"adapter-layer",
	"adapter-urlparams",
	"time-fps-overlay",
]) {
	console.log("deploying pkg docs:", pkg);
	try {
		console.log(
			execFileSync("bun", [
				"../umbrella/tools/src/deploy-docs.ts",
				"--no-toc",
				"-b",
				"packages",
				"-d",
				"genart-api",
				pkg,
			]).toString()
		);
	} catch (e) {
		console.log(e);
	}
}
