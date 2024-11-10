// param accessor function
let param;

// setup function should be async
async function setup() {
	// Optional (see: https://docs.thi.ng/umbrella/genart-api/interfaces/GenArtAPI.html#id)
	// $genart.id = "p5-basic";

	// ensure platform adapter is ready before starting artwork
	await $genart.waitForAdapter();

	// declare paramters & their constraints
	param = await $genart.setParams({
		bg: $genart.params.color({
			name: "Background",
			desc: "Baackground color",
			default: "#c0c0c0",
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
			min: 0.0001,
			max: 0.005,
			step: 0.0001,
		}),
		scaleT: $genart.params.range({
			name: "Time scale",
			desc: "Noise scale factor for time",
			min: 0.0001,
			max: 0.001,
			step: 0.0001,
		}),
	});
	// create canvas using the dimensions defined by the platform
	createCanvas($genart.screen.width, $genart.screen.height);

	// disable normal p5.js animation loop
	noLoop();
	// register draw function with GenArt API to enable transport control (play/pause)
	$genart.setUpdate(draw);
}

function draw(time) {
	background(param("bg"));
	// get current parameter values
	const maxRadius = param("radius") * min(width, height) * 0.8;
	const scaleX = param("scaleX");
	const scaleT = param("scaleT");
	stroke(param("stroke"));
	// draw circles
	for (let x = 0; x < width + maxRadius; x += 10) {
		const r = noise(x * scaleX + (time * scaleT) / 10);
		const y = ((noise(x * scaleX + time * scaleT) - 0.5) * 2 * height) / 3;
		fill(lerpColor(color(0, 0, 0), color(param("fill")), r ** 0.5));
		circle(x, height / 2 + y, r * maxRadius);
	}
	// MUST return true to continue animating
	return true;
}
