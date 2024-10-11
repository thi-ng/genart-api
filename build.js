import * as esbuild from "esbuild";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

const BUILD_DIR = "dist";

const buildAll = async (minify) => {
	const ext = minify ? ".min.js" : ".js";
	for (let [entry, out] of [
		["src/index.ts", "genart"],
		["src/adapters/urlparams.ts", "adapter-urlparams"],
		["src/time/offline.ts", "time-offline"],
	]) {
		const outFile = `${BUILD_DIR}/${out}${ext}`;
		console.log("building", outFile);
		await esbuild.build({
			entryPoints: [entry],
			outfile: outFile,
			platform: "browser",
			target: "es2022",
			bundle: true,
			minify,
		});
	}
};

await buildAll(false);
await buildAll(true);

const PKG = JSON.parse(readFileSync("package.json"));

writeFileSync(
	`${BUILD_DIR}/package.json`,
	JSON.stringify(
		{
			name: PKG.name,
			version: PKG.version,
			description: PKG.description,
			repository: PKG.repository,
			author: PKG.author,
			license: PKG.license,
			typings: "./genart.d.ts",
			sideEffects: false,
		},
		null,
		4
	)
);

copyFileSync("README.md", `${BUILD_DIR}/README.md`);
