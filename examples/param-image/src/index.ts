import type { GenArtAPI } from "../../../src/api.js";

declare var $genart: GenArtAPI;

const RES = 64;
const TAU = 2 * Math.PI;

(async () => {
	// $genart.id = "param-image";
	await $genart.waitForAdapter();

	const param = await $genart.setParams({
		img: $genart.params.image({
			name: "Image map",
			desc: "Base image",
			width: RES,
			height: RES,
			format: "gray",
		}),

		bg: $genart.params.color({
			name: "Bg color",
			desc: "Background",
			default: "#000000",
		}),

		dot: $genart.params.color({
			name: "Dot color",
			desc: "Color used for drawing the grid of dots",
			default: "#ff0066",
		}),

		size: $genart.params.range({
			name: "Size",
			desc: "Maximum dot size",
			default: 10,
			min: 5,
			max: 20,
			step: 1,
		}),

		gamma: $genart.params.range({
			name: "Gamma",
			desc: "Contrast curve",
			default: 2,
			min: 0.1,
			max: 3,
			step: 0.1,
		}),

		invert: $genart.params.toggle({
			name: "Invert",
			desc: "Invert brightness",
			default: false,
		}),
	});

	console.log(JSON.stringify($genart.paramSpecs, null, 4));

	const { width: W, height: H } = $genart.screen;
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d")!;
	canvas.width = W;
	canvas.height = H;
	document.body.appendChild(canvas);

	$genart.setUpdate(() => {
		const bg = param("bg");
		const col = param("dot");
		const invert = param("invert");
		const size = param("size");
		const gamma = param("gamma");
		const img = param("img");
		ctx.strokeStyle = "none";
		ctx.fillStyle = invert ? col : bg;
		ctx.fillRect(0, 0, W, H);
		ctx.fillStyle = invert ? bg : col;
		for (let y = 0; y < RES; y++) {
			for (let x = 0; x < RES; x++) {
				ctx.beginPath();
				ctx.arc(
					$genart.math.fit(x, 0, RES - 1, size, W - size),
					$genart.math.fit(y, 0, RES - 1, size, H - size),
					1 + size * (img[x + y * RES] / 255) ** gamma,
					0,
					TAU
				);
				ctx.fill();
			}
		}
		return true;
	});

	$genart.on("genart:paramchange", (e) => {
		console.log("art param change", e.paramID, e.spec);
	});
})();
