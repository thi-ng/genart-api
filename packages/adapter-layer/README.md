# @genart-api/adapter-layer

[GenArtAPI](https://github.com/thi-ng/genart-api/) platform adapter for the
[Layer](https://layer.com) art platform.

See main [README](https://github.com/thi-ng/genart-api/blob/main/README.md) for
details.

## Usage

```bash
yarn add @genart-api/core @genart-api/adpater-layer

# create dest dir
mkdir -p lib

# copy files
cp node_modules/@genart-api/core/*.min.js lib
cp node_modules/@genart-api/adapter-layer/*.min.js lib
```

If you're a TypeScript user, you'll also want to add the `types` field in your
`tsconfig.json`:

tsconfig.json:

```json
{
	"compilerOptions": {
		"types": ["@genart-api/core", "@genart-api/adapter-layer"]
	}
}
```

In your HTML wrapper, add the following script tags to the `<head>` to load the
core `GenArtAPI` and the **Layer** platform adapter:

```html
<script src="./lib/genart.min.js"></script>
<script src="./lib/adapter-layer.min.js"></script>
```

See [related
section](https://github.com/thi-ng/genart-api/blob/main/README.md#use-in-your-own-projects-an-artists-hello-world)
in main project README for more details...

## Parameter type adaptations & conversions

> [!IMPORTANT]
> Parameter adaptation for different platforms is fully invisible to the artwork
> and no code changes need to be done in the artwork (which is the entire
> purpose of platform adapters in this system).

Because **Layer** only supports a small subset of the parameter types available in
`GenArtAPI`, only the following types can be used for projects intended for this
platform. Some param types will be adapted where possible. Params using other types will
be skipped (i.e. not exposed to **Layer**) and will only ever evaluate to their
default values. When using such unsupported types, the platform adapter will log
a warning message in the browser console.

### Choice

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#choice-parameter)

Will be represented as a **Layer** `ListParameter`.

### Color

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#color-parameter)

Will be represented as a **Layer** `ColorParameter`.

### Range

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#range-parameter)

Will be represented as a **Layer** `NumberParameter`.

### Text

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#text-parameter)

Will be represented as a **Layer** `HashParameter`. If a
[`.match`](https://docs.thi.ng/genart-api/core/interfaces/TextParam.html#match)
option is defined in the original param spec, it will be converted as follows:

| **Regexp**          | **Layer Pattern ID** |
| ------------------- | -------------------- |
| `^[a-zA-Z ]+$`      | `"ALPHABETICAL"`     |
| `^[a-zA-Z0-9-_ ]+$` | `"ALPHANUMERIC"`     |
| `^[a-zA-Z0-9-_=]+$` | `"BASE64"`           |
| `^[0-9a-f]+$`       | `"HEX"`              |
| `^[0-9a-fA-F]+$`    | `"HEX"`              |

Any other patterns (or if unspecified) will default to the **Layer** target
`"ALPHANUMERIC"` pattern.

### Toggle

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#toggle-parameter)

Will be represented as a **Layer** `BooleanParameter`.

### Vector

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#vector-parameter)

Will be represented as multiple **Layer** `NumberParameter`s, one per vector
component.

> [!IMPORTANT]
> Your artwork will still use vectors as param value and the adapter
> automatically reconciles any changes done to any of the adapted params on the
> **Layer** side.

For example, a 3D vector param will be represented (on **Layer**'s side) as
three separate number params. When either of them are modified, this platform
adapter will apply the changes to the correct vector component/index and
propagate the changed vector via the main `GenArtAPI` system.

### Weighted choice

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#weighted-choice-parameter)

Will be represented as a **Layer** `ListParameter`. Weights will be ignored when
randomizing the param in the **Layer** GenStudio UI.

### XY

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#xy-parameter)

Similar to [vector params](#vector), XY params will also be represented as two
**Layer** `NumberParameter`s.

## License

&copy; 2024 Karsten Schmidt // MIT License
