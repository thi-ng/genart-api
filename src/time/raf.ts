import type { TimeProvider } from "../api.js";

export const timeProviderRAF = (
	timeOffset = 0,
	frameOffset = 0
): TimeProvider => {
	let t0 = performance.now();
	let frame = frameOffset;
	let now = timeOffset;
	return {
		start() {
			t0 = performance.now();
			frame = frameOffset;
		},
		next(fn) {
			requestAnimationFrame(fn);
		},
		now() {
			return [now, frame];
		},
		tick() {
			return [(now = timeOffset + performance.now() - t0), ++frame];
		},
	};
};
