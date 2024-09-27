import { adaptiveCanvas2d } from "@thi.ng/canvas";
import { isString } from "@thi.ng/checks";
import { U24 } from "@thi.ng/hex";
import { draw } from "@thi.ng/hiccup-canvas";
import {
	buttonH,
	DEFAULT_THEME,
	defGUI,
	dropdown,
	IMGUI,
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
import { EASING_N, HERMITE_N, LINEAR_N, ramp } from "@thi.ng/ramp";
import { range } from "@thi.ng/transducers";
import type {
	ChoiceParam,
	Features,
	Maybe,
	ParamSpecs,
	RampParam,
	RangeParam,
	WeightedChoiceParam,
} from "../../../src/api.js";

const DPR = window.devicePixelRatio;
const APP = document.getElementById("app")!;
const W = APP.getBoundingClientRect().width - 32;
const H = 1500;

let apiID: string;
let features: Features;
let params: ParamSpecs;
let iframeParams: string;
let selfUpdate = false;
let gui: Maybe<IMGUI>;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const EXPONENTIAL_N = EASING_N();

const iframe = (<HTMLIFrameElement>document.getElementById("art"))
	.contentWindow!;

window.addEventListener("message", (e) => {
	switch (e.data.type) {
		case "genart:setfeatures":
			features = e.data.features;
			break;
		case "genart:setparams":
			apiID = e.data.apiID;
			params = e.data.params;
			gui && updateGUI();
			break;
		case "genart:paramchange":
			selfUpdate = true;
			params[e.data.paramID] = e.data.spec;
			gui && updateGUI();
			selfUpdate = false;
			break;
		case "paramadapter:update":
			iframeParams = e.data.params;
			break;
	}
});

const updateWidgets = (draw: boolean) => {
	const COLS = 3;
	const layout = gridLayout(1, 1, W - 2, COLS, 20, 4);
	gui!.begin(draw);
	let changedID: Maybe<string>;
	let changedKey: Maybe<string>;
	let changedValue: any;
	for (let id in params) {
		const param = params[id];
		const label = param.name || id;
		const value = param.value ?? param.default;
		let res: any;
		textLabel(gui!, layout.next([COLS, 1]), param.desc ?? "");
		switch (param.type) {
			case "choice":
				{
					const $param = <ChoiceParam<any>>param;
					const idx = dropdown(
						gui!,
						layout.nest(1, [COLS - 1, 1], 0),
						id,
						$param.options.findIndex(
							(x) => (isString(x) ? x : x[0]) === value
						),
						$param.options.map((x) => (isString(x) ? x : x[1])),
						label,
						param.doc
					);
					if (idx != null) {
						res = $param.options[idx];
						if (!isString(res)) res = res[0];
					}
				}
				break;
			case "weighted":
				{
					const $param = <WeightedChoiceParam<any>>param;
					const idx = dropdown(
						gui!,
						layout.nest(1, [COLS - 1, 1], 0),
						id,
						$param.options.findIndex((x) => x[1] === value),
						$param.options.map((x) => x[2] || `${x[1]} (${x[0]})`),
						label,
						param.doc
					);
					if (idx != null) {
						res = $param.options[idx][1];
					}
				}
				break;
			case "color":
				{
					const num = parseInt(value.substring(1), 16);
					const rgb = [num >> 16, (num >> 8) & 0xff, num & 0xff];
					const edit = sliderHGroup(
						gui!,
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
						res = U24((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]);
					}
				}
				break;
			case "date":
				{
					const date = <Date>value;
					let idx = dropdown(
						gui!,
						layout.nest(1, undefined, 0),
						id + "year",
						date.getFullYear() - 2024,
						["2024", "2025", "2026", "2027", "2028", "2029"],
						"Year",
						param.doc
					);
					if (idx != null) {
						res = new Date(
							Date.UTC(
								idx + 2024,
								date.getMonth(),
								date.getDate()
							)
						);
					}
					idx = dropdown(
						gui!,
						layout.nest(1, undefined, 0),
						id + "month",
						date.getMonth(),
						[
							"Jan",
							"Feb",
							"Mar",
							"Apr",
							"May",
							"Jun",
							"Jul",
							"Aug",
							"Sep",
							"Oct",
							"Nov",
							"Dec",
						],
						"Month",
						param.doc
					);
					if (idx != null) {
						res = new Date(
							Date.UTC(date.getFullYear(), idx, date.getDate())
						);
					}
					idx = dropdown(
						gui!,
						layout.nest(1, undefined, 0),
						id + "day",
						date.getDate() - 1,
						[...range(1, 32)].map(String),
						"Day",
						param.doc
					);
					if (idx != null) {
						res = new Date(
							Date.UTC(
								date.getFullYear(),
								date.getMonth(),
								idx + 1
							)
						);
					}
				}
				break;
			case "toggle":
				res = toggle(
					gui!,
					layout.next([COLS - 1, 1]),
					id,
					value,
					false,
					label,
					param.doc
				);
				break;
			case "range":
				{
					const { min, max, step = 1 } = <RangeParam>param;
					res = sliderH(
						gui!,
						layout.next([COLS - 1, 1]),
						id,
						min,
						max,
						step,
						value,
						label,
						undefined,
						param.doc
					);
				}
				break;
			case "text":
				{
					res = textField(
						gui!,
						layout.next([COLS, 1]),
						id,
						value,
						undefined,
						param.doc
					);
				}
				break;
			case "ramp":
				{
					const $param = <RampParam>param;
					const modes = ["linear", "smooth", "exp"];
					let modeID = modes.indexOf($param.mode || "linear");
					const $res = rampWidget(
						gui!,
						layout.next([COLS, 5]),
						id,
						ramp(
							[LINEAR_N, HERMITE_N, EXPONENTIAL_N][modeID],
							$param.stops
						),
						modeID,
						param.doc
					);
					if ($res) {
						res = $res.stops;
					}
					const mode = dropdown(
						gui!,
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
					gui!,
					layout,
					id,
					[0, 0],
					[1, 1],
					0.001,
					value,
					0,
					true,
					undefined,
					([x, y]) => `${x.toFixed(3)}, ${y.toFixed(3)}`,
					param.doc
				);
				break;
		}
		if (param.randomize !== false) {
			const rnd = buttonH(gui!, layout, id + "-rnd", "Randomize");
			if (!draw && rnd) {
				iframe.postMessage(
					{
						type: "genart:randomizeparam",
						apiID,
						paramID: id,
					},
					"*"
				);
			}
		}
		if (!draw && res != null) {
			changedID = id;
			changedValue = res;
		}
	}
	gui!.end();
	if (changedID && !selfUpdate)
		emitChange(changedID, changedValue, changedKey);
};

const updateGUI = () => {
	updateWidgets(false);
	let activeID = gui!.hotID;
	updateWidgets(true);
	draw(ctx!, ["g", { __clear: true, scale: DPR }, gui]);
	return activeID;
};

const emitChange = (id: string, value: any, key?: string) => {
	console.log("emit", id, value);
	if (params[id].value !== value) {
		iframe.postMessage(
			{
				type: "genart:setparamvalue",
				apiID,
				paramID: id,
				value,
				key,
			},
			"*"
		);
	} else {
		console.log("no change...");
	}
};

export const launchEditorImgui = () => {
	({ canvas, ctx } = adaptiveCanvas2d(W, H, document.getElementById("app")));
	gui = defGUI({
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

	let buttons = 0;
	let pos = [0, 0];

	const updatePos = (e: MouseEvent | TouchEvent) => {
		const { left, top } = canvas.getBoundingClientRect();
		const isTouch = e.type.startsWith("touch");
		const isUp = isTouch && e.type === "touchend";
		if (isTouch) {
			const $e = <TouchEvent>e;
			if (!isUp)
				pos = [
					$e.touches[0].clientX - left,
					$e.touches[0].clientY - top,
				];
			gui!.setMouse(pos, isUp ? 0 : 1);
		} else {
			const $e = <MouseEvent>e;
			gui!.setMouse([$e.clientX - left, $e.clientY - top], $e.buttons);
		}
		const id = updateGUI();
		if (id && !isUp) e.preventDefault();
	};

	canvas.addEventListener("mousedown", updatePos);
	canvas.addEventListener("mousemove", updatePos);
	canvas.addEventListener("mouseup", updatePos);
	canvas.addEventListener("touchstart", updatePos);
	canvas.addEventListener("touchmove", updatePos);
	canvas.addEventListener("touchend", updatePos);

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
		gui!.setKey(e);
		updateGUI();
	});

	window.addEventListener("keyup", (e) => {
		gui!.setKey(e);
	});

	updateGUI();
};
