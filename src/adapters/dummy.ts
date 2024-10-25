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
	async initParams(_: ParamSpecs) {},
	async updateParam() {},
	setTraits() {},
	capture() {},
});
