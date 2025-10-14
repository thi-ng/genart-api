// import type { GenArtAPI } from "@genart-api/core";

// global flag to indicate recording mode
const RECORD = false;

if (RECORD) {
	// switch to non-realtime animation when recording
	$genart.setTimeProvider($genart.time.offline(200, 60));
}

// declare artwork parameters
// list of (built-in) supported param types:
// https://docs.thi.ng/genart-api/core/index.html#parameters
const param = await $genart.setParams({
	color: $genart.params.color({
		name: "Human readable name",
		desc: "Brief description",
		// if no default is provided, a random value will be used
		// default: "#ff0000",
		// group: "colors",
		// edit: "private"
		// see other common param options:
		// https://docs.thi.ng/genart-api/core/interfaces/ParamOpts.html
	}),
});

// set main animation loop, see:
// https://docs.thi.ng/genart-api/core/types/UpdateFn.html
$genart.setUpdate((time, frame) => {
	// draw something...
	console.log(time, frame);
	// set background color to current param value
	document.body.style.backgroundColor = param("color");

	if (RECORD) {
		// TODO trigger download of current frame (e.g. using thi.ng/dl-asset)
	}

	// must return true to continue anim loop
	return true;
});

export {};
