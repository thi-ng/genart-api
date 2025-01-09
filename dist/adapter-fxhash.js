"use strict";
(() => {
  // src/index.ts
  var TYPE_MAP = {
    bigint: "bigint",
    binary: "bytes",
    choice: "select",
    color: "color",
    range: "number",
    toggle: "boolean",
    text: "string",
    vector: "number",
    weighted: "select",
    xy: "number"
  };
  var UPDATE_MAP = {
    reload: "page-reload",
    event: "sync"
  };
  var {
    prng: { defPRNG, sfc32 },
    utils: { equiv, isString, hashString }
  } = $genart;
  var BIGINT_MAX = 2n ** 63n;
  var FxhashAdapter = class {
    _searchParams;
    _params;
    _cache = {};
    _adaptations = {};
    _prng;
    _screen;
    constructor() {
      this._searchParams = new URLSearchParams(location.search);
      this._screen = this.screen;
      $genart.on("genart:state-change", ({ state }) => {
        if (state === "ready") $genart.start();
      });
      $fx.on(
        "params:update",
        () => true,
        (_, rawParam) => {
          let [id, value] = Object.entries(rawParam)[0];
          const adaptedParam = this._adaptations[id];
          if (adaptedParam) {
            id = adaptedParam.id;
            value = adaptedParam.adapt(value);
          }
          const param = this._params?.[id];
          if (!param) {
            this.warn(`ignoring change for unknown param: ${id}...`);
            return false;
          }
          if (equiv(this._cache[id], value)) return false;
          this._cache[id] = value;
          if (param.update !== "reload") {
            $genart.setParamValue(id, value);
          } else {
            location.reload();
          }
          return true;
        }
      );
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
      return "@genart-api/adapter-fxhash";
    }
    get mode() {
      return {
        standalone: "play",
        capture: "preview",
        minting: "edit"
      }[$fx.context];
    }
    get screen() {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1
      };
    }
    get prng() {
      return this._prng || (this._prng = defPRNG($fx.hash, hashString($fx.hash), sfc32));
    }
    get collector() {
      return $fx.minter;
    }
    get iteration() {
      return $fx.iteration;
    }
    configure(_) {
    }
    async updateParam(id, _) {
      let value;
      if (Object.values(this._adaptations).find((x) => x.id === id)) {
        value = this._cache[id];
        return { value };
      } else {
        value = $fx.getParam(id);
      }
      console.log(
        `${this.id}:`,
        id,
        "new value",
        value,
        "cached",
        this._cache[id]
      );
      if (value == null || equiv(this._cache[id], value)) return;
      this._cache[id] = value;
      return { value };
    }
    async initParams(params) {
      this._params = params;
      const fxParams = [];
      for (let id in params) {
        const src = params[id];
        const type = TYPE_MAP[src.type];
        if (!type) {
          this.warn(
            `unsupported type '${src.type}' for param id: ${id}, skipping...`
          );
          continue;
        }
        const dest = {
          id,
          name: src.name,
          type,
          default: src.default,
          update: UPDATE_MAP[src.update]
        };
        fxParams.push(dest);
        this._cache[id] = src.default;
        switch (src.type) {
          case "bigint": {
            const { min, max } = src;
            if (min < -BIGINT_MAX || max >= BIGINT_MAX) {
              this.warn(`value range out of bounds for param: ${id}`);
            }
            dest.options = { min, max };
            break;
          }
          case "binary": {
            const { maxLength } = src;
            dest.update = "code-driven";
            dest.options = { length: maxLength };
            break;
          }
          case "choice": {
            const { options } = src;
            dest.options = {
              options: options.map((x) => isString(x) ? x : x[0])
            };
            break;
          }
          case "color": {
            this._adaptations[id] = {
              id,
              adapt: (x) => isString(x) ? x : x.hex.rgb
            };
            if (dest.default) dest.default = dest.default.substring(1);
            break;
          }
          case "range": {
            const { min, max, step } = src;
            dest.options = { min, max, step };
            break;
          }
          case "text": {
            const { minLength, maxLength } = src;
            dest.options = { minLength, maxLength };
            break;
          }
          case "vector": {
            fxParams.pop();
            const $src = src;
            const size = $src.size;
            const labels = $src.labels;
            for (let j = 0; j < size; j++) {
              const $dest = { ...dest };
              $dest.id = id + "__" + labels[j];
              $dest.name = $src.name + ` (${labels[j]})`;
              $dest.options = {
                min: $src.min[j],
                max: $src.max[j],
                step: $src.step[j]
              };
              if ($src.default) $dest.default = $src.default[j];
              fxParams.push($dest);
              this._adaptations[$dest.id] = this.adaptVectorParam(
                id,
                j
              );
            }
            break;
          }
          case "weighted": {
            const { options } = src;
            dest.options = { options: options.map((x) => x[1]) };
            break;
          }
          case "xy": {
            fxParams.pop();
            const labels = "XY";
            const $src = src;
            for (let j = 0; j < 2; j++) {
              const $dest = { ...dest };
              $dest.id = id + "__" + labels[j];
              $dest.name = $src.name + ` (${labels[j]})`;
              $dest.options = { min: 0, max: 1, step: 1e-3 };
              if ($src.default) $dest.default = $src.default[j];
              fxParams.push($dest);
              this._adaptations[$dest.id] = this.adaptVectorParam(
                id,
                j
              );
            }
          }
        }
      }
      $fx.params(fxParams);
      for (let [id, adaptedParam] of Object.entries(this._adaptations)) {
        const value = $fx.getParam(id);
        if (value != null) {
          this._cache[adaptedParam.id] = adaptedParam.adapt(value);
        }
      }
    }
    setTraits(traits) {
      $fx.features(traits);
    }
    capture(_) {
      $fx.preview();
    }
    reload() {
      console.log(
        `${this.id} reloading with new params:`,
        this._searchParams.toString()
      );
      location.search = this._searchParams.toString();
    }
    adaptVectorParam(id, idx) {
      return {
        id,
        adapt: (x) => {
          const value = this._cache[id].slice();
          value[idx] = x;
          return value;
        }
      };
    }
    warn(msg, ...args) {
      console.warn(`${this.id}:`, msg, ...args);
    }
  };
  $genart.setAdapter(new FxhashAdapter());
})();
