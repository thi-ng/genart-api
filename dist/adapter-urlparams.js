"use strict";
(() => {
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

  // src/adapters/base64.ts
  var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  var base64Encode = (src) => {
    const buf = Array.isArray(src) ? new Uint8Array(src) : new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
    const n = buf.length;
    const n3 = (n / 3 | 0) * 3;
    const enc1 = (x) => B64[x >> 18 & 63] + B64[x >> 12 & 63];
    const enc2 = (x) => enc1(x) + B64[x >> 6 & 63];
    let result = "";
    for (let i = 0; i < n3; i += 3) {
      const x = buf[i] << 16 | buf[i + 1] << 8 | buf[i + 2];
      result += enc2(x) + B64[x & 63];
    }
    result += n - n3 === 1 ? enc1(buf[n - 1] << 16) + "==" : n - n3 === 2 ? enc2(buf[n - 2] << 16 | buf[n - 1] << 8) + "=" : "";
    return result;
  };
  var base64Decode = (src) => {
    const match = /=*$/.exec(src);
    const num = src.length - (match?.[0].length ?? 0);
    const result = new Uint8Array(num / 4 * 3);
    let value = 0;
    for (let i = 0, j = 0; i < num; ) {
      const x = B64.indexOf(src[i]);
      value = i & 3 ? (value << 6) + x : x;
      if (i++ & 3) result[j++] = 255 & value >> (-2 * i & 6);
    }
    return result;
  };

  // src/adapters/urlparams.ts
  var {
    math: { clamp01, parseNum }
  } = $genart;
  var URLParamsAdapter = class {
    params;
    cache = {};
    constructor() {
      this.params = new URLSearchParams(location.search);
      $genart.on("genart:paramchange", (e) => {
        const value = this.serializeParam(e.spec);
        this.params.set(e.paramID, value);
        parent.postMessage(
          {
            type: "paramadapter:update",
            params: this.params.toString()
          },
          "*"
        );
        if (e.spec.update === "reload") {
          console.log("reloading w/", this.params.toString());
          location.search = this.params.toString();
        }
      });
      $genart.on(
        "genart:statechange",
        ({ state }) => state === "ready" && $genart.start()
      );
    }
    get mode() {
      return this.params.get("__mode") || "play";
    }
    get screen() {
      return {
        width: parseNum(this.params.get("__width"), window.innerWidth),
        height: parseNum(this.params.get("__height"), window.innerHeight),
        dpr: parseNum(
          this.params.get("__dpr"),
          window.devicePixelRatio || 1
        )
      };
    }
    get prng() {
      const seedParam = this.params.get("__seed");
      const seed = BigInt(seedParam ? "0x" + seedParam : Date.now());
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
        seed: seed.toString(16),
        reset
      };
      reset();
      return impl;
    }
    async setParams(_) {
      return true;
    }
    async updateParam(id, spec) {
      let value = this.params.get(id);
      if (!value || this.cache[id] === value) return;
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
          return { value: base64Decode(value) };
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
        case "xy":
          return { value: value.split(",").map((x) => +x) };
      }
    }
    serializeParam(spec) {
      switch (spec.type) {
        case "color":
          return spec.value.substring(1);
        case "date":
          return spec.value.toISOString().substring(0, 10);
        case "datetime":
          return spec.value.toISOString();
        case "img":
          return base64Encode(spec.value);
        case "numlist":
        case "strlist":
          return spec.value.join(",");
        case "ramp": {
          const $spec = spec;
          return $spec.mode[0] + "," + $spec.stops.flatMap((x) => x).join(",");
        }
        case "time":
          return spec.value.join(":");
        case "toggle":
          return spec.value ? 1 : 0;
        case "xy":
          return spec.value.map((x) => x.toFixed(3)).join(",");
        default:
          return spec.value;
      }
    }
    capture(el) {
      console.log("TODO handle capture...", el);
    }
  };
  $genart.setAdapter(new URLParamsAdapter());
})();
