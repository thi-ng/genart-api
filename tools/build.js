import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const buildAll = async (minify) => {
	const ext = minify ? ".min.js" : ".js";
	const src = resolve(process.argv[2]);
	const out = process.argv[3];
	const outFile = `${resolve(out)}${ext}`;
	console.log("building", outFile);
	await esbuild.build({
		entryPoints: [src],
		outfile: outFile,
		platform: "browser",
		target: "es2022",
		bundle: true,
		minify,
		tsconfig: "tsconfig.json",
	});
	if (out === "genart") {
		const pkg = JSON.parse(readFileSync(resolve("package.json")));
		console.log("injecting version:", pkg.version, outFile);
		writeFileSync(
			outFile,
			readFileSync(outFile, "utf-8").replace("__VERSION__", pkg.version)
		);
	}
};

await buildAll(false);
await buildAll(true);
