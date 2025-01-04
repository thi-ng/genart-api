"use strict";
(() => {
  // src/index.ts
  var deque = (samples, pred, index = []) => ({
    head: () => samples[index[0]],
    push(x) {
      while (index.length && pred(samples[index[index.length - 1]], x)) {
        index.pop();
      }
      index.push(samples.length - 1);
    },
    shift() {
      if (index[0] === 0) index.shift();
      for (let i = index.length; i-- > 0; ) index[i]--;
    }
  });
  var timeProvider = ({
    targetFPS = 60,
    period = 200,
    width = period,
    height = 100,
    style = "position:fixed;z-index:9999;top:0;right:0;",
    bg = "#222",
    text = "#fff",
    fps = ["#0f0", "#ff0", "#f00", "#306"],
    fill = false
  } = {}) => {
    let canvas;
    let ctx;
    const scaleX = width / period;
    const showTickLabels = width >= 120;
    let t0 = performance.now();
    let frame = 0;
    let now = 0;
    let prev = 0;
    let samples = [];
    let min;
    let max;
    let peak = targetFPS;
    let windowSum = 0;
    let isStart = true;
    const update = () => {
      const res = [now, frame];
      let delta = now - prev;
      prev = now;
      if (delta <= 0) return res;
      const $fps = 1e3 / delta;
      let num = samples.push($fps);
      min.push($fps);
      max.push($fps);
      if (num > period) {
        num--;
        windowSum -= samples.shift();
        min.shift();
        max.shift();
      }
      windowSum += $fps;
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
      for (let step = peak > 90 ? 30 : peak > 30 ? 15 : 5, i = round(Math.min(targetFPS, peak + step / 2), step); i > 0; i -= step) {
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
        [
          [`sma(${period}):`, windowSum / period],
          ["max:", max.head()],
          ["min:", min.head()]
        ].forEach(([label, value], i) => {
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
          ctx = canvas.getContext("2d");
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
      }
    };
  };
  globalThis.timeProviderFPSOverlay = timeProvider;
})();
