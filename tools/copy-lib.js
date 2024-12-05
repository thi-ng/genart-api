import { copyFileSync } from "node:fs";
import { basename, resolve } from "node:path";

// copies genart API core and platform adapter into the CWD
const adapter = process.argv[2] || "urlparams";

for (const src of [
	"../../packages/core/genart.js",
	`../../packages/adapter-${adapter}/adapter-${adapter}.js`,
]) {
	copyFileSync(resolve(src), resolve("lib/" + basename(src)));
}
