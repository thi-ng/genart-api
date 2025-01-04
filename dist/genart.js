"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/math.ts
  var math_exports = {};
  __export(math_exports, {
    clamp: () => clamp,
    clamp01: () => clamp01,
    div: () => div,
    easeInOut5: () => easeInOut5,
    fit: () => fit,
    mix: () => mix,
    norm: () => norm,
    parseNum: () => parseNum,
    round: () => round,
    smoothstep: () => smoothstep,
    smoothstep01: () => smoothstep01
  });
  var parseNum = (x, fallback = 0) => {
    const y = x ? parseFloat(x) : Number.NaN;
    return isNaN(y) ? fallback : y;
  };
  var mix = (a, b, t) => a + (b - a) * t;
  var fit = (x, a, b, c, d) => c + (d - c) * norm(x, a, b);
  var clamp = (x, min, max) => x < min ? min : x > max ? max : x;
  var clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  var round = (x, y) => Math.round(div(x, y)) * y;
  var norm = (x, a, b) => div(x - a, b - a);
  var div = (x, y) => y != 0 ? x / y : 0;
  var smoothstep = (edge0, edge1, x) => smoothstep01(clamp01(div(x - edge0, edge1 - edge0)));
  var smoothstep01 = (x) => x * x * (3 - 2 * x);
  var __easeInOut = (k) => {
    const k2 = 2 ** (k - 1);
    return (t) => t < 0.5 ? k2 * t ** k : 1 - (-2 * t + 2) ** k / 2;
  };
  var easeInOut5 = __easeInOut(5);

  // src/params/factories.ts
  var factories_exports = {};
  __export(factories_exports, {
    PARAM_DEFAULTS: () => PARAM_DEFAULTS,
    bigint: () => bigint,
    binary: () => binary,
    choice: () => choice,
    color: () => color,
    date: () => date2,
    datetime: () => datetime2,
    image: () => image,
    numlist: () => numlist,
    ramp: () => ramp,
    range: () => range,
    strlist: () => strlist,
    text: () => text,
    time: () => time2,
    toggle: () => toggle,
    vector: () => vector2,
    weighted: () => weighted,
    xy: () => xy
  });

  // src/utils.ts
  var utils_exports = {};
  __export(utils_exports, {
    ensure: () => ensure,
    equiv: () => equiv,
    equivArrayLike: () => equivArrayLike,
    formatValuePrec: () => formatValuePrec,
    hashBytes: () => hashBytes,
    hashString: () => hashString,
    isBigInt: () => isBigInt,
    isFunction: () => isFunction,
    isInRange: () => isInRange,
    isNumber: () => isNumber,
    isNumericArray: () => isNumericArray,
    isString: () => isString,
    isStringArray: () => isStringArray,
    isTypedArray: () => isTypedArray,
    parseBigInt: () => parseBigInt,
    parseUUID: () => parseUUID,
    stringifyBigInt: () => stringifyBigInt,
    u16: () => u16,
    u24: () => u24,
    u32: () => u32,
    u8: () => u8,
    valuePrec: () => valuePrec
  });
  var ensure = (x, msg) => {
    if (!x) throw new Error(msg);
    return x;
  };
  var isBigInt = (x) => typeof x === "bigint";
  var isNumber = (x) => typeof x === "number" && !isNaN(x);
  var isString = (x) => typeof x === "string";
  var isFunction = (x) => typeof x === "function";
  var isNumericArray = (x) => isTypedArray(x) || Array.isArray(x) && x.every(isNumber);
  var isStringArray = (x) => Array.isArray(x) && x.every(isString);
  var isTypedArray = (x) => !!x && (x instanceof Float32Array || x instanceof Float64Array || x instanceof Uint32Array || x instanceof Int32Array || x instanceof Uint8Array || x instanceof Int8Array || x instanceof Uint16Array || x instanceof Int16Array || x instanceof Uint8ClampedArray);
  var isInRange = (x, min, max) => x >= min && x <= max;
  var u8 = (x) => (x &= 255, (x < 16 ? "0" : "") + x.toString(16));
  var u16 = (x) => u8(x >>> 8) + u8(x);
  var u24 = (x) => u16(x >>> 8) + u8(x & 255);
  var u32 = (x) => u16(x >>> 16) + u16(x);
  var stringifyBigInt = (x, radix = 10) => {
    const prefix = { 10: "", 2: "0b", 8: "0o", 16: "0x" }[radix];
    return x < 0n ? "-" + prefix + (-x).toString(radix) : prefix + x.toString(radix);
  };
  var parseBigInt = (x) => /^-0[box]/.test(x) ? -BigInt(x.substring(1)) : BigInt(x);
  var valuePrec = (step) => {
    const str = step.toString();
    const i = str.indexOf(".");
    return i > 0 ? str.length - i - 1 : 0;
  };
  var formatValuePrec = (step) => {
    const prec = valuePrec(step);
    return (x) => x.toFixed(prec);
  };
  var equiv = (a, b) => {
    if (a === b) return true;
    if (a == null) return b == null;
    if (b == null) return a == null;
    if (isString(a) || isNumber(a)) return a === b;
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }
    if (a.length != null && b.length != null) {
      return equivArrayLike(a, b);
    }
    return a === b || a !== a && b !== b;
  };
  var equivArrayLike = (a, b) => {
    if (a.length !== b.length) return false;
    let i = a.length;
    while (i-- > 0 && equiv(a[i], b[i])) ;
    return i < 0;
  };
  var M = 0xfffffffffn;
  var imul = Math.imul;
  var parseUUID = (uuid) => {
    const id = BigInt("0x" + uuid.replace(/-/g, "").substring(0, 32));
    return new Uint32Array([
      Number(id >> 96n & M),
      Number(id >> 64n & M),
      Number(id >> 32n & M),
      Number(id & M)
    ]);
  };
  var hashBytes = (buf, seed = 0) => {
    const u322 = (i2) => buf[i2 + 3] << 24 | buf[i2 + 2] << 16 | buf[i2 + 1] << 8 | buf[i2];
    const rotate = (x, r) => x << r | x >>> 32 - r;
    const update = (i2, p) => {
      const q = p + 1 & 3;
      H[p] = imul(rotate(H[p] ^ imul(rotate(imul(u322(i2), P[p]), 15 + p), P[q]), 19 - (p << 1)) + H[q], 5) + K[p];
    };
    const sum = (h) => {
      const h0 = h[0] += h[1] + h[2] + h[3];
      h[1] += h0;
      h[2] += h0;
      h[3] += h0;
      return h;
    };
    const fmix = (h) => {
      h ^= h >>> 16;
      h = imul(h, 2246822507);
      h ^= h >>> 13;
      h = imul(h, 3266489909);
      return h ^= h >>> 16;
    };
    const N = buf.length;
    const K = new Uint32Array([1444728091, 197830471, 2530024501, 850148119]);
    const P = new Uint32Array([597399067, 2869860233, 951274213, 2716044179]);
    const H = P.map((x) => x ^ seed);
    let i = 0;
    for (const blockLimit = N & -16; i < blockLimit; i += 16) {
      update(i, 0);
      update(i + 4, 1);
      update(i + 8, 2);
      update(i + 12, 3);
    }
    K.fill(0);
    for (let j = N & 15; j > 0; j--) {
      const j1 = j - 1;
      if ((j & 3) === 1) {
        const bin = j >> 2;
        K[bin] = rotate(imul(K[bin] ^ buf[i + j1], P[bin]), 15 + bin);
        H[bin] ^= imul(K[bin], P[bin + 1 & 3]);
      } else {
        K[j1 >> 2] ^= buf[i + j1] << (j1 << 3);
      }
    }
    return sum(sum(H.map((x) => x ^ N)).map(fmix));
  };
  var hashString = (x, seed) => hashBytes(new TextEncoder().encode(x), seed);

  // src/params/date.ts
  var RE_DATE = /^\d{4}-\d{2}-\d{2}$/;
  var date = {
    validate: (_, value) => value instanceof Date || isNumber(value) || isString(value) && RE_DATE.test(value),
    coerce: (_, value) => isNumber(value) ? new Date(value) : isString(value) ? new Date(Date.parse(value)) : value
  };

  // src/params/datetime.ts
  var RE_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[-+]\d{2}:\d{2})$/;
  var datetime = {
    validate: (_, value) => value instanceof Date || isNumber(value) || isString(value) && RE_DATETIME.test(value),
    coerce: (_, value) => isNumber(value) ? new Date(value) : isString(value) ? new Date(Date.parse(value)) : value
  };

  // src/params/time.ts
  var time = {
    validate: (_, value) => isNumericArray(value) && value.length === 3 && isInRange(value[0], 0, 23) && isInRange(value[1], 0, 59) && isInRange(value[2], 0, 59) || isString(value) && /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value),
    coerce: (_, value) => isString(value) ? value.split(":").map(parseNum) : value,
    randomize: (_, rnd) => [
      rnd() * 24 | 0,
      rnd() * 60 | 0,
      rnd() * 60 | 0
    ]
  };

  // src/params/vector.ts
  var vector = {
    validate: (spec, value) => {
      const { min, max, size } = spec;
      return isNumericArray(value) && value.length === size && value.every((x, i) => isInRange(x, min[i], max[i]));
    },
    coerce: (spec, value) => {
      const { min, max, step } = spec;
      return value.map(
        (x, i) => clamp(round(x, step[i]), min[i], max[i])
      );
    },
    randomize: (spec, rnd) => {
      const { min, max, size, step } = spec;
      return new Array(size).fill(0).map(
        (_, i) => clamp(
          round(mix(min[i], max[i], rnd()), step[i]),
          min[i],
          max[i]
        )
      );
    }
  };

  // src/params/factories.ts
  var PARAM_DEFAULTS = {
    desc: "TODO description",
    edit: "protected",
    group: "main",
    order: 0,
    randomize: true,
    state: "void",
    update: "event",
    widget: "default"
  };
  var $ = (type, spec, randomize = true) => {
    ensure(spec.name, "missing param `name`");
    return {
      ...PARAM_DEFAULTS,
      type,
      randomize,
      ...spec
    };
  };
  var $default = (impl, value) => value != null ? ensure(
    impl.validate(null, value),
    `invalid default value: ${value}`
  ) && impl.coerce(null, value) : value;
  var minMaxLength = (spec, maxDefault = 10) => {
    let min = 0, max = spec.maxLength || maxDefault;
    if (spec.minLength) {
      min = spec.minLength;
      if (!spec.maxLength) max = Math.max(min, maxDefault);
    }
    ensure(min <= max, `invalid list length constraint`);
    return [min, max];
  };
  var bigint = (spec) => $("bigint", {
    min: 0n,
    max: 0xffffffffffffffffn,
    ...spec
  });
  var binary = (spec) => $(
    "binary",
    {
      minLength: 0,
      maxLength: 1024,
      ...spec
    },
    false
  );
  var choice = (spec) => $("choice", spec);
  var color = (spec) => $("color", spec);
  var date2 = (spec) => $(
    "date",
    {
      ...spec,
      default: $default(date, spec.default)
    },
    false
  );
  var datetime2 = (spec) => $(
    "datetime",
    {
      ...spec,
      default: $default(datetime, spec.default)
    },
    false
  );
  var image = (spec) => $(
    "img",
    {
      default: spec.default || new (spec.format === "gray" ? Uint8Array : Uint32Array)(
        spec.width * spec.height
      ),
      ...spec
    },
    false
  );
  var numlist = (spec) => {
    const [minLength, maxLength] = minMaxLength(spec, 10);
    return $(
      "numlist",
      {
        default: spec.default || new Array(minLength).fill(0),
        minLength,
        maxLength,
        ...spec
      },
      false
    );
  };
  var ramp = (spec) => $(
    "ramp",
    {
      ...spec,
      stops: spec.stops ? spec.stops.flat() : [0, 0, 1, 1],
      mode: spec.mode || "linear",
      default: 0
    },
    false
  );
  var range = (spec) => $("range", {
    min: 0,
    max: 100,
    step: 1,
    ...spec
  });
  var strlist = (spec) => {
    const [minLength, maxLength] = minMaxLength(spec, 10);
    return $(
      "strlist",
      {
        default: spec.default || new Array(minLength).fill(""),
        minLength,
        maxLength,
        ...spec
      },
      false
    );
  };
  var text = (spec) => $(
    "text",
    { minLength: 0, maxLength: 1024, multiline: false, ...spec },
    false
  );
  var time2 = (spec) => {
    return $("time", {
      ...spec,
      default: spec.default != null ? ensure(time.validate(null, spec.default), ``) && time.coerce(null, spec.default) : spec.default
    });
  };
  var toggle = (spec) => $("toggle", spec);
  var vector2 = (spec) => {
    if (spec.labels) {
      ensure(spec.labels.length >= spec.size, `expected ${spec.size} labels`);
    } else {
      ensure(spec.size <= 4, "missing vector labels");
    }
    const $vec = (n, value, defaultValue = 0) => Array.isArray(value) ? (ensure(value.length === n, "wrong vector size"), value) : new Array(n).fill(isNumber(value) ? value : defaultValue);
    const limits = {
      min: $vec(spec.size, spec.min, 0),
      max: $vec(spec.size, spec.max, 1),
      step: $vec(spec.size, spec.step, 0.01)
    };
    return $("vector", {
      ...spec,
      ...limits,
      default: spec.default ? ensure(
        spec.default.length == spec.size,
        `wrong vector size, expected ${spec.size} values`
      ) && vector.coerce(limits, spec.default) : spec.default,
      labels: spec.labels || ["X", "Y", "Z", "W"].slice(0, spec.size)
    });
  };
  var weighted = (spec) => $("weighted", {
    ...spec,
    options: spec.options.sort((a, b) => b[0] - a[0]),
    total: spec.options.reduce((acc, x) => acc + x[0], 0)
  });
  var xy = (spec) => $("xy", spec);

  // src/params/bigint.ts
  var bigint2 = {
    validate: (spec, value) => {
      const { min, max } = spec;
      if (isString(value)) {
        if (!/^-?([0-9]+|0x[0-9a-f]+|0b[01]+|0o[0-7]+)$/.test(value)) {
          return false;
        }
        value = parseBigInt(value);
      } else if (isNumber(value) || isBigInt(value)) {
        value = BigInt(value);
      } else {
        return false;
      }
      return value >= min && value <= max;
    },
    coerce: (_, value) => isString(value) ? parseBigInt(value) : BigInt(value),
    randomize: (spec, rnd) => {
      const { min, max } = spec;
      return BigInt(fit(rnd(), 0, 1, Number(min), Number(max)));
    }
  };

  // src/params/binary.ts
  var binary2 = {
    validate: (spec, value) => {
      const { minLength, maxLength } = spec;
      return value instanceof Uint8Array && value.length >= minLength && value.length <= maxLength;
    }
  };

  // src/params/choice.ts
  var choice2 = {
    validate: (spec, value) => !!spec.options.find(
      (x) => (isString(x) ? x : x[0]) === value
    ),
    randomize: (spec, rnd) => {
      const opts = spec.options;
      const value = opts[rnd() * opts.length | 0];
      return isString(value) ? value : value[0];
    }
  };

  // src/params/color.ts
  var color2 = {
    validate: (_, value) => isString(value) && /^#?[0-9a-f]{6,8}$/i.test(value),
    coerce: (_, value) => (value[0] !== "#" ? "#" + value : value).substring(0, 7),
    randomize: (_, rnd) => "#" + u24(rnd() * 16777216 | 0)
  };

  // src/params/image.ts
  var image2 = {
    validate: (spec, value) => {
      const { width, height, format } = spec;
      return isTypedArray(value) && value.length == width * height && (format === "gray" ? value instanceof Uint8Array || value instanceof Uint8ClampedArray : value instanceof Uint32Array);
    }
  };

  // src/params/numlist.ts
  var numlist2 = {
    validate: (spec, value) => {
      const { minLength, maxLength } = spec;
      return isNumericArray(value) && isInRange(value.length, minLength, maxLength);
    }
  };

  // src/params/ramp.ts
  var ramp2 = {
    validate: (_, value) => isNumber(value),
    read: (spec, t) => {
      const { stops, mode } = spec;
      let n = stops.length;
      let i = n;
      for (; (i -= 2) >= 0; ) {
        if (t >= stops[i]) break;
      }
      n -= 2;
      const at = stops[i];
      const av = stops[i + 1];
      const bt = stops[i + 2];
      const bv = stops[i + 3];
      return i < 0 ? stops[1] : i >= n ? stops[n + 1] : {
        exp: () => mix(av, bv, easeInOut5(norm(t, at, bt))),
        linear: () => fit(t, at, bt, av, bv),
        smooth: () => mix(av, bv, smoothstep01(norm(t, at, bt)))
      }[mode || "linear"]();
    },
    params: {
      stops: numlist({
        name: "Ramp stops",
        desc: "Control points",
        minLength: 4,
        maxLength: Infinity,
        default: []
      }),
      mode: choice({
        name: "Ramp mode",
        desc: "Interpolation method",
        options: ["linear", "smooth", "exp"]
      })
    }
  };

  // src/params/range.ts
  var range2 = {
    validate: (spec, value) => {
      const { min, max } = spec;
      return isNumber(value) && isInRange(value, min, max);
    },
    coerce: (spec, value) => {
      const $spec = spec;
      return clamp(
        round(value ?? $spec.default, $spec.step || 1),
        $spec.min,
        $spec.max
      );
    },
    randomize: (spec, rnd) => {
      const { min, max, step } = spec;
      return clamp(round(mix(min, max, rnd()), step || 1), min, max);
    }
  };

  // src/params/strlist.ts
  var strlist2 = {
    validate: (spec, value) => {
      const { minLength, maxLength, match } = spec;
      if (!(isStringArray(value) && isInRange(value.length, minLength, maxLength)))
        return false;
      if (match) {
        const regExp = isString(match) ? new RegExp(match) : match;
        return value.every((x) => regExp.test(x));
      }
      return true;
    }
  };

  // src/params/text.ts
  var text2 = {
    validate: (spec, value) => {
      if (!isString(value)) return false;
      const { minLength, maxLength, match } = spec;
      if (match) {
        const regexp = isString(match) ? new RegExp(match) : match;
        if (!regexp.test(value)) return false;
      }
      return isInRange(value.length, minLength, maxLength);
    }
  };

  // src/params/toggle.ts
  var toggle2 = {
    validate: (_, value) => isString(value) ? /^(true|false|0|1)$/.test(value) : value === 1 || value === 0 || typeof value === "boolean",
    coerce: (_, value) => value === "true" || value === "1" ? true : value === "false" || value === "0" ? false : !!value,
    randomize: (_, rnd) => rnd() < 0.5
  };

  // src/params/weighted.ts
  var weighted2 = {
    validate: (spec, value) => !!spec.options.find((x) => x[1] === value),
    randomize: (spec, rnd) => {
      let {
        options,
        total,
        default: fallback
      } = spec;
      const r = rnd() * total;
      for (let i = 0, n = options.length; i < n; i++) {
        total -= options[i][0];
        if (total <= r) return options[i][1];
      }
      return fallback;
    }
  };

  // src/params/xy.ts
  var xy2 = {
    validate: (_, value) => isNumericArray(value) && value.length == 2,
    coerce: (_, value) => [clamp01(value[0]), clamp01(value[1])],
    randomize: (_, rnd) => [rnd(), rnd()]
  };

  // src/prng.ts
  var prng_exports = {};
  __export(prng_exports, {
    sfc32: () => sfc32,
    xorshift128: () => xorshift128,
    xsadd: () => xsadd
  });
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
  var xorshift128 = (seed) => {
    const buf = new Uint32Array(4);
    buf.set(seed);
    return () => {
      let t = buf[3], w;
      t ^= t << 11;
      t ^= t >>> 8;
      buf[3] = buf[2];
      buf[2] = buf[1];
      w = buf[1] = buf[0];
      return buf[0] = (t ^ w ^ w >>> 19) >>> 0;
    };
  };
  var xsadd = (seed) => {
    const buf = new Uint32Array(4);
    buf.set([seed, 0, 0, 0]);
    for (let j = 0, i = 1; i < 8; j = i++) {
      let x = (buf[j & 3] ^ buf[j & 3] >>> 30) >>> 0;
      x = 35173 * x + ((27655 * x & 65535) << 16) >>> 0;
      buf[i & 3] ^= i + x >>> 0;
    }
    return () => {
      let t = buf[0];
      t ^= t << 15;
      t ^= t >>> 18;
      t ^= buf[3] << 11;
      buf[0] = buf[1];
      buf[1] = buf[2];
      buf[2] = buf[3];
      buf[3] = t;
      return t + buf[2] >>> 0;
    };
  };

  // src/time/offline.ts
  var timeProviderOffline = (frameDelay = 250, referenceFPS = 60, frameOffset = 0) => {
    let frame = frameOffset;
    const frameTime = 1e3 / referenceFPS;
    return {
      start() {
        frame = frameOffset - 1;
      },
      next(fn) {
        setTimeout(() => {
          frame++;
          fn(frame * frameTime, frame);
        }, frameDelay);
      },
      now: () => [frame * frameTime, frame]
    };
  };

  // src/time/raf.ts
  var timeProviderRAF = (timeOffset = 0, frameOffset = 0) => {
    let t0 = performance.now();
    let frame = frameOffset;
    let now = timeOffset;
    let isStart = true;
    return {
      start() {
        isStart = true;
      },
      next(fn) {
        requestAnimationFrame((t) => {
          if (isStart) {
            t0 = t;
            frame = frameOffset;
            isStart = false;
          } else {
            frame++;
          }
          now = timeOffset + t - t0;
          fn(now, frame);
        });
      },
      now: () => [now, frame]
    };
  };

  // src/genart.ts
  var { ensure: ensure2, isFunction: isFunction2 } = utils_exports;
  var API = class {
    _opts = {
      // auto-generated instance ID
      id: Math.floor(Math.random() * 1e12).toString(36),
      allowExternalConfig: false,
      notifyFrameUpdate: false
    };
    _adapter;
    _time = timeProviderRAF();
    _prng;
    _update;
    _state = "init";
    _traits;
    _params;
    _paramTypes = {
      bigint: bigint2,
      binary: binary2,
      choice: choice2,
      color: color2,
      date,
      datetime,
      image: image2,
      numlist: numlist2,
      ramp: ramp2,
      range: range2,
      strlist: strlist2,
      text: text2,
      time,
      toggle: toggle2,
      vector,
      weighted: weighted2,
      xy: xy2
    };
    math = math_exports;
    params = factories_exports;
    prng = prng_exports;
    utils = utils_exports;
    time = {
      offline: timeProviderOffline,
      raf: timeProviderRAF
    };
    constructor() {
      window.addEventListener("message", (e) => {
        const data = e.data;
        if (!this.isRecipient(e) || data?.__self) return;
        switch (data.type) {
          case "genart:get-info":
            this.notifyInfo();
            break;
          case "genart:randomize-param":
            this.randomizeParamValue(data.paramID, data.key);
            break;
          case "genart:resume":
            this.start(true);
            break;
          case "genart:configure": {
            const opts = data.opts;
            delete opts.id;
            delete opts.allowExternalConfig;
            this.configure(opts);
            break;
          }
          case "genart:set-param-value":
            this.setParamValue(data.paramID, data.value, data.key);
            break;
          case "genart:start":
            this.start();
            break;
          case "genart:stop":
            this.stop();
            break;
        }
      });
    }
    get version() {
      return "0.22.0";
    }
    get id() {
      return this._opts.id;
    }
    get mode() {
      return this._adapter?.mode || "play";
    }
    get screen() {
      return this._adapter?.screen || {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio
      };
    }
    get random() {
      if (this._prng) return this._prng;
      return this._prng = ensure2(
        this._adapter,
        "missing platform adapter"
      ).prng;
    }
    get state() {
      return this._state;
    }
    get paramSpecs() {
      return this._params;
    }
    get adapter() {
      return this._adapter;
    }
    get timeProvider() {
      return this._time;
    }
    registerParamType(type, impl) {
      ensureValidType(type);
      if (this._paramTypes[type]) {
        console.warn("overriding impl for param type:", type);
      }
      this._paramTypes[type] = impl;
    }
    paramType(type) {
      ensureValidType(type);
      return this._paramTypes[type];
    }
    async setParams(params) {
      try {
        if (this._adapter?.augmentParams) {
          params = this._adapter.augmentParams(params);
        }
        this._params = {};
        for (let id in params) {
          ensureValidID(id);
          const param = {
            ...params.PARAM_DEFAULTS,
            ...params[id]
          };
          const impl = this.ensureParamImpl(param.type);
          if (param.default == null) {
            if (impl.randomize) {
              param.default = impl.randomize(param, this.random.rnd);
              param.state = "random";
            } else if (impl.read) {
              param.state = "dynamic";
            } else {
              throw new Error(
                `missing default value for param: ${id}`
              );
            }
          } else {
            if (!impl.validate(param, param.default)) {
              throw new Error(
                `invalid default value for param: ${id} (${param.default})`
              );
            }
            param.state = "default";
          }
          this._params[id] = param;
        }
        if (this._adapter) {
          if (this._adapter.initParams) {
            await this._adapter.initParams(this._params);
          }
          await this.updateParams();
        }
        this.notifySetParams();
        return this.getParamValue.bind(this);
      } catch (e) {
        this.setState("error", e.message);
        throw e;
      }
    }
    setTraits(traits) {
      this._traits = traits;
      this.emit({ type: "genart:traits", traits });
    }
    async setAdapter(adapter) {
      this._adapter = adapter;
      this.notifyReady();
    }
    waitForAdapter() {
      return this.waitFor("_adapter");
    }
    setTimeProvider(time3) {
      this._time = time3;
      this.notifyReady();
    }
    waitForTimeProvider() {
      return this.waitFor("_time");
    }
    setUpdate(fn) {
      this._update = fn;
      this.notifyReady();
    }
    async updateParams(notify = "none") {
      if (!this._adapter) return;
      for (let id in this._params) {
        const spec = this._params[id];
        const result = await this._adapter.updateParam(id, spec);
        if (!result) continue;
        const { value, update } = result;
        if (update) {
          for (let key in update) {
            this.setParamValue(id, update[key], key, "none");
          }
        }
        this.setParamValue(
          id,
          value,
          void 0,
          value != null || update ? notify : "none"
        );
      }
    }
    setParamValue(id, value, key, notify = "all") {
      let { spec, impl } = this.ensureParam(id);
      if (value != null) {
        let updateSpec = spec;
        if (key) {
          const { spec: nested, impl: nestedImpl } = this.ensureNestedParam(spec, key);
          updateSpec = nested;
          impl = nestedImpl;
        }
        if (!impl.validate(updateSpec, value)) {
          this.paramError(id);
          return;
        }
        spec[key || "value"] = impl.coerce ? impl.coerce(updateSpec, value) : value;
        if (!key) spec.state = "custom";
      }
      this.emit(
        {
          type: "genart:param-change",
          __self: true,
          param: this.asNestedParam(spec),
          paramID: id,
          key
        },
        notify
      );
    }
    randomizeParamValue(id, key, rnd = Math.random, notify = "all") {
      const {
        spec,
        impl: { randomize }
      } = this.ensureParam(id);
      const canRandomizeValue = randomize && spec.randomize !== false;
      if (key) {
        const { spec: nested, impl } = this.ensureNestedParam(spec, key);
        const canRandomizeKey = impl.randomize && nested.randomize !== false;
        if (canRandomizeKey) {
          this.setParamValue(
            id,
            impl.randomize(nested, rnd),
            key,
            canRandomizeKey || !canRandomizeValue ? notify : "none"
          );
        }
      }
      if (canRandomizeValue) {
        this.setParamValue(id, randomize(spec, rnd), void 0, notify);
      }
    }
    getParamValue(id, opt) {
      return this.paramValueGetter(id)(opt);
    }
    paramValueGetter(id) {
      const {
        spec,
        impl: { randomize, read }
      } = this.ensureParam(id);
      return (t = 0) => {
        if (isFunction2(t)) {
          if (randomize) return randomize(spec, t);
          t = 0;
        }
        return read ? read(spec, t) : spec.value ?? spec.default;
      };
    }
    paramError(paramID) {
      this.emit({ type: "genart:param-error", paramID });
    }
    configure(opts) {
      Object.assign(this._opts, opts);
      this.notifyInfo();
    }
    on(type, listener) {
      window.addEventListener("message", (e) => {
        if (this.isRecipient(e) && e.data?.type === type) listener(e.data);
      });
    }
    emit(e, notify = "all") {
      if (notify === "none") return;
      e.apiID = this.id;
      const isAll = notify === "all";
      if (isAll || notify === "self") window.postMessage(e, "*");
      if (isAll && parent !== window || notify === "parent")
        parent.postMessage(e, "*");
    }
    start(resume = false) {
      const state = this._state;
      if (state == "play") return;
      if (state !== "ready" && state !== "stop") {
        throw new Error(`can't start in state: ${state}`);
      }
      this.setState("play");
      const msg = {
        type: "genart:frame",
        __self: true,
        apiID: this.id,
        time: 0,
        frame: 0
      };
      const update = (time3, frame) => {
        if (this._state != "play") return;
        if (this._update.call(null, time3, frame)) {
          this._time.next(update);
        } else {
          this.stop();
        }
        if (this._opts.notifyFrameUpdate) {
          msg.time = time3;
          msg.frame = frame;
          this.emit(msg);
        }
      };
      if (!resume) this._time.start();
      this._time.next(update);
      this.emit({
        type: `genart:${resume ? "resume" : "start"}`,
        __self: true
      });
    }
    stop() {
      if (this._state !== "play") return;
      this.setState("stop");
      this.emit({ type: `genart:stop`, __self: true });
    }
    capture(el) {
      this._adapter?.capture(el);
      this.emit(
        { type: `genart:capture`, __self: true },
        "parent"
      );
    }
    setState(state, info) {
      this._state = state;
      this.emit({
        type: "genart:state-change",
        __self: true,
        state,
        info
      });
    }
    ensureParam(id) {
      ensureValidID(id);
      const spec = ensure2(
        ensure2(this._params, "no params defined")[id],
        `unknown param: ${id}`
      );
      return { spec, impl: this.ensureParamImpl(spec.type) };
    }
    ensureParamImpl(type) {
      ensureValidType(type);
      return ensure2(this._paramTypes[type], `unknown param type: ${type}`);
    }
    ensureNestedParam(param, key) {
      const spec = ensure2(
        this.ensureParamImpl(param.type).params?.[key],
        `param type '${param.type}' has no nested: ${key}`
      );
      return { spec, impl: this.ensureParamImpl(spec.type) };
    }
    waitFor(type) {
      return this[type] ? Promise.resolve() : new Promise((resolve) => {
        const check = () => {
          if (this[type]) resolve();
          else {
            setTimeout(check, 0);
          }
        };
        check();
      });
    }
    /**
     * Emits {@link ParamsMessage} message (only iff the params specs aren't
     * empty).
     */
    notifySetParams() {
      if (this._params && Object.keys(this._params).length) {
        this.emit({
          type: "genart:params",
          __self: true,
          params: this.asNestedParams({}, this._params)
        });
      }
    }
    notifyReady() {
      if (this._state === "init" && this._adapter && this._time && this._update)
        this.setState("ready");
    }
    notifyInfo() {
      const [time3, frame] = this._time.now();
      this.emit({
        type: "genart:info",
        opts: this._opts,
        state: this._state,
        version: this.version,
        adapter: this._adapter?.id,
        seed: this.random.seed,
        time: time3,
        frame
      });
    }
    /**
     * Returns true if this API instance is the likely recipient for a received
     * IPC message.
     *
     * @param event
     */
    isRecipient({ data }) {
      return data != null && typeof data === "object" && (data.apiID === this.id || data.apiID === "*");
    }
    asNestedParams(dest, src) {
      for (let id in src) {
        dest[id] = this.asNestedParam(src[id]);
      }
      return dest;
    }
    asNestedParam(param) {
      const dest = { ...param };
      const impl = this._paramTypes[param.type];
      if (impl.params) {
        dest.__params = this.asNestedParams({}, impl.params);
      }
      return dest;
    }
  };
  var ensureValidID = (id, kind = "ID") => ensure2(
    !(id === "__proto__" || id === "prototype" || id === "constructor"),
    `illegal param ${kind}: ${id}`
  );
  var ensureValidType = (type) => ensureValidID(type, "type");
  globalThis.$genart = new API();
})();
