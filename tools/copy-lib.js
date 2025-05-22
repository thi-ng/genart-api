import { mkdirSync, copyFileSync } from "node:fs";
import { dirname, basename, resolve } from "node:path";

// copies genart API core and platform adapter into the CWD
const adapter = process.argv[2] || "urlparams";

for (const src of [
	"../../packages/core/genart.js",
	`../../packages/adapter-${adapter}/adapter-${adapter}.js`,
]) {
	const dest = resolve("public/lib/" + basename(src));
	mkdirSync(dirname(dest), { recursive: true });
	copyFileSync(resolve(src), dest);
}
