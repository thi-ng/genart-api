import type { TimeProvider } from "@genart-api/core";

export interface FPSOverlayOpts {
	/**
	 * @defaultValue 60
	 */
	targetFPS: number;
	/**
	 * Window size (number of frames) of recorded FPS samples and to compute the moving average frame rate
	 *
	 * @defaultValue 200
	 */
	period: number;
	/**
	 * Canvas width in pixels
	 *
	 * @defaultValue same as {@link DebugTimeProviderOpts.period}
	 */
	width: number;
	/**
	 * Canvas width in pixels
	 *
	 * @defaultValue 100
	 */
	height: number;
	/**
	 * Custom CSS to attach to canvas element.
	 *
	 * @remarks
	 * By default the canvas is positioned in the top-right corner.
	 */
	style: string;
	/**
	 * Background color
	 *
	 * @defaultValue `#222`
	 */
	bg: string;
	/**
	 * Tuple of color values for the area plot gradient, in the following order:
	 *
	 * - target framerate
	 * - target framerate - 1
	 * - half target framerate
	 * - zero
	 *
	 * @defaultValue `["#0f0", "#ff0", "#f00", "#300"]`
	 */
	fps: [string, string, string, string];
	/**
	 * Text color
	 *
	 * @defaultValue `#fff`
	 */
	text: string;
	/**
	 * If true, visualization uses area plot, else line plot.
	 *
	 * @defaultValue true
	 */
	fill: boolean;
}

/**
 * Deque data structure to keep track of moving min/max values.
 *
 * @internal
 */
const deque = (
	samples: number[],
	pred: (a: number, b: number) => boolean,
	index: number[] = []
) => ({
	head: () => samples[index[0]],
	push(x: number) {
		while (index.length && pred(samples[index[index.length - 1]], x)) {
			index.pop();
		}
		index.push(samples.length - 1);
	},
	shift() {
		if (index[0] === 0) index.shift();
		for (let i = index.length; i-- > 0; ) index[i]--;
	},
});

/**
 * Returns a new
 * [`TimeProvider`](https://docs.thi.ng/genart-api/core/interfaces/TimeProvider.html)
 * for development purposes, which collects FPS samples and injects a canvas
 * overlay to visualize recent frame rates and compute moving averages.
 * Visualization can be configured via provided options.
 *
 * @param opts
 */
export const timeProvider = ({
	targetFPS = 60,
	period = 200,
	width = period,
	height = 100,
	style = "position:fixed;z-index:9999;top:0;right:0;",
	bg = "#222",
	text = "#fff",
	fps = ["#0f0", "#ff0", "#f00", "#306"],
	fill = false,
}: Partial<FPSOverlayOpts> = {}): TimeProvider => {
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	const scaleX = width / period;
	const showTickLabels = width >= 120;
	let t0 = performance.now();
	let frame = 0;
	let now = 0;
	let prev = 0;
	let samples: number[] = [];
	let min: ReturnType<typeof deque>;
	let max: ReturnType<typeof deque>;
	let peak = targetFPS;
	let windowSum = 0;
	let isStart = true;
	const update = () => {
		const res: [number, number] = [now, frame];
		let delta = now - prev;
		prev = now;
		if (delta <= 0) return res;
		const $fps = 1000 / delta;
		let num = samples.push($fps);
		min.push($fps);
		max.push($fps);
		if (num > period) {
			num--;
			windowSum -= samples.shift()!;
			min.shift();
			max.shift();
		}
		windowSum += $fps;
		// smoothly interpolate peak value
		const { clamp01, round } = $genart.math;
		peak += (max.head() * 1.1 - peak) * 0.1;

		const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
		grad.addColorStop(clamp01(1 - targetFPS / peak), fps[0]);
		grad.addColorStop(clamp01(1 - (targetFPS - 1) / peak), fps[1]);
		grad.addColorStop(clamp01(1 - targetFPS / 2 / peak), fps[2]);
		grad.addColorStop(1, fps[3]);

		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, width, height);

		ctx[fill ? "fillStyle" : "strokeStyle"] = grad;
		ctx.setLineDash([]);
		ctx.beginPath();
		ctx.moveTo(-1, height);
		for (let i = 0; i < num; i++) {
			ctx.lineTo(i * scaleX, (1 - samples[i] / peak) * height);
		}
		if (fill) {
			ctx.lineTo((num - 1) * scaleX, height);
			ctx.closePath();
			ctx.fill();
		} else {
			ctx.stroke();
		}

		ctx.fillStyle = ctx.strokeStyle = text;
		ctx.setLineDash([1, 1]);
		ctx.beginPath();
		for (
			let step = peak > 90 ? 30 : peak > 30 ? 15 : 5,
				i = round(Math.min(targetFPS, peak + step / 2), step);
			i > 0;
			i -= step
		) {
			const y = (1 - i / peak) * height;
			ctx.moveTo(width - 80, y);
			if (showTickLabels) {
				ctx.lineTo(width - 22, y);
				ctx.fillText(String(i), width - 20, y + 1);
			} else {
				ctx.lineTo(width, y);
			}
		}
		ctx.stroke();

		if (num >= period) {
			(<[string, number][]>[
				[`sma(${period}):`, windowSum / period],
				["max:", max.head()],
				["min:", min.head()],
			]).forEach(([label, value], i) => {
				const y = height - 8 - i * 12;
				ctx.fillText(label, 4, y);
				ctx.fillText(value.toFixed(1) + " fps", 64, y);
			});
		}
		return res;
	};
	return {
		start() {
			samples = [];
			min = deque(samples, (a, b) => a >= b);
			max = deque(samples, (a, b) => a <= b);
			peak = targetFPS * 1.2;
			windowSum = 0;
			if (!canvas) {
				canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				canvas.id = "#FPS";
				canvas.setAttribute("style", style);
				document.body.appendChild(canvas);
				ctx = canvas.getContext("2d")!;
				ctx.font = "12px sans-serif";
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

// @ts-ignore
globalThis.timeProviderFPSOverlay = timeProvider;

declare global {
	/**
	 * Globally exposed {@link timeProvider} with FPS overlay.
	 */
	var timeProviderFPSOverlay: typeof timeProvider;
}
