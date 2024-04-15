import type { ParamSpec, ParamImpl, RunMode, Range, Choice } from "../api.js";

export const paramTypes: Record<
	string,
	Pick<ParamImpl<any>, "eval" | "stringify">
> = {
	flag: {
		eval(src) {
			return src === "1" || src.toLowerCase() === "true";
		},
		stringify(x) {
			return x ? "1" : "0";
		},
	},
	range: {
		eval(src, spec) {
			const { min, max, step } = <Range>spec;
			let res = +src;
			return isNaN(res)
				? spec.default
				: $genartAPI.utils.clamp(
						step ? $genartAPI.utils.round(res, step) : res,
						min,
						max
				  );
		},
		stringify(rnd, spec) {
			const prec = Math.max(
				0,
				Math.ceil(-Math.log((<Range>spec).step) / Math.log(10))
			);
			return rnd.toFixed(prec);
		},
	},
	color: {
		eval(src, spec) {
			return (
				(src = /^#?[0-9a-f]{6}$/.test(src) ? src : spec.default),
				src[0] === "#" ? src : "#" + src
			);
		},
		stringify(src) {
			return src;
		},
	},
	choice: {
		eval(src, spec) {
			const { choices } = <Choice>spec;
			const r = parseInt(src, 10);
			return isNaN(r) || r < 0 || r >= choices.length
				? spec.default
				: choices[r];
		},
		stringify(x, spec) {
			return String((<Choice>spec).choices.indexOf(x));
		},
	},
};

$genartAPI.setAdapter(
	(() => {
		const urlParams = new URLSearchParams(location.search);
		const __num = (id: string, fallback = 0) => {
			const x = parseFloat(urlParams.get(id) || "");
			return isNaN(x) ? fallback : x;
		};
		return {
			get mode() {
				return <RunMode>urlParams.get("__mode") || "play";
			},

			get screen() {
				return {
					width: __num("__width", window.innerWidth),
					height: __num("__height", window.innerHeight),
					dpr: __num("__dpr", window.devicePixelRatio || 1),
				};
			},

			get prng() {
				return {
					seed: urlParams.get("__seed") || String(Date.now()),
					rnd: () => Math.random(),
				};
			},

			setParam(id, param) {
				// TODO
			},

			paramValue(id: string, param: ParamSpec<any>, t: number) {
				const src = urlParams.get(id);
				if (src == null) {
					console.warn(
						"missing param:",
						id,
						", using default:",
						param.default
					);
					return param.default;
				}
				return paramTypes[param.type]?.eval(src, param, t);
			},

			capture() {
				console.log("capture");
			},
		};
	})()
);
