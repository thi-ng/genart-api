$genart.setAdapter({
	mode: "play",
	screen: {
		width: window.innerWidth,
		height: window.innerHeight,
		dpr: window.devicePixelRatio,
	},
	prng: {
		seed: String(Date.now()),
		rnd: Math.random,
	},
	updateParam(): undefined {},
	setFeatures() {},
	capture() {},
});
