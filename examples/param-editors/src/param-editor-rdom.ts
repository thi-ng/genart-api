import type {
	APIMessage,
	BigIntParam,
	ChoiceParam,
	ImageParam,
	Param,
	ParamSpecs,
	RandomizeParamMessage,
	RangeParam,
	SetParamValueMessage,
	TextParam,
	VectorParam,
	WeightedChoiceParam,
} from "@genart-api/core";
import { compareByKey, compareNumAsc } from "@thi.ng/compare";
import { FMT_HHmm, FMT_yyyyMMdd } from "@thi.ng/date";
import { equiv } from "@thi.ng/equiv";
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
	fromTuple,
	merge,
	reactive,
	stream,
	sync,
	syncRAF,
	type ISubscription,
} from "@thi.ng/rstream";
import { capitalize } from "@thi.ng/strings";
import { groupByObj, map } from "@thi.ng/transducers";
import { canvasColorPicker } from "./color-picker.js";
import {
	apiState,
	artURL,
	formattedFrame,
	formattedTime,
	frameRate,
	iframeParams,
	paramCache,
	params,
	paramValues,
	selfUpdate,
	sendMessage,
	traits,
} from "./state.js";
import { formatValuePrec, numDigits } from "./utils.js";

// ROOT.set(new ConsoleLogger());

const createParamControls = (params: ParamSpecs) => {
	const groups = groupByObj<[string, Param<any>], [string, Param<any>][]>(
		{ key: ([_, { group }]) => group?.toLowerCase() || "main" },
		Object.entries(params)
	);
	const items: FormItem[] = [];
	for (let [groupID, groupParams] of Object.entries(groups)) {
		const groupItems: FormItem[] = [];
		for (let [id, param] of groupParams.sort(
			compareByKey((x) => x[1].order, compareNumAsc)
		)) {
			let value: ISubscription<any, any> = reactive(
				(paramCache[id] = param.value ?? param.default)
			);
			const base = {
				id,
				label: capitalize(param.name || id),
				desc:
					param.desc +
					(param.update === "reload"
						? " (change forces reload)"
						: ""),
				labelAttribs: { title: param.doc },
				attribs: { title: param.doc },
				value,
			};
			paramValues[id] = value;
			switch (param.type) {
				case "bigint":
					{
						const { min, max } = <BigIntParam>param;
						value = value.map((x) => x.toString());
						groupItems.push(
							str({
								...base,
								value,
								min: numDigits(min),
								max: numDigits(max),
								attribs: { pattern: "^[0-9]+$" },
							})
						);
						value = value.map(BigInt);
					}
					break;

				case "choice":
					{
						const $param = <ChoiceParam<any>>param;
						groupItems.push(
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
					groupItems.push(
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
						value = value.map((x) =>
							x instanceof Date
								? FMT_yyyyMMdd(x) + "T" + FMT_HHmm(x)
								: x
						);
						groupItems.push(dateTime({ ...base, value }));
						value = value.map((x) => new Date(Date.parse(x)));
					}
					break;

				case "date":
					{
						value = value.map((x) =>
							x instanceof Date ? FMT_yyyyMMdd(x) : x
						);
						groupItems.push(date({ ...base, value }));
						value = value.map((x) => new Date(Date.parse(x)));
					}
					break;

				case "image": {
					const $param = <ImageParam>param;
					const fmt = {
						gray: GRAY8,
						rgba: ARGB8888,
					}[$param.format];
					const fileSel = stream<File>();
					groupItems.push(
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
									merge<
										Promise<IntBuffer>,
										Promise<IntBuffer>
									>({
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
										return $wrapEl(
											canvasFromPixelBuffer(img)
										);
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
						groupItems.push(
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
						groupItems.push(
							$param.multiline
								? text({ ...base, rows: 5 })
								: str({
										...base,
										min: $param.minLength,
										max: $param.maxLength,
								  })
						);
					}
					break;

				case "toggle":
					groupItems.push(toggle(base));
					break;

				case "vector":
				case "xy": {
					const { size, min, max, step, labels } =
						param.type === "vector"
							? <VectorParam>param
							: {
									size: 2,
									min: [0, 0],
									max: [1, 1],
									step: [0.001, 0.001],
									labels: ["X", "Y"],
							  };
					const tuple = fromTuple<number[]>(paramCache[id]);
					value.subscribe(tuple);
					const widget =
						param.widget && param.widget !== "default"
							? num
							: range;
					for (let i = 0; i < size; i++) {
						tuple.streams[i].subscribe({
							next(x) {
								const val = tuple.deref()!.slice();
								val[i] = x;
								tuple.next(val);
								value.next(val);
							},
						});
						groupItems.push(
							widget({
								...base,
								min: min[i],
								max: max[i],
								step: step[i],
								value: tuple.streams[i],
								label: base.label + ` (${labels[i]})`,
								vlabel: formatValuePrec(step[i] ?? 1),
							})
						);
					}
					break;
				}

				case "weighted":
					{
						const $param = <WeightedChoiceParam<any>>param;
						groupItems.push(
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
			}
			if (param.randomize !== false) {
				if (param.state === "random") {
					groupItems.push(
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
									sendMessage<SetParamValueMessage>({
										type: "genart:set-param-value",
										paramID: id,
										value: value.deref(),
									});
								},
							},
							readonly: true,
						})
					);
				}
				groupItems.push(
					trigger({
						label: "",
						title: "randomize",
						attribs: {
							title: "Click to randomize this param",
							onclick: () =>
								sendMessage<RandomizeParamMessage>({
									type: "genart:randomize-param",
									paramID: id,
								}),
						},
						readonly: true,
					})
				);
			}
			value.subscribe({
				next(value) {
					if (!selfUpdate && !equiv(paramCache[id], value)) {
						paramCache[id] = value;
						sendMessage<SetParamValueMessage>({
							type: "genart:set-param-value",
							paramID: id,
							value,
						});
					}
				},
			});
		}
		items.push(group({ label: capitalize(groupID) }, ...groupItems));
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
				desc: syncRAF(
					sync({
						src: { frame: formattedFrame, fps: frameRate },
						xform: map(
							({ frame, fps }) =>
								`${frame} (${fps.toFixed(1)} fps)`
						),
					})
				),
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
		behaviors: {
			strOnInput: false,
			textOnInput: false,
		},
	});
};

export const launchEditorForms = (url: string) => {
	artURL.next(url);
	$compile($replace(syncRAF(params).map(createParamControls))).mount(
		document.getElementById("editor")!
	);
};
