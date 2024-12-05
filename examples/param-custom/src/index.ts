import type { GenArtAPI, Param } from "@genart-api/core";

declare var $genart: GenArtAPI;

const TAU = 2 * Math.PI;

// type definition of a custom parameter type
interface OscParam extends Param<number> {
	/**
	 * Param types MUST have unique names, best done using prefixes
	 */
	type: "user:osc";
	/**
	 * Waveform type
	 */
	mode: "sin" | "tri" | "saw";
	/**
	 * Frequency (in Hz)
	 */
	freq: number;
	/**
	 * Amplitude / scale factor.
	 */
	amp: number;
	/**
	 * Center offset
	 */
	offset: number;
}

// register custom parameter type used by this artwork
//
// usually, it's expected/likely that a platform adapter would register any such
// extensions, but as is shown in this example, there're also use cases, where
// an artwork itself might do so...

$genart.registerParamType("user:osc", {
	// for brevity we decide this param cannot be customized directly
	// (only via its nested params)
	validate: () => false,
	// the read function is called each time this param is evaluated,
	// here to provide a time-based value
	read: (spec, t) => {
		const { freq, amp, offset, mode } = <OscParam>spec;
		t *= freq;
		t = t - Math.floor(t);
		switch (mode) {
			case "sin":
				return Math.sin(t * TAU) * amp + offset;
			case "tri":
				return (Math.abs(t * 4 - 2) - 1) * amp + offset;
			case "saw":
				return (t * 2 - 1) * amp + offset;
			default:
				return 0;
		}
	},
	/**
	 * Sub-parameters to allow customizing oscillator config. The IDs of these
	 * params MUST correspond to properties in {@link OscParam}.
	 *
	 * When the artwork calls {@link GenArtAPI.setParams}, these nested param
	 * descriptions will also be included in the {@link SetParamMsg} sent to
	 * external tooling (e.g. param editors) so that the appropriate GUI widgets
	 * can be generated.
	 */
	params: {
		mode: $genart.params.choice<OscParam["mode"]>({
			name: "Mode",
			desc: "Waveform",
			options: ["sin", "saw", "tri"],
			default: "sin",
		}),
		freq: $genart.params.range({
			name: "Frequency",
			desc: "Oscillator fequency (in Hz)",
			min: 0,
			max: 1,
			step: 0.01,
		}),
		amp: $genart.params.range({
			name: "Amplitude",
			desc: "Amplification factor",
			min: 0,
			max: 1,
			step: 0.01,
			default: 1,
		}),
		offset: $genart.params.range({
			name: "Offset",
			desc: "Center value offset",
			min: -1,
			max: 1,
			step: 0.01,
			default: 0,
		}),
	},
});

(async () => {
	// Optional (see: https://docs.thi.ng/umbrella/genart-api/interfaces/GenArtAPIOpts)
	$genart.configure({ id: "param-custom" });

	// ensure platform adapter is ready before starting artwork
	await $genart.waitForAdapter();

	const param = await $genart.setParams({
		oscX: <OscParam>{
			name: "Osc X",
			desc: "Oscillator X",
			type: "user:osc", // param type
			mode: "sin", // waveform type
			freq: 0.1, // frequency in Hz
			amp: 1, // amplitude
			offset: 0, // center offset
			default: 0, // ignored,
			randomize: false,
		},

		oscY: <OscParam>{
			name: "Osc Y",
			desc: "Oscillator Y",
			type: "user:osc", // param type
			mode: "tri", // waveform type
			freq: 0.1, // frequency in Hz
			amp: 1, // amplitude
			offset: 0, // center offset
			default: 0, // ignored,
			randomize: false,
		},

		color: $genart.params.color({
			name: "Color",
			desc: "Line color",
			default: "#00ffff",
		}),

		num: $genart.params.range({
			name: "Line count",
			desc: "Number of lines per oscillator",
			min: 1,
			max: 50,
			default: 25,
		}),

		delay: $genart.params.range({
			name: "Phase delay",
			desc: "Normalized delay per segment",
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.25,
		}),
	});

	console.log(JSON.stringify($genart.paramSpecs, null, 4));

	const { width: W, height: H } = $genart.screen;
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d")!;
	canvas.width = W;
	canvas.height = H;
	document.body.appendChild(canvas);

	$genart.setUpdate((t) => {
		ctx.strokeStyle = param("color");
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, W, H);
		for (let i = 0, num = param("num"); i < num; i++) {
			const x = $genart.math.fit(
				param("oscX", t * 0.001 + param("delay") * i),
				-1,
				1,
				10,
				W - 10
			);
			const y = $genart.math.fit(
				param("oscY", t * 0.001 + param("delay") * i),
				-1,
				1,
				10,
				H - 10
			);
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, H);
			ctx.moveTo(0, y);
			ctx.lineTo(W, y);
			ctx.arc(x, y, 5, 0, TAU);
			ctx.stroke();
		}
		return true;
	});

	$genart.on("genart:param-change", (e) => {
		console.log("art param change", e);
	});
})();
