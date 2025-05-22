// param accessor function
let param;
let canvas;

// setup function should be async!
async function setup() {
	// Optional (see: https://docs.thi.ng/genart-api/core/interfaces/GenArtAPIOpts.html)
	$genart.configure({
		id: "p5-basic",
		allowExternalConfig: import.meta.env.DEV,
	});

	// ensure platform adapter is ready before starting artwork
	await $genart.waitForAdapter();

	// disable normal p5.js animation loop
	// (we'll use GenArtAPI's mechanism instead, see further below...)
	noLoop();

	// declare paramters & their constraints
	// these params are also passed to the platform adapter, which then might
	// override some default values with stored customizations...
	// (depending on platform, this might be an async operation)
	// the returned function can then be used to read parameter values,
	// see: https://docs.thi.ng/genart-api/core/interfaces/GenArtAPI.html#setparams
	param = await $genart.setParams({
		bg: $genart.params.color({
			name: "Background",
			desc: "Baackground color",
			default: "#303030",
		}),
		fill: $genart.params.color({
			name: "Fill",
			desc: "Circle fill color",
		}),
		stroke: $genart.params.color({
			name: "Stroke",
			desc: "Circle outline color",
		}),
		radius: $genart.params.range({
			name: "Radius",
			desc: "Normalized circle radius",
			min: 0.1,
			max: 1,
			step: 0.05,
		}),
		scaleX: $genart.params.range({
			name: "X scale",
			desc: "Noise scale factor for X-position",
			min: 0.0005,
			max: 0.005,
			step: 0.0001,
		}),
		scaleT: $genart.params.range({
			name: "Time scale",
			desc: "Noise scale factor for time",
			min: 0.0005,
			max: 0.001,
			step: 0.0001,
		}),
	});

	// use pixel density defined by platform adapter
	pixelDensity($genart.screen.dpr);

	// create canvas using the dimensions defined by the platform
	// store returned canvas for later use (i.e. triggering capture)
	canvas = createCanvas(
		$genart.screen.width,
		$genart.screen.height,
		WEBGL
	).canvas;

	// this sketch only depends on p5's noise function,
	// ensure deterministic outcomes by seeding it first
	noiseSeed($genart.random.rnd() * 1e12);

	// register draw function with GenArt API to enable transport control (play/pause)
	// see: https://docs.thi.ng/genart-api/core/interfaces/GenArtAPI.html#setupdate
	$genart.setUpdate(draw);
}

// draw function receives current frame time (in milliseconds) and frame number
function draw(time, frame) {
	// clear background with configured bg color
	background(param("bg"));

	// get current parameter values
	const maxRadius = param("radius") * min(width, height) * 0.8;
	const scaleX = param("scaleX");
	const scaleT = param("scaleT");

	// apply time scale factory
	time *= scaleT;

	// set outline color
	stroke(param("stroke"));

	// draw circles
	for (let x = 0; x < width + maxRadius; x += 10) {
		const r = noise(x * scaleX + time / 10);
		const y = ((noise(x * scaleX + time) - 0.5) * 2 * height) / 3;
		fill(lerpColor(color(0, 0, 0), color(param("fill")), r ** 0.8));
		ellipse(x - width / 2, y, r * maxRadius, r * maxRadius, 40);
	}

	// trigger capture in first frame
	if (frame === 0) $genart.capture(canvas);

	// MUST return true to continue animating
	return true;
}
