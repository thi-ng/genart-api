import { adaptiveCanvas2d } from "@thi.ng/canvas";
import { draw } from "@thi.ng/hiccup-canvas";
import {
	buttonH,
	DEFAULT_THEME,
	defGUI,
	dropdown,
	Key,
	ramp as rampWidget,
	sliderH,
	sliderHGroup,
	textField,
	textLabel,
	toggle,
	xyPad,
} from "@thi.ng/imgui";
import { gridLayout } from "@thi.ng/layout";
import { HERMITE_N, LINEAR_N, ramp, type RampImpl } from "@thi.ng/ramp";
import { gestureStream } from "@thi.ng/rstream-gestures";
import type {
	ChoiceParam,
	Features,
	Maybe,
	ParamSpecs,
	RampParam,
	RangeParam,
} from "../api.js";
import { easeInOut5, mix, norm } from "../math.js";
import { isString, u24 } from "../utils.js";

const DPR = window.devicePixelRatio;
const W = 400; //window.innerWidth - 600 - 3 * 16;
const H = window.innerHeight;

const unsupportedRND = ["text", "ramp", "weighted"];

let apiID: string;
let features: Features;
let params: ParamSpecs;
let iframeParams: string;
let selfUpdate = false;

export const EXPONENTIAL_N: RampImpl<number> = {
	min: (acc, x) => Math.min(acc ?? Infinity, x),
	max: (acc, x) => Math.max(acc ?? -Infinity, x),
	at: (stops, i, t) => {
		const a = stops[i];
		const b = stops[i + 1];
		return mix(a[1], b[1], easeInOut5(norm(t, a[0], b[0])));
	},
};

const iframe = (<HTMLIFrameElement>document.getElementById("art"))
	.contentWindow!;

const { canvas, ctx } = adaptiveCanvas2d(W, H, document.getElementById("app"));
const gui = defGUI({
	theme: {
		...DEFAULT_THEME,
		font: "12px monospace",
		charWidth: 7,
		baseLine: 4,
		// focus: "#000",
		cursorBlink: 0,
		bgTooltip: "#ffff80cc",
	},
});

gestureStream(canvas, { scale: false }).subscribe({
	next(e) {
		gui.setMouse(e.pos, e.buttons);
		updateGUI();
	},
});

window.addEventListener("message", (e) => {
	switch (e.data.type) {
		case "genart:setfeatures":
			features = e.data.features;
			break;
		case "genart:setparams":
			apiID = e.data.apiID;
			params = e.data.params;
			updateGUI();
			break;
		case "genart:paramchange":
			selfUpdate = true;
			params[e.data.paramID] = e.data.spec;
			updateGUI();
			selfUpdate = false;
			break;
		case "paramadapter:update":
			iframeParams = e.data.params;
			break;
	}
});

window.addEventListener("keydown", (e) => {
	// if (e.target !== canvas) return;
	if (
		e.key === Key.TAB ||
		e.key === Key.SPACE ||
		e.key === Key.UP ||
		e.key === Key.DOWN ||
		e.key === Key.LEFT ||
		e.key === Key.RIGHT
	) {
		e.preventDefault();
	}
	gui.setKey(e);
	updateGUI();
});

window.addEventListener("keyup", (e) => {
	gui.setKey(e);
});

const updateWidgets = (draw: boolean) => {
	const COLS = 3;
	const layout = gridLayout(1, 1, W - 2, COLS, 20, 4);
	gui.begin(draw);
	let changedID: Maybe<string>;
	let changedKey: Maybe<string>;
	let changedValue: any;
	for (let id in params) {
		const param = params[id];
		const label = param.name || id;
		const value = param.value ?? param.default;
		let res: any;
		textLabel(gui, layout.next([COLS, 1]), param.doc);
		switch (param.type) {
			case "choice":
				{
					const $param = <ChoiceParam<any>>param;
					const idx = dropdown(
						gui,
						layout.nest(1, [COLS - 1, 1], 0),
						id,
						$param.options.findIndex(
							(x) => (isString(x) ? x : x[0]) === value
						),
						$param.options.map((x) => (isString(x) ? x : x[1])),
						label,
						param.tooltip
					);
					if (idx != null) {
						res = $param.options[idx];
						if (!isString(res)) res = res[0];
					}
				}
				break;
			case "color":
				{
					const num = parseInt(value.substring(1), 16);
					const rgb = [num >> 16, (num >> 8) & 0xff, num & 0xff];
					const edit = sliderHGroup(
						gui,
						layout,
						id,
						0,
						255,
						1,
						true,
						rgb,
						["R", "G", "B"],
						undefined
					);
					layout.next([COLS - 1, 1]);
					if (edit) {
						rgb[edit[0]] = edit[1];
						res = u24((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]);
					}
				}
				break;
			case "toggle":
				res = toggle(
					gui,
					layout.next([COLS - 1, 1]),
					id,
					value,
					false,
					label,
					param.tooltip
				);
				break;
			case "range":
				{
					const { min, max, step = 1 } = <RangeParam>param;
					res = sliderH(
						gui,
						layout.next([COLS - 1, 1]),
						id,
						min,
						max,
						step,
						value,
						label,
						undefined,
						param.tooltip
					);
				}
				break;
			case "text":
				{
					res = textField(
						gui,
						layout.next([COLS, 1]),
						id,
						value,
						undefined,
						param.tooltip
					);
				}
				break;
			case "ramp":
				{
					const $param = <RampParam>param;
					const modes = ["linear", "smooth", "exp"];
					let modeID = modes.indexOf($param.mode || "linear");
					const $res = rampWidget(
						gui,
						layout.next([COLS, 5]),
						id,
						ramp(
							[LINEAR_N, HERMITE_N, EXPONENTIAL_N][modeID],
							$param.stops
						),
						modeID,
						param.tooltip
					);
					if ($res) {
						res = $res.stops;
					}
					const mode = dropdown(
						gui,
						layout.nest(1, [COLS, 1], 0),
						id + "-mode",
						modeID,
						modes,
						"Ramp mode"
					);
					if (mode != null) {
						res = modes[mode];
						changedKey = "mode";
					}
				}
				break;
			case "xy":
				res = xyPad(
					gui,
					layout,
					id,
					[0, 0],
					[1, 1],
					0.001,
					value,
					0,
					true,
					undefined,
					([x, y]) => `${x.toFixed(3)}, ${x.toFixed(3)}`,
					param.tooltip
				);
				break;
		}
		if (!unsupportedRND.includes(param.type)) {
			const rnd = buttonH(gui, layout, id + "-rnd", "Randomize");
			if (!draw && rnd) {
				iframe.postMessage({
					type: "genart:randomizeparam",
					apiID,
					paramID: id,
				});
			}
		} else {
			// layout.next();
		}
		if (!draw && res != null) {
			changedID = id;
			changedValue = res;
		}
	}
	gui.end();
	if (changedID && !selfUpdate)
		emitChange(changedID, changedValue, changedKey);
};

const updateGUI = () => {
	updateWidgets(false);
	updateWidgets(true);
	draw(ctx, ["g", { __clear: true, scale: DPR }, gui]);
};

const emitChange = (id: string, value: any, key?: string) => {
	console.log("emit", id, value);
	if (params[id].value !== value) {
		iframe.postMessage({
			type: "genart:setparamvalue",
			apiID,
			paramID: id,
			value,
			key,
		});
	} else {
		console.log("no change...");
	}
};
