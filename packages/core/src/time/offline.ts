import type { TimeProvider } from "../api.js";

export const timeProviderOffline = (
	frameDelay = 250,
	referenceFPS = 60,
	frameOffset = 0
): TimeProvider => {
	let frame = frameOffset;
	const frameTime = 1000 / referenceFPS;
	let isActive = false;
	return {
		start() {
			frame = frameOffset - 1;
			isActive = true;
		},
		stop() {
			isActive = false;
		},
		next(fn) {
			setTimeout(() => {
				frame++;
				isActive && fn(frame * frameTime, frame);
			}, frameDelay);
		},
		now: () => [frame * frameTime, frame],
	};
};
