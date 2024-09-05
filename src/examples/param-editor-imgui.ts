import { adaptiveCanvas2d } from "@thi.ng/canvas";
import { line, polygon, rect, triangle } from "@thi.ng/geom";
import { draw } from "@thi.ng/hiccup-canvas";
import {
	buttonH,
	DEFAULT_THEME,
	defGUI,
	dropdown,
	IMGUI,
	isHoverSlider,
	Key,
	slider2Val,
	sliderH,
	sliderHGroup,
	textField,
	textLabel,
	toggle,
	tooltipRaw,
	xyPad,
} from "@thi.ng/imgui";
import {
	gridLayout,
	isLayout,
	type IGridLayout,
	type LayoutBox,
} from "@thi.ng/layout";
import { HERMITE_N, LINEAR_N, Ramp, ramp, type RampImpl } from "@thi.ng/ramp";
import { gestureStream } from "@thi.ng/rstream-gestures";
import { fit2, hash, mix2, type Vec } from "@thi.ng/vectors";
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
					res = rampWidget(
						gui,
						layout.next([COLS, 5]),
						id,
						$param.stops,
						modeID,
						param.tooltip
					);
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
			layout.next();
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

export const rampWidget = (
	gui: IMGUI,
	layout: IGridLayout<any> | LayoutBox,
	id: string,
	stops: [number, number][],
	mode: number,
	info?: string
) => {
	let { x, y, w, h } = isLayout(layout) ? layout.next() : layout;
	const maxX = x + w;
	const maxY = y + h;
	const pos = [x, maxY];
	const maxPos = [maxX, y];
	const key = hash([x, y, w, h]);
	gui.registerID(id, key);
	const box = gui.resource(id, key, () => rect([x, y], [w, h]));
	const col = gui.textColor(false);
	const hover = isHoverSlider(gui, id, box, "move");
	let selID = -1;
	let sel: Maybe<Vec>;
	let res: Maybe<typeof stops>;
	const $ramp = ramp([LINEAR_N, HERMITE_N, EXPONENTIAL_N][mode], stops);
	const focused = gui.requestFocus(id);
	if (hover) {
		sel = slider2Val(
			fit2([], gui.mouse, pos, maxPos, [0, 0], [1, 1]),
			[0, 0],
			[1, 1],
			1e-3
		);
		selID = $ramp.closestIndex(sel[0], 0.05);
		if (gui.isMouseDown()) {
			gui.activeID = id;
			if (selID >= 0) {
				$ramp.stops[selID] = <[number, number]>sel;
			} else {
				$ramp.setStopAt(sel[0], sel[1], 0.05);
			}
			res = stops;
		}
		if (focused && selID >= 0 && handleRampKeys(gui, $ramp, selID)) {
			res = stops;
		}
		info && gui.draw && tooltipRaw(gui, info);
	}
	if (gui.draw) {
		box.attribs = {
			fill: gui.bgColor(hover || focused),
			stroke: gui.focusColor(id),
		};
		gui.add(
			box,
			polygon(
				[
					[x, maxY],
					mix2([], pos, maxPos, [0, stops[0][1]]),
					...rampVertices($ramp, mode, pos, maxPos),
					mix2([], pos, maxPos, [1, stops[stops.length - 1][1]]),
					[maxX, maxY],
				],
				{ fill: col }
			),
			...stops.map(([t], i) => {
				const xx = mix(x, maxX, t);
				return triangle(
					[
						[xx - 5, maxY],
						[xx + 5, maxY],
						[xx, maxY - 5],
					],
					{ fill: gui.fgColor(selID === i) }
				);
			})
		);
		if (sel) {
			const [cx, cy] = fit2([], sel, [0, 0], [1, 1], pos, maxPos);
			gui.add(
				line([x, cy], [maxX, cy], { stroke: gui.fgColor(true) }),
				line([cx, y], [cx, maxY], { stroke: gui.fgColor(true) })
			);
		}
	}
	gui.lastID = id;
	return res;
};

const rampVertices = (
	ramp: Ramp<number>,
	mode: number,
	pos: Vec,
	maxPos: Vec
) => [...ramp.samples(100)].map((p) => mix2([], pos, maxPos, p));
// ) => stops.map((p) => mix2([], pos, maxPos, p));

const handleRampKeys = (gui: IMGUI, ramp: Ramp<number>, selID: number) => {
	switch (gui.key) {
		case Key.TAB:
			gui.switchFocus();
			break;
		case "x":
		case Key.DELETE:
			ramp.removeStopAtIndex(selID);
			return true;
		// case Key.SPACE:
		// return true;
		default:
	}
};
