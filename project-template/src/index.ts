// import type { GenArtAPI } from "@thi.ng/genart-api";

$genart.setParams({
	color: $genart.params.color({
		name: "Human readable name",
		desc: "Brief description",
		default: "#ff0000",
	}),
});

$genart.setUpdate((time, frame) => {
	// draw something...
	console.log(time, frame);

	// must return true to continue anim loop
	return true;
});
