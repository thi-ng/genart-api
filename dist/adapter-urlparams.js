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

  // src/index.ts
  var {
    math: { clamp01, parseNum },
    prng: { SFC32, randomBigInt },
    utils: { formatValuePrec, parseBigInt128, stringifyBigInt }
  } = $genart;
  var AUTO = "__autostart";
  var WIDTH = "__width";
  var HEIGHT = "__height";
  var DPR = "__dpr";
  var SEED = "__seed";
  var MODE = "__mode";
  var COLLECTOR = "__collector";
  var ITER = "__iteration";
  var MAX_SEED = 1n << 128n;
  var URLParamsAdapter = class {
    params;
    cache = {};
    _prng;
    _seed;
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
            type: `${this.id}:set-params`,
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
          type: `${this.id}:set-params`,
          params: this.params.toString()
        },
        "*"
      );
    }
    get id() {
      return "@genart-api/adapter-urlparams";
    }
    get mode() {
      return this.params.get(MODE) || "play";
    }
    get collector() {
      return this.params.get(COLLECTOR) ?? void 0;
    }
    get iteration() {
      const id = this.params.get(ITER);
      return id ? parseNum(id, 0) : void 0;
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
    get seed() {
      return this._seed;
    }
    augmentParams(params) {
      const group = this.id;
      return {
        ...params,
        [SEED]: $genart.params.bigint({
          group,
          order: 0,
          name: "PRNG seed",
          desc: "Manually defined seed value",
          min: 0n,
          max: MAX_SEED - 1n,
          default: BigInt(this._seed),
          update: "reload"
        }),
        [WIDTH]: $genart.params.range({
          group,
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
          group,
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
          group,
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
          group,
          order: 4,
          name: "Autostart",
          desc: "If enabled, artwork will start playing automatically",
          default: this.params.get(AUTO) !== "0",
          randomize: false,
          update: "reload"
        })
      };
    }
    async updateParam(id, spec) {
      let value = this.params.get(id);
      if (value == null || this.cache[id] === value) return;
      this.cache[id] = value;
      switch (spec.type) {
        case "bigint":
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
        case "binary":
        case "image":
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
        case "bigint":
          return stringifyBigInt(spec.value, 16);
        case "binary":
        case "image":
          return base64Encode(
            await compressBytes(spec.value)
          );
        case "color":
          return spec.value.substring(1);
        case "date":
          return spec.value.toISOString().substring(0, 10);
        case "datetime":
          return spec.value.toISOString();
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
      const seed = seedParam ? BigInt(seedParam) : randomBigInt(MAX_SEED);
      this._seed = stringifyBigInt(seed);
      this._prng = new SFC32(parseBigInt128(seed));
    }
  };
  $genart.setAdapter(new URLParamsAdapter());
})();
