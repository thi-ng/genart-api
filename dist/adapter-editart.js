"use strict";
(() => {
  // src/index.ts
  globalThis.drawArt = () => {
  };
  var MAX_PARAMS = 5;
  var SUPPORTED_TYPES = ["choice", "range", "toggle", "weighted"];
  var {
    math: { clamp, round, fit, mix },
    prng: { sfc32 },
    utils: { isString }
  } = $genart;
  var EditArtAdapter = class {
    paramIndex = {};
    searchParams;
    cache = {};
    _prng;
    _screen;
    constructor() {
      this.searchParams = new URLSearchParams(location.search);
      this._screen = this.screen;
      this.initPRNG();
      $genart.on("genart:param-change", ({ paramID, param }) => {
        const index = this.paramIndex[paramID];
        if (index == null) return;
        const value = this.serializeParam(param);
        if (value == null || this.cache[paramID] === value) return;
        this.cache[paramID] = value;
        this.searchParams.set("m" + index, value);
        this.reload();
      });
      $genart.on("genart:state-change", ({ state }) => {
        if (state === "ready") $genart.start();
      });
      window.addEventListener("message", (e) => {
        var data = e.data;
        if (data.hasOwnProperty("editartQueryString")) {
          this.searchParams = new URLSearchParams(
            data["editartQueryString"]
          );
          this.reload();
        }
      });
      window.addEventListener("resize", () => {
        const { width, height, dpr } = this._screen;
        const newScreen = this.screen;
        if (width !== newScreen.width || height !== newScreen.height || dpr !== newScreen.dpr) {
          this._screen = newScreen;
          $genart.emit({
            type: "genart:resize",
            screen: newScreen
          });
        }
      });
    }
    get id() {
      return "@genart-api/adapter-editart";
    }
    get mode() {
      return "play";
    }
    get screen() {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1
      };
    }
    get prng() {
      return this._prng;
    }
    async updateParam(id, param) {
      const index = this.paramIndex[id];
      if (index == null) {
        if (!SUPPORTED_TYPES.includes(param.type)) {
          console.warn(
            `${this.id}: ignoring unsupported param: ${id} (type: ${param.type})`
          );
        }
        return;
      }
      const paramVal = this.searchParams.get("m" + index);
      if (paramVal == null || this.cache[id] === paramVal) return;
      this.cache[id] = paramVal;
      const value = clamp(+paramVal, 0, 0.999999);
      switch (param.type) {
        case "choice": {
          const options = param.options;
          const selected = options[value * options.length | 0];
          return { value: isString(selected) ? selected : selected[0] };
        }
        case "range": {
          const { min, max, step } = param;
          return {
            value: clamp(round(mix(min, max, value), step), min, max)
          };
        }
        case "toggle":
          return { value: value >= 0.5 };
        case "weighted": {
          const options = param.options;
          return {
            value: options[value * options.length | 0][1]
          };
        }
      }
    }
    async initParams(params) {
      const filtered = Object.entries(params).filter(
        ([_, param]) => param.edit !== "private" && SUPPORTED_TYPES.includes(param.type)
      ).sort((a, b) => {
        const ao = a[1].order;
        const bo = b[1].order;
        if (ao === bo) return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
        return ao - bo;
      });
      let num = filtered.length;
      if (num > MAX_PARAMS) {
        console.warn(
          `${this.id}: found ${num} eligible params, but platform only supports max. ${MAX_PARAMS} params`
        );
        console.warn(
          "using these params only (in order):",
          filtered.map((x) => x[0])
        );
      }
      num = Math.min(MAX_PARAMS, num);
      for (let i = 0; i < num; i++) {
        this.paramIndex[filtered[i][0]] = i;
      }
    }
    capture(_) {
      triggerPreview();
    }
    reload() {
      console.log(
        `${this.id} reloading with new params:`,
        this.searchParams.toString()
      );
      location.search = this.searchParams.toString();
    }
    initPRNG() {
      let seedStr = randomSeedEditArt;
      for (let i = 0; i < MAX_PARAMS; i++) {
        seedStr += this.searchParams.get("m" + i) || "0.5";
      }
      const seed = cyrb128(seedStr);
      const reset = () => sfc32(seed);
      this._prng = {
        seed: seedStr,
        rnd: reset(),
        reset
      };
    }
    serializeParam(spec) {
      switch (spec.type) {
        case "choice": {
          const options = spec.options;
          return (options.findIndex(
            (x) => (isString(x) ? x : x[0]) === spec.value
          ) / options.length).toFixed(3);
        }
        case "range": {
          const { min, max } = spec;
          return fit(spec.value, min, max, 0, 1).toFixed(6);
        }
        case "toggle":
          return spec.value >= 0.5 ? "1" : "0";
        case "weighted": {
          const options = spec.options;
          return (options.findIndex(
            (x) => (isString(x) ? x : x[1]) === spec.value
          ) / options.length).toFixed(3);
        }
        default:
          return String(spec.value);
      }
    }
  };
  var cyrb128 = (str) => {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ h1 >>> 18, 597399067);
    h2 = Math.imul(h4 ^ h2 >>> 22, 2869860233);
    h3 = Math.imul(h1 ^ h3 >>> 17, 951274213);
    h4 = Math.imul(h2 ^ h4 >>> 19, 2716044179);
    return [
      (h1 ^ h2 ^ h3 ^ h4) >>> 0,
      (h2 ^ h1) >>> 0,
      (h3 ^ h1) >>> 0,
      (h4 ^ h1) >>> 0
    ];
  };
  $genart.setAdapter(new EditArtAdapter());
})();
