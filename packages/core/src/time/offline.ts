import type { TimeProvider } from "../api.js";

export const timeProviderOffline = (
	frameDelay = 250,
	referenceFPS = 60,
	frameOffset = 0
): TimeProvider => {
	let frame = frameOffset;
	const frameTime = 1000 / referenceFPS;
	return {
		start() {
			frame = frameOffset - 1;
		},
		next(fn) {
			setTimeout(() => {
				frame++;
				fn(frame * frameTime, frame);
			}, frameDelay);
		},
		now: () => [frame * frameTime, frame],
	};
};
