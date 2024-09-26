import { ConsoleLogger, ROOT } from "@thi.ng/logger";
import { MIME_IMAGE_COMMON } from "@thi.ng/mime";
import {
	canvasFromPixelBuffer,
	intBufferFromImage,
	imageFromFile,
	intBuffer,
	GRAY8,
	RGB888,
	ARGB8888,
} from "@thi.ng/pixel";
import { $compile, $refresh, $replace, $wrapEl } from "@thi.ng/rdom";
import {
	color,
	compileForm,
	container,
	custom,
	date,
	dateTime,
	file,
	group,
	range,
	selectStr,
	str,
	text,
	toggle,
	trigger,
	type FormItem,
} from "@thi.ng/rdom-forms";
import {
	fromPromise,
	merge,
	reactive,
	stream,
	sync,
	syncRAF,
	type ISubscription,
} from "@thi.ng/rstream";
import type {
	ChoiceParam,
	ImageParam,
	ParamSpecs,
	RangeParam,
	TextParam,
	WeightedChoiceParam,
} from "../../../src/api.js";

// ROOT.set(new ConsoleLogger());

const iframe = (<HTMLIFrameElement>document.getElementById("art"))
	.contentWindow!;

const features = reactive({});
const controls = stream<ParamSpecs>();
const iframeParams = reactive(iframe.location.search, { closeOut: "never" });

const paramCache: Record<string, any> = {};
const paramValues: Record<string, ISubscription<any, any>> = {};

let apiID: string;
let selfUpdate = false;

window.addEventListener("message", (e) => {
	switch (e.data.type) {
		case "genart:setfeatures":
			apiID = e.data.apiID;
			features.next(e.data.features);
			break;
		case "genart:setparams":
			if (Object.keys(e.data.params).length) controls.next(e.data.params);
			break;
		case "genart:paramchange":
			selfUpdate = true;
			paramValues[e.data.paramID]?.next(e.data.spec.value);
			selfUpdate = false;
			break;
		case "paramadapter:update":
			iframeParams.next(e.data.params);
			break;
	}
});

const createParamControls = (params: ParamSpecs) => {
	let items: FormItem[] = [];
	for (let id in params) {
		const param = params[id];
		let value: ISubscription<any, any> = reactive(
			(paramCache[id] = param.value ?? param.default)
		);
		const base = {
			id,
			label: param.name || id,
			desc: param.desc,
			labelAttribs: { title: param.doc },
			attribs: { title: param.doc },
			value,
		};
		paramValues[id] = value;
		switch (param.type) {
			case "choice":
				{
					const $param = <ChoiceParam<any>>param;
					items.push(
						selectStr({
							...base,
							items: $param.options.map((x) =>
								Array.isArray(x)
									? { value: x[0], label: x[1] }
									: x
							),
						})
					);
				}
				break;
			case "color":
				items.push(color(base));
				break;
			case "datetime":
				{
					value = value.map((x) => {
						x = x instanceof Date ? x.toISOString() : x;
						return x.replace(/(\.\d{3})?(Z|[-+]\d{2}:\d{2})$/, "");
					});
					items.push(dateTime({ ...base, value }));
					value = value.map((x) => x + ":00Z");
				}
				break;
			case "date":
				{
					value = value.map((x) => {
						x = x instanceof Date ? x.toISOString() : x;
						return x.substring(0, 10);
					});
					items.push(date({ ...base, value }));
				}
				break;
			case "img": {
				const $param = <ImageParam>param;
				const fmt = {
					gray: GRAY8,
					rgb: RGB888,
					rgba: ARGB8888,
				}[$param.format];
				const fileSel = stream<File>();
				items.push(
					file({
						...base,
						accept: MIME_IMAGE_COMMON,
						value: fileSel,
					}),
					custom(
						$refresh(
							merge({
								src: [
									fileSel.map(async (f) =>
										intBufferFromImage(
											await imageFromFile(f)
										)
									),
									reactive(
										Promise.resolve(
											intBuffer(
												$param.width,
												$param.height,
												fmt,
												<any>$param.value
											)
										),
										{ closeIn: "first" }
									),
								],
							}),
							async (img) => {
								img = (await img)
									.as(fmt)
									.resize(
										$param.width,
										$param.height,
										"cubic"
									);
								value.next(img.data.slice());
								return $wrapEl(canvasFromPixelBuffer(img));
							}
						)
					)
				);
				break;
			}
			case "range":
				{
					const { min, max, step } = <RangeParam>param;
					items.push(range({ ...base, min, max, step }));
				}
				break;
			case "text":
				{
					const $param = <TextParam>param;
					items.push(
						$param.multiline
							? text({ ...base, rows: 5 })
							: str({
									...base,
									min: $param.min,
									max: $param.max,
							  })
					);
				}
				break;
			case "toggle":
				items.push(toggle(base));
				break;
			case "weighted":
				{
					const $param = <WeightedChoiceParam<any>>param;
					items.push(
						selectStr({
							...base,
							items: $param.options.map((x) => ({
								value: x[1],
								label: x[2] || `${x[1]} (${x[0]})`,
							})),
						})
					);
				}
				break;
			case "xy":
				{
					const x = reactive(value.deref()![0]);
					const y = reactive(value.deref()![1]);
					value.subscribe({
						next(xy) {
							if (x.deref() !== xy[0]) x.next(xy[0]);
							if (y.deref() !== xy[1]) y.next(xy[1]);
						},
					});
					sync({ src: { x, y } }).subscribe({
						next({ x, y }) {
							value.next([x, y]);
						},
					});
					items.push(
						range({
							...base,
							label: base.label + " (x)",
							min: 0,
							max: 1,
							step: 0.001,
							value: x,
							vlabel: 3,
						}),
						range({
							...base,
							label: base.label + " (y)",
							min: 0,
							max: 1,
							step: 0.001,
							value: y,
							vlabel: 3,
						})
					);
				}
				break;
		}
		if (param.randomize !== false) {
			items.push(
				trigger({
					label: "",
					title: "randomize",
					attribs: {
						title: "Click to randomize this param",
						onclick: () =>
							iframe.postMessage({
								type: "genart:randomizeparam",
								apiID,
								paramID: id,
							}),
					},
					readonly: true,
				})
			);
		}
		value.subscribe({
			next(value) {
				if (!selfUpdate && paramCache[id] !== value) {
					paramCache[id] = value;
					iframe.postMessage({
						type: "genart:setparamvalue",
						apiID,
						paramID: id,
						value,
					});
				}
			},
		});
	}

	items = [group({ label: "Exposed parameters" }, ...items)];

	items.push(
		group(
			{ label: "Info" },
			str({
				label: "URL params",
				attribs: { disabled: true },
				value: iframeParams,
			}),
			text({
				label: "Features",
				attribs: { disabled: true, rows: 10 },
				value: features.map((x) => JSON.stringify(x, null, 2)),
			})
		)
	);

	return compileForm(container({}, ...items), {
		wrapperAttribs: { class: "control" },
		descAttribs: { class: "desc" },
		typeAttribs: {
			rangeLabel: { class: "value" },
		},
	});
};

export const launchEditorForms = () =>
	$compile($replace(syncRAF(controls).map(createParamControls))).mount(
		document.getElementById("app")!
	);
