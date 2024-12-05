import type { TimeProvider } from "../api.js";

export const timeProviderRAF = (
	timeOffset = 0,
	frameOffset = 0
): TimeProvider => {
	let t0 = performance.now();
	let frame = frameOffset;
	let now = timeOffset;
	let isStart = true;
	return {
		start() {
			isStart = true;
		},
		next(fn) {
			requestAnimationFrame((t) => {
				if (isStart) {
					t0 = t;
					frame = frameOffset;
					isStart = false;
				} else {
					frame++;
				}
				now = timeOffset + t - t0;
				fn(now, frame);
			});
		},
		now: () => [now, frame],
	};
};
