import { select, option, div, label, inputText } from "@thi.ng/hiccup-html";
import { $clear, $compile } from "@thi.ng/rdom";
import { launchEditorForms } from "./param-editor.js";
import { launchEditorImgui } from "./param-editor-imgui.js";
import {
	compileForm,
	container,
	selectNum,
	selectStr,
	str,
	text,
} from "@thi.ng/rdom-forms";
import { reactive, stream } from "@thi.ng/rstream";

const app = document.getElementById("app")!;
const iframe = <HTMLIFrameElement>document.getElementById("art");
const iframeURL = reactive(iframe.src);
const editorID = reactive(-1);

editorID.subscribe({
	async next(id) {
		if (id >= 0) {
			await root.unmount();
			requestAnimationFrame(() =>
				[launchEditorForms, launchEditorImgui][id]()
			);
		}
	},
});

const root = $compile(
	div(
		{},
		div(
			"#intro",
			{},
			compileForm(
				container(
					{},
					str({
						id: "url",
						label: "Art URL",
						value: iframeURL,
						attribs: {
							onchange: (e) => {
								iframe.src = (<HTMLInputElement>e.target).value;
							},
						},
					}),
					selectNum({
						label: "Editor",
						items: [
							{ value: -1, label: "Choose GUI..." },
							{ value: 0, label: "@thi.ng/rdom-forms" },
							{ value: 1, label: "@thi.ng/imgui" },
						],
						value: editorID,
					})
				),
				{
					wrapperAttribs: { class: "control" },
				}
			)
		)
	)
);

root.mount(app);
