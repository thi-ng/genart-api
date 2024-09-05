const art = (async () => {
	$genart.id = "test";
	await $genart.waitForAdapter();

	type CMYK = "cyan" | "magenta" | "yellow" | "black";

	const param = $genart.setParams({
		dot: $genart.params.choice<CMYK>({
			name: "Dot color",
			doc: "Color used for drawing dots forming the curve",
			tooltip: "Choose one of our exciting™ presets now!",
			options: [
				["cyan", "Cyanide"],
				["magenta", "Magneto"],
				["yellow", "Yolo"],
				["black", "Gothic"],
			],
			default: "black",
		}),

		col: $genart.params.color({
			name: "Color",
			doc: "Text color",
			tooltip:
				"Recommend setting this to a complementary color to the dot/curve color",
			default: "#0000ff",
			update: "reload", // trigger reload on value change
		}),

		fade: $genart.params.range({
			name: "Fade",
			doc: "Background fade opacity",
			tooltip:
				"Lower values will cause more of a trail, but also cause artefacts over time",
			default: 0.05,
			min: 0.01,
			max: 0.3,
			step: 0.01,
			update: "reload", // trigger reload on value change
		}),

		size: $genart.params.range({
			name: "Size",
			doc: "Font size",
			min: 10,
			max: 200,
			default: 50,
		}),

		speed: $genart.params.range({
			name: "Horizontal speed",
			doc: "Curve following speed",
			min: 1,
			max: 5,
			default: 2,
		}),

		txt: $genart.params.text({
			name: "Title",
			doc: "text to display",
			default: "hello",
			multiline: true,
		}),

		curve: $genart.params.xy({
			name: "Lissajous",
			doc: "Curve coefficients",
			default: [0.5, 0.5],
		}),

		ramp: $genart.params.ramp({
			doc: "Curve for text movement",
			stops: [
				[0, 0],
				[1, 1],
			],
			default: 0,
		}),
	});

	const setFeatures = () =>
		$genart.setFeatures({
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

	setFeatures();

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
	const bgColor = `rgb(255 255 255/${param("fade")})`;

	let x = 0;
	$genart.setUpdate((t) => {
		ctx.strokeStyle = "none";
		// fade bg
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, W, H);
		// lissajous curve
		ctx.fillStyle = param("dot");
		const [xx, yy] = param("curve");
		for (let i = 0; i < 20; i++, t += 20) {
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
		const y = 1 - param("ramp", x / W);
		ctx.fillText(param("txt"), x, y * H);

		x += param("speed");
		if (x >= W) {
			// trigger capture
			$genart.capture(canvas);
			x -= W;
		}
	});

	$genart.on("genart:paramchange", (e) => {
		console.log("art param change", e.paramID, e.spec);
		setFeatures();
	});
})();
