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
			frame = frameOffset;
		},
		next(fn) {
			setTimeout(fn, frameDelay);
		},
		now() {
			return [frame * frameTime, frame];
		},
		tick() {
			return [++frame * frameTime, frame];
		},
	};
};
