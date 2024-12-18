"use strict";
(() => {
  // src/index.ts
  var TYPE_MAP = {
    choice: "LIST",
    color: "COLOR",
    range: "NUMBER",
    toggle: "BOOLEAN",
    text: "HASH",
    vector: "NUMBER",
    xy: "NUMBER"
  };
  var { equiv, isString } = $genart.utils;
  var LayerAdapter = class {
    mode = "play";
    params;
    cache = {};
    adaptations = {};
    timeoutID;
    constructor() {
      $layer.debug = true;
      $genart.on(
        "genart:state-change",
        ({ state }) => state === "ready" && !$layer.controlled && $genart.start()
      );
      window.addEventListener("layer:play", () => {
        if ($genart.state === "ready" || $genart.state === "stop") {
          $genart.start($genart.state === "stop");
        }
      });
      window.addEventListener("layer:pause", () => $genart.stop());
      window.addEventListener("layer:paramchange", (e) => {
        let { id, value } = e.detail;
        const adaptedParam = this.adaptations[id];
        if (adaptedParam) {
          id = adaptedParam.id;
          value = adaptedParam.adapt(value);
        }
        const param = this.params?.[id];
        if (!param) {
          console.warn(
            `${this.id}: ignoring change for unknown param: ${id}...`
          );
          return;
        }
        if (equiv(this.cache[id], value)) return;
        this.cache[id] = value;
        if (param.update !== "reload") {
          $genart.setParamValue(id, value);
        }
      });
      window.addEventListener("layer:dimensionschange", (e) => {
        $genart.emit({
          type: "genart:resize",
          screen: { ...e.detail, dpr: 1 }
        });
      });
    }
    get id() {
      return "@genart-api/adapter-layer";
    }
    get screen() {
      return {
        width: $layer.width,
        height: $layer.height,
        dpr: 1
      };
    }
    get prng() {
      return {
        seed: $layer.uuid,
        rnd: $layer.prng,
        reset: () => $layer.prng
      };
    }
    async updateParam(id, _) {
      let value;
      if (Object.values(this.adaptations).find((x) => x.id === id)) {
        value = this.cache[id];
        return { value };
      } else {
        value = $layer.parameters[id];
      }
      if (value == null || equiv(this.cache[id], value)) return;
      this.cache[id] = value;
      return { value };
    }
    async initParams(params) {
      this.params = params;
      const layerParams = [];
      for (let id in params) {
        const src = params[id];
        const kind = TYPE_MAP[src.type];
        if (!kind) {
          console.warn(
            `${this.id}: unsupported type:`,
            src.type,
            " for param:",
            id,
            ", skipping..."
          );
          continue;
        }
        const dest = {
          id,
          kind,
          name: src.name || id,
          description: src.desc + (src.update === "reload" ? " (requires reload)" : ""),
          default: src.default,
          customization_level: src.edit === "private" ? "ARTIST" : src.edit === "public" ? "VIEWER" : "CURATOR"
        };
        layerParams.push(dest);
        this.cache[id] = src.default;
        switch (src.type) {
          case "choice": {
            const $src = src;
            const $dest = dest;
            $dest.options = $src.options.map(
              (x) => Array.isArray(x) ? { value: x[0], label: x[1] } : { value: x, label: x }
            );
            break;
          }
          case "color": {
            this.adaptations[id] = {
              id,
              adapt: (x) => isString(x) ? x : x.hex
            };
            break;
          }
          case "range": {
            const $src = src;
            const $dest = dest;
            $dest.min = $src.min;
            $dest.max = $src.max;
            $dest.step = $src.step;
            break;
          }
          case "text": {
            const $src = src;
            const $dest = dest;
            $dest.minLength = $src.min;
            $dest.maxLength = $src.max;
            const pattern = $src.match instanceof RegExp ? $src.match.source : $src.match;
            switch (pattern) {
              case "^[0-9a-f]+$":
              case "^[0-9a-fA-F]+$":
                $dest.pattern = "HEX";
                break;
              case "^[a-zA-Z0-9-_=]+$":
                $dest.pattern = "BASE64";
                break;
              case "^[a-zA-Z ]+$":
                $dest.pattern = "ALPHABETICAL";
                break;
              case "^[a-zA-Z0-9-_ ]+$":
                $dest.pattern = "ALPHANUMERIC";
                break;
              default:
                console.warn(
                  `${this.id}: couldn't determine pattern type for param:`,
                  id,
                  ", using 'ALPHANUMERIC'..."
                );
                $dest.pattern = "ALPHANUMERIC";
            }
            break;
          }
          case "vector": {
            layerParams.pop();
            const $src = src;
            const dim = $src.dim;
            const labels = $src.labels;
            for (let j = 0; j < dim; j++) {
              const $dest = { ...dest };
              $dest.id = id + "__" + labels[j];
              $dest.name = $src.name + ` (${labels[j]})`;
              $dest.min = $src.min[j];
              $dest.max = $src.max[j];
              $dest.step = $src.step[j];
              if ($src.default) $dest.default = $src.default[j];
              layerParams.push($dest);
              this.adaptations[$dest.id] = this.adaptVectorParam(
                id,
                j
              );
            }
            break;
          }
          case "xy": {
            layerParams.pop();
            const labels = "xy";
            const $src = src;
            for (let j = 0; j < 2; j++) {
              const $dest = { ...dest };
              $dest.id = id + "__" + labels[j];
              $dest.name = $src.name + ` (${labels[j]})`;
              $dest.min = 0;
              $dest.max = 1;
              $dest.step = 1e-3;
              if ($src.default) $dest.default = $src.default[j];
              layerParams.push($dest);
              this.adaptations[$dest.id] = this.adaptVectorParam(
                id,
                j
              );
            }
          }
        }
      }
      const paramValues = await $layer.params(...layerParams);
      for (let [id, value] of Object.entries(paramValues)) {
        const adaptedParam = this.adaptations[id];
        if (adaptedParam) {
          this.cache[adaptedParam.id] = adaptedParam.adapt(value);
        }
      }
    }
    setTraits() {
    }
    capture(canvas) {
      $layer.registerCanvas(canvas);
    }
    adaptVectorParam(id, idx) {
      return {
        id,
        adapt: (x) => {
          const value = this.cache[id].slice();
          value[idx] = x;
          return value;
        }
      };
    }
  };
  $genart.setAdapter(new LayerAdapter());
})();
