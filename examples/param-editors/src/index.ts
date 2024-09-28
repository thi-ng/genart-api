import { anchor, div } from "@thi.ng/hiccup-html";
import { $attribs, $compile } from "@thi.ng/rdom";
import { compileForm, container, selectNum, str } from "@thi.ng/rdom-forms";
import { reactive } from "@thi.ng/rstream";
import { launchEditorImgui } from "./param-editor-imgui.js";
import { launchEditorForms } from "./param-editor.js";

const app = document.getElementById("editor")!;
const iframe = <HTMLIFrameElement>document.getElementById("art");
const iframeURL = reactive(iframe.src);
const editorID = reactive(-1);
const collapse = reactive(false);

editorID.subscribe({
	async next(id) {
		if (id >= 0) {
			await root.unmount();
			requestAnimationFrame(() =>
				// prettier-ignore
				[
					launchEditorForms,
					launchEditorImgui,
				][id]()
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

collapse.subscribe({
	next(state) {
		$attribs(app, { style: { display: state ? "none" : "block" } });
	},
});

$compile(
	anchor(
		{
			href: "#",
			onclick: (e: Event) => {
				collapse.next(!collapse.deref());
				e.preventDefault();
			},
		},
		collapse.map((x) => (x ? "show" : "hide"))
	)
).mount(document.getElementById("collapse")!);

window.addEventListener("keydown", (e) => {
	switch (e.key) {
		case "Escape":
			collapse.next(true);
			break;
	}
});
