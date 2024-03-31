import type { TimeProvider } from "../api.js";

export const timeProviderRAF = (
	timeOffset = 0,
	frameOffset = 0
): TimeProvider => {
	let t0 = performance.now();
	let frame = frameOffset;
	return {
		start(fn) {
			t0 = performance.now();
			frame = frameOffset;
			fn(timeOffset, frameOffset);
		},
		next(fn) {
			requestAnimationFrame(fn);
		},
		tick() {
			return [timeOffset + performance.now() - t0, ++frame];
		},
	};
};
