import { execFileSync } from "node:child_process";

for (let ex of ["param-custom", "param-editors", "param-image", "param-test"]) {
	console.log("building example:", ex);
	try {
		execFileSync("yarn", ["build"], {
			cwd: `examples/${ex}`,
		});
	} catch (e) {
		console.log(e);
	}
}
