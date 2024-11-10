import * as esbuild from "esbuild";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

const BUILD_DIR = "dist";

const buildAll = async (minify) => {
	const ext = minify ? ".min.js" : ".js";
	for (let [entry, out] of [
		["src/index.ts", "genart"],
		["src/adapters/urlparams.ts", "adapter-urlparams"],
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
		if (out === "genart") {
			const pkg = JSON.parse(readFileSync("package.json"));
			console.log("injecting version:", pkg.version, outFile);
			writeFileSync(
				outFile,
				readFileSync(outFile, "utf-8").replace(
					"__VERSION__",
					pkg.version
				)
			);
		}
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
copyFileSync("LICENSE", `${BUILD_DIR}/LICENSE`);
