import type { TimeProvider } from "../api.js";

export const timeProviderOffline = (
	frameDelay = 250,
	referenceFPS = 60,
	frameOffset = 0
): TimeProvider => {
	let frame = frameOffset;
	const frameTime = 1000 / referenceFPS;
	return {
		start(fn) {
			frame = frameOffset;
			fn(frame, frameOffset);
		},
		next(fn) {
			setTimeout(fn, frameDelay);
		},
		tick() {
			return [++frame * frameTime, frame];
		},
	};
};
