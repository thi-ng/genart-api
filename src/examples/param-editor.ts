import { $compile, $replace } from "@thi.ng/rdom";
import {
	color,
	compileForm,
	container,
	group,
	range,
	selectStr,
	str,
	text,
	toggle,
	trigger,
	type FormItem,
} from "@thi.ng/rdom-forms";
import { reactive, stream, sync, syncRAF, type Stream } from "@thi.ng/rstream";
import type { ChoiceParam, ParamSpecs, RangeParam, TextParam } from "../api.js";

const iframe = (<HTMLIFrameElement>document.getElementById("art"))
	.contentWindow!;

const features = reactive({});
const controls = stream<ParamSpecs>();
const iframeParams = reactive(iframe.location.search, { closeOut: "never" });

const paramCache: Record<string, any> = {};
const paramValues: Record<string, Stream<any>> = {};

const unsupportedRND = ["text", "ramp", "weighted"];

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
		const value = reactive((paramCache[id] = param.value ?? param.default));
		const base = {
			label: param.name || id,
			desc: param.doc,
			labelAttribs: { title: param.tooltip },
			attribs: { title: param.tooltip },
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
			case "xy":
				{
					const x = reactive(value.deref()![0]);
					const y = reactive(value.deref()![1]);
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
							step: 0.01,
							value: x,
						}),
						range({
							...base,
							label: base.label + " (y)",
							min: 0,
							max: 1,
							step: 0.01,
							value: y,
						})
					);
				}
				break;
		}
		if (!unsupportedRND.includes(param.type)) {
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

$compile($replace(syncRAF(controls).map(createParamControls))).mount(
	document.getElementById("app")!
);
