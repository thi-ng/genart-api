import { select, option } from "@thi.ng/hiccup-html";
import { $clear, $compile } from "@thi.ng/rdom";
import { launchEditorForms } from "./param-editor.js";
import { launchEditorImgui } from "./param-editor-imgui.js";

const app = document.getElementById("app")!;

const loadGUI = (e: InputEvent) => {
	$clear(app);
	const id = +(<HTMLSelectElement>e.target).value;
	if (!isNaN(id)) {
		requestAnimationFrame(() =>
			[launchEditorImgui, launchEditorForms][id]()
		);
	}
};

$compile(
	select(
		{ onchange: loadGUI },
		option({}, "Choose GUI editor..."),
		option({ value: 0 }, "@thi.ng/imgui"),
		option({ value: 1 }, "@thi.ng/rdom-forms")
	)
).mount(app);
