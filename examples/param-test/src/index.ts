import type { GenArtAPI } from "../../../src/api.js";

declare var $genart: GenArtAPI;

(async () => {
	// log API version
	console.log("$genart version:", $genart.version);

	// Optional (see: https://docs.thi.ng/umbrella/genart-api/interfaces/GenArtAPI.html#id)
	$genart.id = "test";

	// ensure platform adapter is ready before starting artwork
	await $genart.waitForAdapter();

	type CMYK = "cyan" | "magenta" | "yellow" | "black";

	const param = await $genart.setParams({
		dot: $genart.params.choice<CMYK>({
			name: "Dot color",
			desc: "Color used for drawing dots forming the curve",
			doc: "Choose one of our exciting™ presets now!",
			options: [
				["cyan", "Cyanide"],
				["magenta", "Magneto"],
				["yellow", "Yolo"],
				["black", "Gothic"],
			],
			default: "cyan",
		}),

		col: $genart.params.color({
			name: "Color",
			desc: "Text color",
			doc: "Recommend setting this to a complementary color to the dot/curve color",
			default: "#ff6600",
			update: "reload", // trigger reload on value change
		}),

		fade: $genart.params.range({
			name: "Fade",
			desc: "Background fade opacity",
			doc: "Lower values will cause more of a trail, but also cause artefacts over time",
			default: 0.05,
			min: 0.01,
			max: 0.3,
			step: 0.01,
		}),

		size: $genart.params.range({
			name: "Size",
			desc: "Font size",
			min: 10,
			max: 200,
			default: 200,
		}),

		speed: $genart.params.range({
			name: "Horizontal speed",
			desc: "Curve following speed",
			min: 1,
			max: 5,
			default: 2,
		}),

		txt: $genart.params.text({
			name: "Title",
			desc: "text to display",
			default: "hello",
			// multiline: true,
		}),

		curve: $genart.params.xy({
			name: "Lissajous",
			desc: "Curve coefficients",
			default: [0.5, 0.5],
		}),

		numDots: $genart.params.range({
			name: "Dots",
			desc: "Number of dots",
			min: 10,
			max: 20000,
			default: 20,
			step: 10,
		}),

		ramp: $genart.params.ramp({
			name: "Curve",
			desc: "Curve for text movement",
			mode: "smooth",
			stops: [
				[0, 0.5],
				[0.25, 1],
				[0.75, 0],
				[1, 0.5],
			],
			default: 0,
		}),

		date: $genart.params.date({
			name: "Date",
			desc: "Date from which the background fades to black",
			default: new Date("2025-01-01"),
		}),
	});

	console.log(JSON.stringify($genart.paramSpecs, null, 4));

	const setTraits = () =>
		$genart.setTraits({
			fade:
				param("fade") < 0.1
					? "weak"
					: param("fade") < 0.2
					? "medium"
					: "strong",
			curve: {
				cyan: "cool cyan",
				magenta: "hot pink",
				yellow: "bright yellow",
				black: "elegant black",
			}[param("dot")],
		});

	setTraits();

	// obtain dimensions configured by platform adapter
	// (also see resize event handler comments at the end of this file)
	const { width: W, height: H } = $genart.screen;

	const canvas = document.createElement("canvas");
	canvas.width = W;
	canvas.height = H;
	document.body.appendChild(canvas);

	const ctx = canvas.getContext("2d")!;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	// these two params are only evaluated once at start up
	// they're configured such that any changes will auto-trigger a reload
	// (see param specs above...)
	const col = param("col");

	let x = 0;
	$genart.setUpdate((t) => {
		ctx.strokeStyle = "none";
		// fade bg
		const bgColor =
			Date.now() < param("date").getTime()
				? `rgb(255 255 255/${param("fade")})`
				: `rgb(0 0 0/${param("fade")})`;
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, W, H);
		// lissajous curve
		ctx.fillStyle = param("dot");
		const [xx, yy] = param("curve");
		for (let i = 0, n = param("numDots"); i < n; i++, t += 1) {
			ctx.beginPath();
			ctx.arc(
				(0.5 + Math.sin(t * xx * 0.01) * 0.45) * W,
				(0.5 + Math.cos(t * yy * 0.01) * 0.45) * H,
				10,
				0,
				2 * Math.PI
			);
			ctx.fill();
		}
		// text on ramp
		ctx.fillStyle = col;
		ctx.font = `${param("size")}px sans-serif`;
		const y = $genart.math.fit(param("ramp", x / W), 1, 0, 0.2, 0.8) * H;
		ctx.fillText(param("txt"), x, y);

		x += param("speed");
		if (x >= W) {
			// trigger capture
			// $genart.capture(canvas);
			x -= W;
		}
		return true;
	});

	$genart.on("genart:paramchange", (e) => {
		console.log("art param change", e);
		setTraits();
	});

	// reload artwork when platform adapter triggers resize. with the reference
	// adapter this will only happen if the window/iframe is being resized AND
	// if no specific dimensions have been defined via URL search params (i.e.
	// `__width`, `__height` and `__dpr` params)
	//
	// for example, when loading the following URL no resize events will be
	// triggered when resizing the browser window because the given parameters
	// will take priority: http://localhost:5173/?__width=640&__height=640

	$genart.on("genart:resize", () => {
		location.reload();
	});
})();
