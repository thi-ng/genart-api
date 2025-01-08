import type {
	BigIntParam,
	ChoiceParam,
	Maybe,
	NestedParam,
	NestedParamSpecs,
	Param,
	RampParam,
	RandomizeParamMessage,
	RangeParam,
	SetParamValueMessage,
	TextParam,
	VectorParam,
	WeightedChoiceParam,
} from "@genart-api/core";
import { adaptiveCanvas2d } from "@thi.ng/canvas";
import { isInRange, isString } from "@thi.ng/checks";
import { DEFAULT, defmulti } from "@thi.ng/defmulti";
import { equiv } from "@thi.ng/equiv";
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
import { GridLayout, gridLayout } from "@thi.ng/layout";
import { EASING_N, HERMITE_N, LINEAR_N, ramp } from "@thi.ng/ramp";
import { partition, range } from "@thi.ng/transducers";
import {
	params,
	selfUpdate,
	sendMessage,
	updateParamsOnChange,
} from "./state.js";
import { formatValuePrec, numDigits } from "./utils.js";

const DPR = window.devicePixelRatio;
const APP = document.getElementById("editor")!;
const W = APP.getBoundingClientRect().width;
const H = 1500;
const COLS = 3;

let gui: Maybe<IMGUI>;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const EXPONENTIAL_N = EASING_N();

interface WidgetContext {
	layout: GridLayout;
	root?: { param: Param<any>; id: string };
	changedID?: string;
	changedKey?: string;
	changedValue?: any;
	widgetID: string;
	label: string;
	value: any;
	isDrawing: boolean;
}

const DAYS = [...range(1, 32)].map(String);
// prettier-ignore
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029"];

const paramWidget = defmulti<WidgetContext, NestedParam, string, any>(
	(_, param) => param.type,
	{},
	{
		[DEFAULT]: (ctx: WidgetContext, param: NestedParam, id: string) => {
			if (param.__params) {
				const root = ctx.root;
				if (!root) {
					ctx.root = { param, id };
				}
				createWidgets(param.__params, ctx);
				ctx.layout.next([COLS, 1]);
				ctx.root = root;
			} else {
				textLabel(
					gui!,
					ctx.layout.next([COLS, 1]),
					"(param type not yet supported, try other GUI)"
				);
			}
		},

		bigint: (ctx, param) => {
			const { min, max } = <BigIntParam>param;
			const minLength = numDigits(min);
			const maxLength = numDigits(max);
			const res = textField({
				gui: gui!,
				layout: ctx.layout.next([COLS, 1]),
				id: ctx.widgetID,
				value: ctx.value.toString(),
				info: param.doc,
				filter: (x) => x >= "0" && x <= "9",
			});
			return res && isInRange(minLength, maxLength, res.length)
				? BigInt(res)
				: undefined;
		},

		choice: (ctx, param) => {
			const $param = <ChoiceParam<any>>param;
			const idx = dropdown({
				gui: gui!,
				layout: ctx.layout.nest(1, [COLS - 1, 1], 0),
				id: ctx.widgetID,
				label: ctx.label,
				value: $param.options.findIndex(
					(x) => (isString(x) ? x : x[0]) === ctx.value
				),
				items: $param.options.map((x) => (isString(x) ? x : x[1])),
				info: param.doc,
			});
			if (idx != null) {
				let res = $param.options[idx];
				if (!isString(res)) res = res[0];
				return res;
			}
		},

		color: (ctx, param) => {
			const num = parseInt(ctx.value.substring(1), 16);
			const rgb = [num >> 16, (num >> 8) & 0xff, num & 0xff];
			const info =
				param.desc +
				(param.update === "reload" ? " (change forces reload) " : "");
			const edit = sliderHGroup({
				gui: gui!,
				layout: ctx.layout,
				id: ctx.widgetID,
				min: 0,
				max: 255,
				step: 1,
				horizontal: true,
				value: rgb,
				label: ["R", "G", "B"],
				info: [info, info, info],
			});
			ctx.layout.next([COLS - 1, 1]);
			if (edit) {
				rgb[edit[0]] = edit[1];
				return U24((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]);
			}
		},

		date: (ctx, param) => {
			const date = <Date>ctx.value;
			let idx = dropdown({
				gui: gui!,
				layout: ctx.layout.nest(1, undefined, 0),
				id: ctx.widgetID + "year",
				value: date.getFullYear() - 2024,
				items: YEARS,
				label: "Year",
				info: param.doc,
			});
			let res: any;
			if (idx != null) {
				res = new Date(
					Date.UTC(idx + 2024, date.getMonth(), date.getDate())
				);
			}
			idx = dropdown({
				gui: gui!,
				layout: ctx.layout.nest(1, undefined, 0),
				id: ctx.widgetID + "month",
				value: date.getMonth(),
				items: MONTHS,
				label: "Month",
				info: param.doc,
			});
			if (idx != null) {
				res = new Date(
					Date.UTC(date.getFullYear(), idx, date.getDate())
				);
			}
			idx = dropdown({
				gui: gui!,
				layout: ctx.layout.nest(1, undefined, 0),
				id: ctx.widgetID + "day",
				value: date.getDate() - 1,
				items: DAYS,
				label: "Day",
				info: param.doc,
			});
			if (idx != null) {
				res = new Date(
					Date.UTC(date.getFullYear(), date.getMonth(), idx + 1)
				);
			}
			return res;
		},

		ramp: (ctx, param) => {
			const $param = <RampParam>param;
			const modes = ["linear", "smooth", "exp"];
			let modeID = modes.indexOf($param.mode || "linear");
			const $res = rampWidget({
				gui: gui!,
				layout: ctx.layout.next([COLS, 5]),
				id: ctx.widgetID,
				ramp: ramp([LINEAR_N, HERMITE_N, EXPONENTIAL_N][modeID], <
					[number, number][]
				>[...partition(2, $param.stops)]),
				mode: modeID,
				info: param.doc,
			});
			let res: any;
			if ($res) {
				res = $res.stops.flat();
				ctx.changedKey = "stops";
			}
			const mode = dropdown({
				gui: gui!,
				layout: ctx.layout.nest(1, [COLS, 1], 0),
				id: ctx.widgetID + "-mode",
				value: modeID,
				items: modes,
				label: "Ramp mode",
			});
			if (mode != null) {
				res = modes[mode];
				ctx.changedKey = "mode";
			}
			return res;
		},

		range: (ctx, param) => {
			const { min, max, step = 1 } = <RangeParam>param;
			return sliderH({
				gui: gui!,
				layout: ctx.layout.next([COLS - 1, 1]),
				id: ctx.widgetID,
				min,
				max,
				step,
				value: ctx.value,
				label: ctx.label,
				info: param.doc,
				fmt: formatValuePrec(step),
			});
		},

		text: (ctx, param) => {
			const { minLength, maxLength, match } = <TextParam>param;
			const $match = isString(match) ? new RegExp(match) : match;
			return textField({
				gui: gui!,
				layout: ctx.layout.next([COLS, 1]),
				id: ctx.widgetID,
				value: ctx.value,
				info: param.doc,
				filter: (x) =>
					isInRange(x.length, minLength, maxLength) &&
					($match ? $match.test(x) : true),
			});
		},

		toggle: (ctx, param) => {
			return toggle({
				gui: gui!,
				layout: ctx.layout.next([COLS - 1, 1]),
				id: ctx.widgetID,
				value: ctx.value,
				label: ctx.label,
				info: param.doc,
			});
		},

		vector: (ctx, param) => {
			const { size, min, max, step, labels } = <VectorParam>param;
			const info =
				param.desc +
				(param.update === "reload" ? " (change forces reload) " : "");
			const layout = ctx.layout.nest(1, [COLS - 1, size]);
			let edited = false;
			const value = [...ctx.value];
			for (let i = 0; i < size; i++) {
				const res = sliderH({
					gui: gui!,
					layout,
					id: ctx.widgetID + i,
					value: value[i],
					min: min[i],
					max: max[i],
					step: step[i],
					label: labels[i],
					info,
					fmt: formatValuePrec(step[i]),
				});
				if (res != null) {
					value[i] = res;
					edited = true;
				}
			}
			return edited ? value : undefined;
		},

		weighted: (ctx, param) => {
			const $param = <WeightedChoiceParam<any>>param;
			const idx = dropdown({
				gui: gui!,
				layout: ctx.layout.nest(1, [COLS - 1, 1], 0),
				id: ctx.widgetID,
				label: ctx.label,
				value: $param.options.findIndex((x) => x[1] === ctx.value),
				items: $param.options.map((x) => x[2] || `${x[1]} (${x[0]})`),
				info: param.doc,
			});
			if (idx != null) {
				return $param.options[idx][1];
			}
		},

		xy: (ctx, param) => {
			return xyPad({
				gui: gui!,
				layout: ctx.layout,
				id: ctx.widgetID,
				min: [0, 0],
				max: [1, 1],
				step: 0.001,
				value: ctx.value,
				mode: "square",
				label: ctx.label,
				info: param.doc,
				fmt: ([x, y]) => `${x.toFixed(3)}, ${y.toFixed(3)}`,
			});
		},
	}
);

const createWidgets = (params: NestedParamSpecs, ctx: WidgetContext) => {
	for (let id in params) {
		const param = params[id];
		ctx.widgetID = ctx.root ? ctx.root.id + "-" + id : id;
		ctx.label = param.name || id;
		ctx.value = ctx.root
			? (<any>ctx.root.param)[id]
			: param.value ?? param.default;
		const root = ctx.root;
		textLabel(gui!, ctx.layout.next([COLS, 1]), param.desc ?? "");
		const res = paramWidget(ctx, param, id);
		const key =
			res != null && ctx.changedKey
				? ctx.changedKey
				: ctx.root
				? id
				: undefined;
		const paramID = ctx.root?.id || id;
		if (param.randomize !== false) {
			const rnd = buttonH({
				gui: gui!,
				layout: ctx.layout,
				id: ctx.widgetID + "-rnd",
				label: "Randomize",
			});
			if (!ctx.isDrawing && rnd) {
				sendMessage<RandomizeParamMessage>({
					type: "genart:randomize-param",
					paramID,
					key,
				});
			}
		}
		if (!ctx.isDrawing && res != null) {
			ctx.changedID = paramID;
			ctx.changedKey = key;
			ctx.changedValue = res;
		}
		ctx.root = root;
	}
};

const updateWidgets = (draw: boolean) => {
	const ctx = <WidgetContext>{
		layout: gridLayout(1, 1, W - 2, COLS, 20, 4),
		isDrawing: draw,
	};
	gui!.begin(draw);
	createWidgets(params.deref()!, ctx);
	gui!.end();
	if (ctx.changedID && !selfUpdate) {
		emitChange(ctx.changedID, ctx.changedValue, ctx.changedKey);
	}
};

const updateGUI = () => {
	updateWidgets(false);
	let activeID = gui!.hotID;
	updateWidgets(true);
	draw(ctx!, ["g", { __clear: true, scale: DPR }, gui]);
	return activeID;
};

const emitChange = (id: string, value: any, key?: string) => {
	console.log("emit", id, value, key);
	if (!equiv(params.deref()![id].value, value)) {
		sendMessage<SetParamValueMessage>({
			type: "genart:set-param-value",
			paramID: id,
			value,
			key,
		});
	} else {
		console.log("no change...");
	}
};

export const launchEditorImgui = () => {
	({ canvas, ctx } = adaptiveCanvas2d(W, H, APP));
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

	updateParamsOnChange(true);
	params.subscribe({ next: updateGUI });

	updateGUI();
};
