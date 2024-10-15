// import type { GenArtAPI } from "@thi.ng/genart-api";

const param = await $genart.setParams({
	color: $genart.params.color({
		name: "Human readable name",
		desc: "Brief description",
		// if no default is provided, a random value will be used
		// default: "#ff0000",
	}),
});

$genart.setUpdate((time, frame) => {
	// draw something...
	console.log(time, frame);
	// set background color to current param value
	document.body.style.backgroundColor = param("color");

	// must return true to continue anim loop
	return true;
});

export {};
