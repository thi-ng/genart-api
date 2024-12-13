import { readFileSync, writeFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("../../packages/core/package.json"));
writeFileSync(
	"src/version.ts",
	`// generated - DO NOT EDIT!\nexport const MIN_API_VERSION = "v${pkg.version}";`
);
