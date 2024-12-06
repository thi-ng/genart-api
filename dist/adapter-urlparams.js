"use strict";
(() => {
  // src/base64.ts
  var base64Encode = (src) => {
    const buf = Array.isArray(src) ? src : new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
    return btoa(String.fromCharCode(...buf));
  };
  var base64Decode = (src) => new Uint8Array([...atob(src)].map((x) => x.charCodeAt(0)));

  // src/compress.ts
  var pipe = async (buf, stream) => new Uint8Array(
    await new Response(
      new Blob([buf]).stream().pipeThrough(stream)
    ).arrayBuffer()
  );
  var compressBytes = (buf, fmt = "gzip") => pipe(buf, new CompressionStream(fmt));
  var decompressBytes = (buf, fmt = "gzip") => pipe(buf, new DecompressionStream(fmt));

  // src/prng/sfc32.ts
  var sfc32 = (seed) => {
    const buf = new Uint32Array(4);
    buf.set(seed);
    return () => {
      const t = (buf[0] + buf[1] >>> 0) + buf[3] >>> 0;
      buf[3] = buf[3] + 1 >>> 0;
      buf[0] = buf[1] ^ buf[1] >>> 9;
      buf[1] = buf[2] + (buf[2] << 3) >>> 0;
      buf[2] = (buf[2] << 21 | buf[2] >>> 11) + t >>> 0;
      return t / 4294967296;
    };
  };

  // src/index.ts
  var {
    math: { clamp01, parseNum },
    utils: { formatValuePrec }
  } = $genart;
  var AUTO = "__autostart";
  var WIDTH = "__width";
  var HEIGHT = "__height";
  var DPR = "__dpr";
  var SEED = "__seed";
  var GROUP = "platform";
  var URLParamsAdapter = class {
    params;
    cache = {};
    _prng;
    _screen;
    constructor() {
      this.params = new URLSearchParams(location.search);
      this._screen = this.screen;
      this.initPRNG();
      $genart.on("genart:param-change", async (e) => {
        const value = await this.serializeParam(e.param);
        this.params.set(e.paramID, value);
        parent.postMessage(
          {
            type: "urlparamsadapter:set-params",
            params: this.params.toString()
          },
          "*"
        );
        if (e.param.update === "reload") {
          console.log("reloading w/", this.params.toString());
          location.search = this.params.toString();
        }
      });
      $genart.on("genart:state-change", ({ state }) => {
        if (state === "ready" && this.params.get(AUTO) !== "0") {
          $genart.start();
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
      parent.postMessage(
        {
          type: "urlparamsadapter:set-params",
          params: this.params.toString()
        },
        "*"
      );
    }
    get mode() {
      return this.params.get("__mode") || "play";
    }
    get screen() {
      return {
        width: parseNum(this.params.get(WIDTH), window.innerWidth),
        height: parseNum(this.params.get(HEIGHT), window.innerHeight),
        dpr: parseNum(this.params.get(DPR), window.devicePixelRatio || 1)
      };
    }
    get prng() {
      return this._prng;
    }
    augmentParams(params) {
      return Object.assign(params, {
        [SEED]: $genart.params.range({
          group: GROUP,
          order: 0,
          name: "PRNG seed",
          desc: "Manually defined seed value",
          min: 0,
          max: 1e13,
          default: Number(BigInt(this._prng.seed)),
          update: "reload",
          widget: "precise"
        }),
        [WIDTH]: $genart.params.range({
          group: GROUP,
          order: 1,
          name: "Width",
          desc: "Canvas width",
          min: 100,
          max: 16384,
          default: this._screen.width,
          randomize: false,
          update: "reload",
          widget: "precise"
        }),
        [HEIGHT]: $genart.params.range({
          group: GROUP,
          order: 2,
          name: "Height",
          desc: "Canvas height",
          min: 100,
          max: 16384,
          default: this._screen.height,
          randomize: false,
          update: "reload",
          widget: "precise"
        }),
        [DPR]: $genart.params.range({
          group: GROUP,
          order: 3,
          name: "DPR",
          desc: "Device pixel ratio",
          min: 1,
          max: 4,
          default: this._screen.dpr,
          randomize: false,
          update: "reload",
          widget: "precise"
        }),
        [AUTO]: $genart.params.toggle({
          group: GROUP,
          order: 4,
          name: "Autostart",
          desc: "If enabled, artwork will start playing automatically",
          default: this.params.get(AUTO) !== "0",
          randomize: false,
          update: "reload"
        })
      });
    }
    async updateParam(id, spec) {
      let value = this.params.get(id);
      if (value == null || this.cache[id] === value) return;
      this.cache[id] = value;
      switch (spec.type) {
        case "color":
        case "choice":
        case "text":
        case "time":
        case "weighted":
          return { value };
        // special handling...
        case "date":
        case "datetime":
          return { value: new Date(Date.parse(value)) };
        case "img":
          return { value: await decompressBytes(base64Decode(value)) };
        case "numlist":
          return { value: value.split(",").map((x) => parseNum(x)) };
        case "range":
          return { value: +value };
        case "ramp": {
          const [$mode, ...$stops] = value.split(",");
          if (!$mode || $stops.length < 4 || $stops.length & 1) {
            $genart.paramError(id);
            return;
          }
          const mode = { l: "linear", s: "smooth", e: "exp" }[$mode] || "linear";
          const stops = [];
          for (let i = 0; i < $stops.length; i += 2) {
            stops.push([
              clamp01(parseNum($stops[i])),
              clamp01(parseNum($stops[i + 1]))
            ]);
          }
          stops.sort((a, b) => a[0] - b[0]);
          return { update: { mode, stops: stops.flat() } };
        }
        case "strlist":
          return { value: value.split(",") };
        case "toggle":
          return { value: value === "1" };
        case "vector":
        case "xy":
          return { value: value.split(",").map((x) => +x) };
      }
    }
    async serializeParam(spec) {
      switch (spec.type) {
        case "color":
          return spec.value.substring(1);
        case "date":
          return spec.value.toISOString().substring(0, 10);
        case "datetime":
          return spec.value.toISOString();
        case "img":
          return base64Encode(
            await compressBytes(spec.value)
          );
        case "numlist":
        case "strlist":
          return spec.value.join(",");
        case "ramp": {
          const $spec = spec;
          return $spec.mode[0] + "," + $spec.stops.flat().map((x) => x.toFixed(3)).join(",");
        }
        case "range":
          return formatValuePrec(spec.step)(spec.value);
        case "time":
          return spec.value.join(":");
        case "toggle":
          return spec.value ? 1 : 0;
        case "vector":
        case "xy": {
          const $spec = spec;
          const step = Array.isArray($spec.step) ? $spec.step[0] : 1e-3;
          return $spec.value.map(formatValuePrec(step)).join(",");
        }
        default:
          return spec.value;
      }
    }
    capture(el) {
      console.log("TODO handle capture...", el);
    }
    initPRNG() {
      const seedParam = this.params.get(SEED);
      const seed = BigInt(seedParam ?? Math.floor(Math.random() * 1e13));
      const M = 0xffffffffn;
      const reset = () => {
        return impl.rnd = sfc32([
          Number(seed >> 96n & M) >>> 0,
          Number(seed >> 64n & M) >>> 0,
          Number(seed >> 32n & M) >>> 0,
          Number(seed & M) >>> 0
        ]);
      };
      const impl = {
        seed: "0x" + seed.toString(16),
        reset
      };
      reset();
      this._prng = impl;
    }
  };
  $genart.setAdapter(new URLParamsAdapter());
})();
