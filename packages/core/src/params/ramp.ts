import type { ParamImpl, RampParam } from "../api/params.js";
import { easeInOut5, fit, mix, norm, smoothstep01 } from "../math.js";
import { choice, numlist } from "./factories.js";

export const ramp: ParamImpl = {
	validate: () => false,
	read: (spec, t) => {
		const { stops, mode } = <RampParam>spec;
		let n = stops.length;
		let i = n;
		for (; (i -= 2) >= 0; ) {
			if (t >= stops[i]) break;
		}
		n -= 2;
		const at = stops[i];
		const av = stops[i + 1];
		const bt = stops[i + 2];
		const bv = stops[i + 3];
		return i < 0
			? stops[1]
			: i >= n
			? stops[n + 1]
			: {
					exp: () => mix(av, bv, easeInOut5(norm(t, at, bt))),
					linear: () => fit(t, at, bt, av, bv),
					smooth: () => mix(av, bv, smoothstep01(norm(t, at, bt))),
			  }[mode || "linear"]();
	},
	params: {
		stops: numlist({
			name: "Ramp stops",
			desc: "Control points",
			minLength: 4,
			maxLength: Infinity,
			default: [],
		}),
		mode: choice<Exclude<RampParam["mode"], undefined>>({
			name: "Ramp mode",
			desc: "Interpolation method",
			options: ["linear", "smooth", "exp"],
		}),
	},
};
