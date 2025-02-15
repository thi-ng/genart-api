import { anchor, div, small } from "@thi.ng/hiccup-html";
import { $attribs, $compile, $tree } from "@thi.ng/rdom";
import {
	compileForm,
	container,
	selectNum,
	str,
	trigger,
} from "@thi.ng/rdom-forms";
import { reactive } from "@thi.ng/rstream";
import { launchEditorImgui } from "./param-editor-imgui.js";
import { launchEditorForms } from "./param-editor-rdom.js";
import { reloadArt } from "./state.js";
import { MIN_API_VERSION } from "./version.js";

const urlParams = new URLSearchParams(location.search);
const initialURL = urlParams.get("url");

const app = document.getElementById("editor")!;
const iframe = <HTMLIFrameElement>document.getElementById("art");
const iframeURL = reactive(initialURL ?? "http://localhost:5173");
const editorID = reactive(-1);
const collapse = reactive(false);

if (initialURL) reloadArt(initialURL);

editorID.subscribe({
	async next(id) {
		if (id >= 0) {
			const url = iframeURL.deref()!;
			await root.unmount();
			requestAnimationFrame(() =>
				// prettier-ignore
				[
					launchEditorForms,
					launchEditorImgui,
				][id](url)
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
								reloadArt((<HTMLInputElement>e.target).value);
							},
						},
					}),
					trigger({
						label: false,
						title: "Reload",
						attribs: {
							onclick: () => {
								reloadArt(
									(<HTMLInputElement>(
										document.getElementById("url")
									)).value
								);
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

// inject API version in title
$tree(small(null, MIN_API_VERSION), document.getElementById("title")!);

$compile(
	anchor(
		{
			href: "#",
			title: "Press Esc to toggle",
			onclick: (e: Event) => {
				collapse.next(!collapse.deref());
				e.preventDefault();
			},
		},
		collapse.map((x) => (x ? "Show" : "Hide") + " overlay")
	)
).mount(document.getElementById("collapse")!);

window.addEventListener("keydown", (e) => {
	switch (e.key) {
		case "Escape":
			collapse.next(!collapse.deref());
			break;
	}
});
