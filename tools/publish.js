import { execFileSync } from "node:child_process";

for (let pkg of [
	"core",
	"wasm",
	"adapter-editart",
	"adapter-fxhash",
	"adapter-layer",
	"adapter-urlparams",
	"time-fps-overlay",
]) {
	console.log("publishing pkg:", pkg);
	try {
		console.log(
			execFileSync("yarn", ["publish"], {
				cwd: `packages/${pkg}`,
			}).toString()
		);
	} catch (e) {
		console.log(e);
	}
}
