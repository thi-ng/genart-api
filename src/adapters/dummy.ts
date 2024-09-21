import type { ParamSpecs } from "../api";

$genart.setAdapter({
	mode: "play",
	screen: {
		width: window.innerWidth,
		height: window.innerHeight,
		dpr: window.devicePixelRatio,
	},
	prng: {
		seed: String(Date.now()),
		reset: () => Math.random,
		rnd: Math.random,
	},
	async updateParam() {
		return undefined;
	},
	async setParams(_: ParamSpecs) {
		return true;
	},
	setFeatures() {},
	capture() {},
});
