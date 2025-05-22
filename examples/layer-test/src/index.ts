import { canvas2d } from "@thi.ng/canvas";
import { colorFromRange, css, lch, srgb } from "@thi.ng/color";

// Optional (see: https://docs.thi.ng/genart-api/core/interfaces/GenArtAPIOpts.html)
$genart.configure({
	id: "layer-test",
	allowExternalConfig: import.meta.env.DEV,
});
await $genart.waitForAdapter();

const param = await $genart.setParams({
	numShapes: $genart.params.range({
		name: "Shape count",
		desc: "Number of circles to draw",
		edit: "protected",
		min: 10,
		max: 1000,
		step: 10,
		default: 50,
		update: "reload",
	}),
	maxSpeed: $genart.params.range({
		name: "Max speed",
		desc: "Max. rotation speed for each circle",
		edit: "protected",
		min: 1,
		max: 100,
		step: 1,
		default: 50,
	}),
	shapeColor: $genart.params.color({
		name: "Shape color",
		desc: "Base color (will be varied per shape)",
		edit: "public",
		default: "#ff00ff",
		update: "reload",
	}),
	bgColor: $genart.params.choice({
		name: "Background color",
		desc: "Preset color",
		edit: "public",
		default: "#ffffff",
		options: [
			["#000000", "Black"],
			["#888888", "Gray"],
			["#ffffff", "White"],
		],
	}),
	filled: $genart.params.toggle({
		name: "Fill shapes",
		desc: "Disable to only draw outlines",
		default: false,
	}),
	clear: $genart.params.toggle({
		name: "Clear background",
		desc: "If disabled, shapes will draw traces",
		default: true,
	}),
	text: $genart.params.text({
		name: "Message",
		desc: "Testing only",
		default: "Hello Layer",
		maxLength: 32,
	}),
});

console.log($genart.random, $genart.paramSpecs);

// window.addEventListener("keydown", (e) => {
// 	if (e.key === " ") $layer.debug = !$layer.debug;
// });

$genart.on("genart:param-change", ({ paramID, param }) => {
	console.log("param change:", paramID, param);
});

$genart.on("genart:resize", ({ screen }) => {
	console.log("resize", screen);
	reset();
});

const random = $genart.random.rnd;

let width: number;
let height: number;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let particles: Particle[];

class Particle {
	phase = 0;
	speed = random() * (param("maxSpeed") * 0.002) + 0.005;

	constructor(
		public x: number,
		public y: number,
		public r1: number,
		public r2: number,
		public col: string
	) {}

	update() {
		this.phase += this.speed;
	}

	draw() {
		const filled = param("filled");
		ctx[filled ? "fillStyle" : "strokeStyle"] = this.col;
		ctx.beginPath();
		ctx.arc(
			this.x + this.r1 * Math.cos(this.phase),
			this.y + this.r1 * Math.sin(this.phase),
			this.r2,
			0,
			2 * Math.PI
		);
		filled ? ctx.fill() : ctx.stroke();
	}
}

const reset = () => {
	({ width, height } = $genart.screen);
	if (!canvas) {
		({ canvas } = canvas2d(width, height, document.body));
	}
	canvas.width = width;
	canvas.height = height;
	ctx = canvas.getContext("2d")!;
	ctx.font = "56px sans-serif";
	ctx.textAlign = "center";

	particles = [];
	const minRadius = width * 0.025;
	const maxRadius = width * 0.125;
	for (let i = 0, num = param("numShapes"); i < num; i++) {
		particles.push(
			new Particle(
				random() * width,
				random() * height,
				random() * maxRadius + minRadius,
				random() * maxRadius + minRadius,
				css(
					colorFromRange("warm", {
						base: lch(srgb(param("shapeColor"))),
					})
				)
			)
		);
	}
	ctx.fillStyle = param("bgColor");
	ctx.fillRect(0, 0, width, height);
};

reset();

// @ts-ignore possibly unused params
$genart.setUpdate((time, frame) => {
	if (param("clear")) {
		ctx.fillStyle = param("bgColor");
		ctx.fillRect(0, 0, width, height);
	}
	for (let p of particles) {
		p.update();
		p.draw();
	}
	ctx.fillStyle = param("shapeColor");
	ctx.fillText(param("text"), width / 2, height / 2);
	ctx.fillText(`${width}x${height}`, width / 2, height / 2 + 64);

	if (frame === 0) $genart.capture(canvas);

	// must return true to keep animating
	return true;
});
