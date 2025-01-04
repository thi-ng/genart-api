import { readdirSync, rmSync, statSync, unlinkSync } from "node:fs";
import { basename, sep } from "node:path";

// utility functions adapted from thi.ng/file-io
// used here directly to be entirely self-contained...

const isDirectory = (path) => statSync(path).isDirectory();

const files = (dir, match, maxDepth = Infinity) =>
	__files(dir, match, maxDepth, 0);

function* __files(dir, match, maxDepth = Infinity, depth = 0) {
	if (depth >= maxDepth) return;
	const pred = (x) => match.test(x);
	for (let f of readdirSync(dir).sort()) {
		const curr = dir + sep + f;
		try {
			if (isDirectory(curr)) {
				yield* __files(curr, match, maxDepth, depth + 1);
			} else if (pred(curr)) {
				yield curr;
			}
		} catch (e) {
			console.warn(`ignoring file: ${f} (${e.message})`);
		}
	}
}

function* dirs(dir, pred, maxDepth = Infinity, depth = 0) {
	if (depth >= maxDepth) return;
	for (let f of readdirSync(dir).sort()) {
		const curr = dir + sep + f;
		try {
			if (statSync(curr).isDirectory()) {
				if (pred(curr)) yield curr;
				yield* dirs(curr, pred, maxDepth, depth + 1);
			}
		} catch (e) {
			console.warn(`ignoring file/dir: ${f} (${e.message})`);
		}
	}
}

// accept & merge additional dirs as CLI args
const removeDirs = new Set([
	"doc",
	"api",
	"generated",
	"internal",
	...process.argv.slice(2),
]);

for (let d of dirs(".", (x) => removeDirs.has(basename(x)), 1)) {
	console.log("removing directory:", d);
	rmSync(d, { recursive: true, force: true });
}

for (let f of files(".", /\.(map|js|d\.ts|tsbuildinfo|wasn|wast|o)$/)) {
	if (f.indexOf("/bin/") === -1) {
		console.log("removing file:", f);
		unlinkSync(f);
	}
}
