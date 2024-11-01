import type { DebugTimeProviderOpts, TimeProvider } from "../api/time.js";

export const debugTimeProvider = ({
	targetFPS = 60,
	history = 200,
	width = history,
	height = 100,
	sma = targetFPS,
	style = "position:fixed;z-index:9999;top:0;right:0;",
	bg = "#222",
	text = "#fff",
	fps = ["#0f0", "#ff0", "#f00", "#303"],
}: Partial<DebugTimeProviderOpts> = {}): TimeProvider => {
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	const scaleX = width / history;
	const showTickLabels = width >= 120;
	let t0 = performance.now();
	let frame = 0;
	let now = 0;
	let prev = 0;
	let peak = targetFPS;
	const samples: number[] = [];
	return {
		start() {
			t0 = performance.now();
			frame = 0;
			prev = 0;
			peak = targetFPS;
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
			requestAnimationFrame(fn);
		},
		now() {
			return [now, frame];
		},
		tick() {
			const res: [number, number] = [
				(now = performance.now() - t0),
				++frame,
			];
			if (samples.length === history) samples.shift();
			let delta = now - prev;
			prev = now;
			samples.push(1000 / delta);
			const num = samples.length;
			peak = Math.max(
				targetFPS,
				peak + (Math.max(...samples) - peak) * 0.05
			);
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

			if (num >= sma) {
				let sum = 0;
				for (let i = num - sma; i < num; i++) sum += samples[i];
				sum /= sma;
				ctx.fillText(
					`sma(${sma}) ${sum.toFixed(1)} fps`,
					4,
					height - 20
				);
			}
			if (num >= history) {
				let sum = 0;
				for (let i = 0; i < num; i++) sum += samples[i];
				sum /= num;
				ctx.fillText(
					`sma(${num}) ${sum.toFixed(1)} fps`,
					4,
					height - 8
				);
			}
			return res;
		},
	};
};
