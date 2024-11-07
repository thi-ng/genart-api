import type { DebugTimeProviderOpts, TimeProvider } from "../api/time.js";

export const debugTimeProvider = ({
	targetFPS = 60,
	period = 200,
	width = period,
	height = 100,
	style = "position:fixed;z-index:9999;top:0;right:0;",
	bg = "#222",
	text = "#fff",
	fps = ["#0f0", "#ff0", "#f00", "#303"],
}: Partial<DebugTimeProviderOpts> = {}): TimeProvider => {
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	const scaleX = width / period;
	const showTickLabels = width >= 120;
	let t0 = performance.now();
	let frame = 0;
	let now = 0;
	let prev = 0;
	let peak = targetFPS;
	let samples: number[] = [];
	let peakIndex: number[] = [];
	let windowSum = 0;
	let isStart = true;
	const update = () => {
		const res: [number, number] = [now, frame];
		let delta = now - prev;
		prev = now;
		if (delta <= 0) return res;
		const $fps = 1000 / delta;
		const num = samples.push($fps);
		while (
			peakIndex.length &&
			samples[peakIndex[peakIndex.length - 1]] <= $fps
		) {
			peakIndex.pop();
		}
		peakIndex.push(num - 1);
		if (num > period) {
			windowSum -= samples.shift()!;
			if (peakIndex[0] === 0) peakIndex.shift();
			for (let i = 0; i < peakIndex.length; i++) peakIndex[i]--;
		}
		windowSum += $fps;
		if (peakIndex.length) {
			const clamped = Math.min(
				Math.max(samples[peakIndex[0]], targetFPS),
				targetFPS * 1.5
			);
			peak += (clamped - peak) * 0.05;
		}
		const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
		grad.addColorStop(1 - targetFPS / peak, fps[0]);
		grad.addColorStop(1 - (targetFPS - 1) / peak, fps[1]);
		grad.addColorStop(1 - targetFPS / 2 / peak, fps[2]);
		grad.addColorStop(1, fps[3]);
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.moveTo(0, height);
		for (let i = 0; i < num; i++) {
			ctx.lineTo(i * scaleX, (1 - samples[i] / peak) * height);
		}
		ctx.lineTo((num - 1) * scaleX, height);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = text;
		ctx.beginPath();
		for (let fps of [targetFPS, targetFPS / 2]) {
			const y = (1 - fps / peak) * height;
			ctx.moveTo(0, y);
			if (showTickLabels) {
				ctx.lineTo(width - 22, y);
				ctx.fillText(String(fps), width - 20, y + 1);
			} else {
				ctx.lineTo(width, y);
			}
		}
		ctx.stroke();

		if (num >= period) {
			ctx.fillText(
				`sma(${period}) ${(windowSum / period).toFixed(1)} fps`,
				4,
				height - 8
			);
		}
		return res;
	};
	return {
		start() {
			peak = targetFPS;
			samples = [];
			peakIndex = [];
			windowSum = 0;
			if (!canvas) {
				canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				canvas.id = "#FPS";
				canvas.setAttribute("style", style);
				document.body.appendChild(canvas);
				ctx = canvas.getContext("2d")!;
				ctx.font = "10px sans-serif";
				ctx.textBaseline = "middle";
				ctx.strokeStyle = text;
				ctx.setLineDash([1, 1]);
			}
		},
		next(fn) {
			requestAnimationFrame((t) => {
				if (isStart) {
					t0 = t;
					frame = 0;
					isStart = false;
				} else {
					frame++;
				}
				now = t - t0;
				fn(now, frame);
				update();
			});
		},
		now() {
			return [now, frame];
		},
	};
};
