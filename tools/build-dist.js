import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);

const DEST = "../../dist";

const include = (f) =>
	f.startsWith("./api") ||
	f.startsWith("./genart") ||
	f.startsWith("./adapter-") ||
	f.startsWith("./time-");

const copyFiles = (ext) => {
	for (let f of execFileSync("find", [".", "-name", "*." + ext])
		.toString()
		.split(/\n/g)) {
		if (include(f)) {
			const src = resolve(f);
			const dest = resolve(DEST, f);
			if (!existsSync(dirname(dest))) {
				mkdirSync(dirname(dest), { recursive: true });
			}
			copyFileSync(src, dest);
		}
	}
};

copyFiles("js");
if (args.includes("--decl")) copyFiles("d.ts");
