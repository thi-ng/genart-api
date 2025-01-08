"use strict";
(() => {
  // src/index.ts
  globalThis.drawArt = () => {
  };
  var MAX_PARAMS = 5;
  var SUPPORTED_TYPES = ["choice", "range", "toggle", "weighted"];
  var {
    math: { clamp, round, fit, mix },
    prng: { defPRNG, sfc32 },
    utils: { isString, hashString }
  } = $genart;
  var EditArtAdapter = class {
    _paramIndex = {};
    _searchParams;
    _selectedParamIDs;
    _cache = {};
    _prng;
    _screen;
    constructor() {
      this._searchParams = new URLSearchParams(location.search);
      this._screen = this.screen;
      this.initPRNG();
      $genart.on("genart:param-change", ({ paramID, param }) => {
        const index = this._paramIndex[paramID];
        if (index == null) return;
        const value = this.serializeParam(param);
        if (value == null || this._cache[paramID] === value) return;
        this._cache[paramID] = value;
        this._searchParams.set("m" + index, value);
        this.reload();
      });
      $genart.on("genart:state-change", ({ state }) => {
        if (state === "ready") $genart.start();
      });
      window.addEventListener("message", (e) => {
        if (e.data.hasOwnProperty("editartQueryString")) {
          this._searchParams = new URLSearchParams(
            e.data["editartQueryString"]
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
    configure(opts) {
      if (opts.params) {
        if (opts.params.length > MAX_PARAMS) {
          throw new Error(
            `${this.id}: only max. ${MAX_PARAMS} can be selected`
          );
        }
        this._selectedParamIDs = opts.params;
      }
    }
    async updateParam(id, param) {
      const index = this._paramIndex[id];
      if (index == null) {
        if (!SUPPORTED_TYPES.includes(param.type)) {
          this.warn(
            `ignoring unsupported param: ${id} (type: ${param.type})`
          );
        }
        return;
      }
      const paramVal = this._searchParams.get("m" + index) || "0.5";
      if (this._cache[id] === paramVal) return;
      this._cache[id] = paramVal;
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
      let filtered = [];
      if (this._selectedParamIDs) {
        for (let id of this._selectedParamIDs) {
          const param = params[id];
          if (param) {
            filtered.push([id, param]);
          } else {
            this.warn(`can't select unknown param: ${id}, skipping...`);
          }
        }
      } else {
        for (let pair of Object.entries(params)) {
          if (pair[1].edit !== "private" && SUPPORTED_TYPES.includes(pair[1].type)) {
            filtered.push(pair);
          }
        }
        if (filtered.length > MAX_PARAMS) {
          this.warn(
            `found ${filtered.length} eligible params, but platform only supports max. ${MAX_PARAMS} params`
          );
          filtered = filtered.slice(0, MAX_PARAMS);
          this.warn(
            `only using these params (in order):`,
            filtered.map((x) => x[0])
          );
        }
        filtered.sort((a, b) => {
          const ao = a[1].order;
          const bo = b[1].order;
          if (ao === bo) return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
          return ao - bo;
        });
      }
      for (let i = 0, num = filtered.length; i < num; i++) {
        this._paramIndex[filtered[i][0]] = i;
      }
    }
    capture(_) {
      triggerPreview();
    }
    reload() {
      console.log(
        `${this.id} reloading with new params:`,
        this._searchParams.toString()
      );
      location.search = this._searchParams.toString();
    }
    initPRNG() {
      let seedStr = typeof randomSeedEditArt !== "undefined" ? randomSeedEditArt : $genart.id;
      for (let i = 0; i < MAX_PARAMS; i++) {
        seedStr += this._searchParams.get("m" + i) || "0.5";
      }
      this._prng = defPRNG(seedStr, hashString(seedStr), sfc32);
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
    warn(msg, ...args) {
      console.warn(`${this.id}:`, msg, ...args);
    }
  };
  $genart.setAdapter(new EditArtAdapter());
})();
