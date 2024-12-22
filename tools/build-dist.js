import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEST = "../../dist";

const include = (f) =>
	f.startsWith("./api") ||
	f.startsWith("./genart") ||
	f.startsWith("./adapter-");

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
copyFiles("d.ts");
