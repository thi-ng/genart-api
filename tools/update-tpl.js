import { readFileSync, writeFileSync } from "node:fs";

const TPL_PKG_PATH = "project-template/package.json";
const pkg = JSON.parse(readFileSync("packages/core/package.json"));
const tplPkg = JSON.parse(readFileSync(TPL_PKG_PATH));

tplPkg.dependencies = {
	"@genart-api/core": `^${pkg.version}`,
	"@genart-api/adpater-urlparams": `^${pkg.version}`,
};

writeFileSync(TPL_PKG_PATH, JSON.stringify(tplPkg, null, "\t"));
