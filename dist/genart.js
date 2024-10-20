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

  // src/params.ts
  var params_exports = {};
  __export(params_exports, {
    choice: () => choice,
    color: () => color,
    date: () => date,
    datetime: () => datetime,
    image: () => image,
    numlist: () => numlist,
    ramp: () => ramp,
    range: () => range,
    strlist: () => strlist,
    text: () => text,
    time: () => time,
    toggle: () => toggle,
    weighted: () => weighted,
    xy: () => xy
  });
  var $ = (type, spec, randomize = true) => ({
    type,
    state: "void",
    randomize,
    ...spec
  });
  var choice = (spec) => $("choice", spec);
  var color = (spec) => $("color", spec);
  var datetime = (spec) => $("datetime", spec, false);
  var date = (spec) => $("date", spec, false);
  var image = (spec) => $(
    "img",
    {
      default: spec.default || new Uint8Array(spec.width * spec.height),
      ...spec
    },
    false
  );
  var numlist = (spec) => $(
    "numlist",
    {
      default: [],
      ...spec
    },
    false
  );
  var ramp = (spec) => $(
    "ramp",
    {
      name: spec.name,
      desc: spec.desc,
      doc: spec.doc,
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
  var strlist = (spec) => $(
    "strlist",
    {
      default: [],
      ...spec
    },
    false
  );
  var text = (spec) => $("text", spec, false);
  var time = (spec) => $("time", spec);
  var toggle = (spec) => $("toggle", spec);
  var weighted = (spec) => $("weighted", {
    ...spec,
    options: spec.options.sort((a, b) => b[0] - a[0]),
    total: spec.options.reduce((acc, x) => acc + x[0], 0)
  });
  var xy = (spec) => $("xy", spec);

  // src/time/offline.ts
  var timeProviderOffline = (frameDelay = 250, referenceFPS = 60, frameOffset = 0) => {
    let frame = frameOffset;
    const frameTime = 1e3 / referenceFPS;
    return {
      start() {
        frame = frameOffset;
      },
      next(fn) {
        setTimeout(fn, frameDelay);
      },
      now() {
        return [frame * frameTime, frame];
      },
      tick() {
        return [++frame * frameTime, frame];
      }
    };
  };

  // src/time/raf.ts
  var timeProviderRAF = (timeOffset = 0, frameOffset = 0) => {
    let t0 = performance.now();
    let frame = frameOffset;
    let now = timeOffset;
    return {
      start() {
        t0 = performance.now();
        frame = frameOffset;
      },
      next(fn) {
        requestAnimationFrame(fn);
      },
      now() {
        return [now, frame];
      },
      tick() {
        return [now = timeOffset + performance.now() - t0, ++frame];
      }
    };
  };

  // src/utils.ts
  var utils_exports = {};
  __export(utils_exports, {
    formatValuePrec: () => formatValuePrec,
    isNumber: () => isNumber,
    isNumericArray: () => isNumericArray,
    isString: () => isString,
    isTypedArray: () => isTypedArray,
    u16: () => u16,
    u24: () => u24,
    u32: () => u32,
    u8: () => u8,
    valuePrec: () => valuePrec
  });
  var isNumber = (x) => typeof x === "number" && !isNaN(x);
  var isString = (x) => typeof x === "string";
  var isNumericArray = (x) => isTypedArray(x) || Array.isArray(x) && x.every(isNumber);
  var isTypedArray = (x) => !!x && (x instanceof Float32Array || x instanceof Float64Array || x instanceof Uint32Array || x instanceof Int32Array || x instanceof Uint8Array || x instanceof Int8Array || x instanceof Uint16Array || x instanceof Int16Array || x instanceof Uint8ClampedArray);
  var u8 = (x) => (x &= 255, (x < 16 ? "0" : "") + x.toString(16));
  var u16 = (x) => u8(x >>> 8) + u8(x);
  var u24 = (x) => u16(x >>> 8) + u8(x & 255);
  var u32 = (x) => u16(x >>> 16) + u16(x);
  var valuePrec = (step) => {
    const str = step.toString();
    const i = str.indexOf(".");
    return i > 0 ? str.length - i - 1 : 0;
  };
  var formatValuePrec = (step) => {
    const prec = valuePrec(step);
    return (x) => x.toFixed(prec);
  };

  // src/index.ts
  var { isNumber: isNumber2, isString: isString2, isNumericArray: isNumericArray2 } = utils_exports;
  var { clamp: clamp2, clamp01: clamp012, mix: mix2, norm: norm2, round: round2, parseNum: parseNum2 } = math_exports;
  var API = class {
    // auto-generated instance ID
    id = Math.floor(Math.random() * 1e12).toString(36);
    _adapter;
    _time = timeProviderRAF();
    _prng;
    _update;
    _state = "init";
    _traits;
    _params;
    _paramTypes = {
      choice: {
        validate: (spec, value) => !!spec.options.find(
          (x) => (Array.isArray(x) ? x[0] : x) === value
        ),
        randomize: (spec, rnd) => {
          const opts = spec.options;
          const value = opts[rnd() * opts.length | 0];
          return Array.isArray(value) ? value[0] : value;
        }
      },
      color: {
        validate: (_, value) => isString2(value) && /^#?[0-9a-f]{6}$/.test(value),
        coerce: (_, value) => value[0] !== "#" ? "#" + value : value,
        randomize: (_, rnd) => "#" + u24(rnd() * 16777216 | 0)
      },
      date: {
        validate: (_, value) => value instanceof Date || isNumber2(value) || isString2(value) && /^\d{4}-\d{2}-\d{2}$/.test(value),
        coerce: (_, value) => isNumber2(value) ? new Date(value) : isString2(value) ? new Date(Date.parse(value)) : value
      },
      datetime: {
        validate: (_, value) => value instanceof Date || isNumber2(value) || isString2(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[-+]\d{2}:\d{2})$/.test(
          value
        ),
        coerce: (_, value) => isNumber2(value) ? new Date(value) : isString2(value) ? new Date(Date.parse(value)) : value
      },
      img: {
        validate: (spec, value) => {
          const { width, height } = spec;
          return isNumericArray2(value) && value.length == width * height;
        }
      },
      numlist: {
        validate: (_, value) => isNumericArray2(value)
      },
      ramp: {
        validate: () => false,
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
            exp: () => mix2(av, bv, easeInOut5(norm2(t, at, bt))),
            linear: () => fit(t, at, bt, av, bv),
            smooth: () => mix2(av, bv, smoothstep01(norm2(t, at, bt)))
          }[mode || "linear"]();
        },
        params: {
          stops: numlist({
            name: "Ramp stops",
            desc: "Control points",
            default: []
          }),
          mode: choice({
            name: "Ramp mode",
            desc: "Interpolation method",
            options: ["linear", "smooth", "exp"]
          })
        }
      },
      range: {
        validate: (spec, value) => {
          const { min, max } = spec;
          return isNumber2(value) && value >= min && value <= max;
        },
        coerce: (spec, value) => {
          const $spec = spec;
          return clamp2(
            round2(value ?? $spec.default, $spec.step || 1),
            $spec.min,
            $spec.max
          );
        },
        randomize: (spec, rnd) => {
          const { min, max, step } = spec;
          return clamp2(round2(mix2(min, max, rnd()), step || 1), min, max);
        }
      },
      strlist: {
        validate: (_, value) => Array.isArray(value) && value.every(isString2)
      },
      text: {
        validate: (spec, value) => {
          if (!isString2(value)) return false;
          const { min, max, match } = spec;
          if (match) {
            const regexp = isString2(match) ? new RegExp(match) : match;
            if (!regexp.test(value)) return false;
          }
          return (!min || value.length >= min) && (!max || value.length <= max);
        }
      },
      time: {
        validate: (_, value) => isNumericArray2(value) || isString2(value) && /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value),
        coerce: (_, value) => isString2(value) ? value.split(":").map(parseNum2) : value,
        randomize: (_, rnd) => [
          rnd() * 24 | 0,
          rnd() * 60 | 0,
          rnd() * 24 | 0
        ]
      },
      toggle: {
        validate: (_, value) => isString2(value) ? /^(true|false|0|1)$/.test(value) : isNumber2(value) || typeof value === "boolean",
        coerce: (_, value) => value === "true" || value === "1" ? true : value === "false" || value === "0" ? false : !!value,
        randomize: (_, rnd) => rnd() < 0.5
      },
      weighted: {
        validate: (spec, value) => !!spec.options.find(
          (x) => x[1] === value
        ),
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
      },
      xy: {
        validate: (_, value) => isNumericArray2(value) && value.length == 2,
        coerce: (_, value) => [clamp012(value[0]), clamp012(value[1])],
        randomize: (_, rnd) => [rnd(), rnd()]
      }
    };
    math = math_exports;
    params = params_exports;
    utils = utils_exports;
    time = {
      raf: timeProviderRAF,
      offline: timeProviderOffline
    };
    constructor() {
      window.addEventListener("message", (e) => {
        const data = e.data;
        if (!this.isRecipient(e) || data?.__self) return;
        switch (data.type) {
          case "genart:start":
            this.start();
            break;
          case "genart:resume":
            this.start(true);
            break;
          case "genart:stop":
            this.stop();
            break;
          case "genart:setparamvalue":
            this.setParamValue(data.paramID, data.value, data.key);
            break;
          case "genart:randomizeparam":
            this.randomizeParamValue(data.paramID, data.key);
        }
      });
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
      return this._prng = this.ensureAdapter().prng;
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
      if (this._paramTypes[type])
        console.warn("overriding impl for param type:", type);
      this._paramTypes[type] = impl;
    }
    paramType(type) {
      return this._paramTypes[type];
    }
    async setParams(params) {
      if (this._adapter?.setParams) {
        try {
          params = await this._adapter.setParams(params);
        } catch (e) {
          this.setState("error", e.message);
          throw e;
        }
      }
      for (let id in params) {
        const param = params[id];
        if (param.default == null) {
          const impl = this.ensureParamImpl(param.type);
          if (impl.randomize) {
            param.default = impl.randomize(param, this.random.rnd);
            param.state = "random";
          } else if (impl.read) {
            param.state = "dynamic";
          } else {
            throw new Error(`missing default value for param: ${id}`);
          }
        } else {
          param.state = "default";
        }
      }
      this._params = params;
      if (this._adapter) {
        await this.updateParams();
      }
      this.notifySetParams();
      return (id, t, rnd) => this.getParamValue(id, t, rnd);
    }
    setTraits(traits) {
      this._traits = traits;
      this.emit({ type: "genart:settraits", traits });
    }
    async setAdapter(adapter) {
      console.log("set adapter", adapter);
      this._adapter = adapter;
      if (this._params) {
        await this._adapter.setParams?.(this._params);
        await this.updateParams();
        this.notifySetParams();
      }
      this.notifyReady();
    }
    waitForAdapter() {
      return this.waitFor("_adapter");
    }
    setTimeProvider(time2) {
      this._time = time2;
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
          type: "genart:paramchange",
          param: this.asNestedParam(spec),
          paramID: id,
          key,
          __self: true
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
    getParamValue(id, t = 0, rnd) {
      const {
        spec,
        impl: { randomize, read }
      } = this.ensureParam(id);
      return rnd && randomize ? randomize(spec, rnd) : read ? read(spec, t) : spec.value ?? spec.default;
    }
    paramError(paramID) {
      this.emit({ type: "genart:paramerror", paramID });
    }
    on(type, listener) {
      window.addEventListener("message", (e) => {
        if (this.isRecipient(e) && e.data?.type === type) listener(e.data);
      });
    }
    emit(e, notify = "all") {
      if (notify === "none") return;
      e.apiID = this.id;
      if (notify === "all" || notify === "self") window.postMessage(e, "*");
      if (notify === "all" && parent !== window || notify === "parent")
        parent.postMessage(e, "*");
    }
    start(resume = false) {
      if (this._state == "play") return;
      if (this._state !== "ready" && this._state !== "stop")
        throw new Error(`can't start in state: ${this._state}`);
      this.setState("play");
      let isFirst = !resume;
      const msg = {
        type: "genart:frame",
        apiID: this.id,
        time: 0,
        frame: 0
      };
      const update = () => {
        if (this._state != "play") return;
        const timing = this._time[isFirst ? "now" : "tick"]();
        if (this._update.call(null, ...timing)) {
          this._time.next(update);
        } else {
          this.stop();
        }
        msg.time = timing[0];
        msg.frame = timing[1];
        this.emit(msg);
        isFirst = false;
      };
      if (!resume) this._time.start();
      update();
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
      this.emit({ type: `genart:capture`, __self: true }, "parent");
    }
    setState(newState, info) {
      this._state = newState;
      this.emit({
        type: "genart:statechange",
        state: newState,
        __self: true,
        info
      });
    }
    ensureAdapter() {
      if (!this._adapter) throw new Error("missing platform adapter");
      return this._adapter;
    }
    ensureTimeProvider() {
      if (!this._time) throw new Error("missing time provider");
      return this._time;
    }
    ensureParams() {
      if (!this._params) throw new Error("no params defined");
      return this._params;
    }
    ensureParam(id) {
      const spec = this.ensureParams()[id];
      if (!spec) throw new Error(`unknown param: ${id}`);
      const impl = this.ensureParamImpl(spec.type);
      return { spec, impl };
    }
    ensureParamImpl(type) {
      const impl = this._paramTypes[type];
      if (!impl) throw new Error(`unknown param type: ${type}`);
      return impl;
    }
    ensureNestedParam(param, key) {
      const impl = this.ensureParamImpl(param.type);
      const spec = impl.params?.[key];
      if (!spec)
        throw new Error(`param type '${param.type}' has no nested: ${key}`);
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
     * Emits {@link SetParamsMsg} message (only iff the params specs aren't
     * empty).
     */
    notifySetParams() {
      if (this._params && Object.keys(this._params).length) {
        this.emit({
          type: "genart:setparams",
          params: this.asNestedParams({}, this._params),
          __self: true
        });
      }
    }
    notifyReady() {
      if (this._state === "init" && this._adapter && this._time && this._update)
        this.setState("ready");
    }
    /**
     * Returns true if this API instance is the likely recipient for a received
     * IPC message.
     *
     * @param event
     */
    isRecipient({ data }) {
      return data != null && typeof data === "object" && (!this.id || this.id === data.apiID);
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
  globalThis.$genart = new API();
})();
