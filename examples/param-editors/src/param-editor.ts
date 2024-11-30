import { div } from "@thi.ng/hiccup-html";
import { MIME_IMAGE_COMMON } from "@thi.ng/mime";
import {
	ARGB8888,
	canvasFromPixelBuffer,
	GRAY8,
	imageFromFile,
	IntBuffer,
	intBuffer,
	intBufferFromImage,
	RGB888,
} from "@thi.ng/pixel";
import { $attribs, $compile, $refresh, $replace, $wrapEl } from "@thi.ng/rdom";
import {
	compileForm,
	container,
	custom,
	date,
	dateTime,
	file,
	group,
	num,
	range,
	selectStr,
	str,
	text,
	toggle,
	trigger,
	type FormItem,
} from "@thi.ng/rdom-forms";
import {
	merge,
	reactive,
	stream,
	sync,
	syncRAF,
	type ISubscription,
} from "@thi.ng/rstream";
import { reduce } from "@thi.ng/transducers";
import type {
	APIMessage,
	ChoiceParam,
	ImageParam,
	ParamSpecs,
	RandomizeParamMsg,
	RangeParam,
	SetParamValueMsg,
	TextParam,
	WeightedChoiceParam,
} from "../../../src/api.js";
import { canvasColorPicker } from "./color-picker.js";
import {
	apiState,
	artURL,
	formattedFrame,
	formattedTime,
	iframeParams,
	paramCache,
	params,
	paramValues,
	selfUpdate,
	sendMessage,
	traits,
} from "./state.js";
import { formatValuePrec } from "./utils.js";

// ROOT.set(new ConsoleLogger());

const createParamControls = (params: ParamSpecs) => {
	let items: FormItem[] = [];
	const ids = reduce<string, string[][]>(
		[
			() => [[], []],
			(acc) => acc,
			(acc, x) => (acc[x.startsWith("__") ? 1 : 0].push(x), acc),
		],
		Object.keys(params)
	);
	for (let id of [...ids[0], ...ids[1]]) {
		const param = params[id];
		let value: ISubscription<any, any> = reactive(
			(paramCache[id] = param.value ?? param.default)
		);
		const base = {
			id,
			label: param.name || id,
			desc:
				param.desc +
				(param.update === "reload" ? " (change forces reload)" : ""),
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
			case "color": {
				let width = window.innerWidth;
				width =
					width >= 1024
						? (width * 0.4 - 48) >> 1
						: width >= 768
						? width * 0.4 - 32
						: width - 32;
				items.push(
					canvasColorPicker({
						...base,
						attribs: {
							width,
							height: Math.min(width, 256),
							title: param.doc,
						},
					})
				);
				break;
			}
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
						div(
							".imgpreview",
							{},
							div(),
							$refresh(
								merge<Promise<IntBuffer>, Promise<IntBuffer>>({
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
								async ($img) => {
									const img = (await $img)
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
					)
				);
				break;
			}
			case "range":
				{
					const { min, max, step } = <RangeParam>param;
					items.push(
						(param.widget && param.widget !== "default"
							? num
							: range)({
							...base,
							min,
							max,
							step,
							vlabel: formatValuePrec(step ?? 1),
						})
					);
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
			if (param.state === "random") {
				items.push(
					trigger({
						label: "",
						title: "apply",
						attribs: {
							id: id + "-apply",
							title: "Click to apply the current value (randomized default)",
							onclick: () => {
								$attribs(
									document.getElementById(id + "-apply")!,
									{ style: { display: "none" } }
								);
								sendMessage<SetParamValueMsg>({
									type: "genart:setparamvalue",
									paramID: id,
									value: value.deref(),
								});
							},
						},
						readonly: true,
					})
				);
			}
			items.push(
				trigger({
					label: "",
					title: "randomize",
					attribs: {
						title: "Click to randomize this param",
						onclick: () =>
							sendMessage<RandomizeParamMsg>({
								type: "genart:randomizeparam",
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
					sendMessage<SetParamValueMsg>({
						type: "genart:setparamvalue",
						paramID: id,
						value,
					});
				}
			},
		});
	}

	const copy = reactive(false);
	items.push(
		group(
			{ label: "Info" },
			str({
				label: "URL params",
				desc: "The customized parameters encoded as URL search params...",
				attribs: { disabled: true },
				value: iframeParams,
			}),
			trigger({
				title: copy.map((x) => (x ? "Copied" : "Copy to clipboard")),
				label: "",
				attribs: {
					onclick: () => {
						const data = iframeParams.deref();
						if (data) {
							navigator.clipboard.writeText(data);
							copy.next(true);
							setTimeout(() => copy.next(false), 1000);
						}
					},
					disabled: copy,
				},
			}),
			trigger({
				title: "Open in new window",
				label: "",
				attribs: {
					onclick: () => {
						const url = new URL(artURL.deref()!);
						url.search = iframeParams.deref() || "";
						const anchor = document.createElement("a");
						anchor.href = url.toString();
						anchor.target = "_blank";
						anchor.click();
					},
				},
			}),
			text({
				label: "Artwork traits",
				desc: "Optional. Not all artworks define traits...",
				attribs: { disabled: true, rows: 10 },
				value: traits.map((x) => JSON.stringify(x, null, 2)),
			})
		),
		group(
			{ label: "Transport control" },
			trigger({
				label: "Current time",
				desc: formattedTime,
				title: "Play",
				attribs: {
					onclick: () =>
						sendMessage<APIMessage>({
							type:
								apiState.deref() === "stop"
									? "genart:resume"
									: "genart:start",
						}),
				},
			}),
			trigger({
				label: "Current frame",
				desc: formattedFrame,
				title: "Pause",
				attribs: {
					onclick: () =>
						sendMessage<APIMessage>({ type: "genart:stop" }),
				},
			})
		)
	);

	return compileForm(container({}, ...items), {
		wrapperAttribs: { class: "control" },
		descAttribs: { class: "desc" },
		typeAttribs: {
			rangeLabel: { class: "rangevalue" },
		},
	});
};

export const launchEditorForms = (url: string) => {
	artURL.next(url);
	$compile($replace(syncRAF(params).map(createParamControls))).mount(
		document.getElementById("editor")!
	);
};
