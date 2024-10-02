import * as esbuild from "esbuild";

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
