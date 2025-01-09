# @genart-api/adapter-fxhash

[![npm version](https://img.shields.io/npm/v/@genart-api/adapter-fxhash.svg)](https://www.npmjs.com/package/@genart-api/adapter-fxhash)
![npm downloads](https://img.shields.io/npm/dm/@genart-api/adapter-fxhash.svg)
[![Mastodon Follow](https://img.shields.io/mastodon/follow/109331703950160316?domain=https%3A%2F%2Fmastodon.thi.ng&style=social)](https://mastodon.thi.ng/@toxi)

[GenArtAPI](https://github.com/thi-ng/genart-api/) platform adapter for the
[**fx(hash)**](https://fxhash.xyz) art platform.

See main [README](https://github.com/thi-ng/genart-api/blob/main/README.md) for
details.

## Usage

```bash
yarn add @genart-api/core @genart-api/adpater-fxhash

# create dest dir
mkdir -p lib

# copy files
cp node_modules/@genart-api/core/*.min.js lib
cp node_modules/@genart-api/adapter-fxhash/*.min.js lib
```

If you're a TypeScript user, you'll also want to add the `types` field in your
`tsconfig.json`:

tsconfig.json:

```json
{
	"compilerOptions": {
		"types": ["@genart-api/core", "@genart-api/adapter-fxhash"]
	}
}
```

In your HTML wrapper, add the following script tags to the `<head>` to load the
core `GenArtAPI` and the **EditArt** platform adapter:

```html
<script src="./lib/genart.min.js"></script>
<script src="./lib/adapter-fxhash.min.js"></script>
```

See [related
section](https://github.com/thi-ng/genart-api/blob/main/README.md#use-in-your-own-projects-an-artists-hello-world)
in main project README for more details...

Once running, you can then test your example in the fx(hash) sandbox:

https://www.fxhash.xyz/sandbox

You can also run locally using the [`fxhash` command line
tools](https://docs.fxhash.xyz/creating-on-fxhash/project-setup-and-development/cli-reference):

```bash
(cd myproject && npx fxhash dev)
```

## Parameter handling

### Type adaptations & conversions

> [!IMPORTANT]
> Parameter adaptation for different platforms is fully invisible to the artwork
> and no code changes need to be done in the artwork (which is the entire
> purpose of platform adapters in this system).

Because **fx(hash)** only supports a subset of the parameter types available in
`GenArtAPI`, only the following types can be used for projects intended for this
platform. Where possible, param types will be adapted. Params using any
unsupported types will be skipped (i.e. not exposed to **fx(hash)**) and will
only ever evaluate to their default values. When using such unsupported types,
the platform adapter will log a warning message in the browser console.

### Bigint

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#bigint-parameter)

Will be represented as a **fx(hash)** `bigint` parameter.

**Note**: fxhash only supports values in the `[-2^63, 2^63)` interval. A warning
will be written to the console, if the param's original value range is larger
than this (which it is by default)...

### Binary

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#binary-parameter)

Will be represented as a **fx(hash)** `bytes` parameter.

**Note**: Binary parameters in fxhash are not editable via the _fxlens_ UI.
Parameters of this type will be automatically adapted/redeclared with a
[`code-driven` update
behavior](https://docs.fxhash.xyz/creating-on-fxhash/fxhash-api/parameter-definition-specs#bytes)
as required by the platform.

### Choice

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#choice-parameter)

Will be represented as a **fx(hash)** `select` parameter.

**Note**: The _fxlens_ editor UI does not support value labels. The param will
be adapted to any strip `options` labels originally provided and the UI will
only display option values.

### Color

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#color-parameter)

Will be represented as a **fx(hash)** `color` parameter.

### Range

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#range-parameter)

Will be represented as a **fx(hash)** `number` parameter.

### Text

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#text-parameter)

Will be represented as a **fx(hash)** `string` parameter.

### Toggle

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#toggle-parameter)

Will be represented as a **fx(hash)** `boolean` parameter.

### Vector

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#vector-parameter)

Will be represented as multiple **fx(hash)** `number` parameters, one per vector
component.

> [!IMPORTANT]
> Your artwork will still use vectors as param value and the adapter
> automatically reconciles any changes done to any of the adapted params on the
> **fx(hash)** side.

For example, a 3D vector param will be represented (on **fx(hash)**'s side) as
three separate number params. When either of them are modified, this platform
adapter will apply the changes to the correct vector component/index and
propagate the changed vector value via the main `GenArtAPI` system.

### Weighted choice

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#weighted-choice-parameter)

Will be represented as a **fx(hash)** `select` parameter. Weights will be
ignored when randomizing the param in the **fx(hash)** UI.

### XY

[Reference](https://github.com/thi-ng/genart-api/blob/main/README.md#xy-parameter)

Similar to [vector params](#vector), XY params will also be represented as two
**fx(hash)** `number`s.

### Update behavior

This adapter translates param update behavior configuration to the settings used
by **fx(hash)**. Note that the **fx(hash)** default param update behavior is to
reload the page, whereas GenArtAPI's default is to emit an event only...

> [!IMPORTANT]
> There's an issue in the _fxlens_ editor UI, which doesn't trigger param change
> events when clicking the "randomize params" button. To not break user
> experience, it's recommended to declare at least one parameter with `update:
"reload"`...

## License

&copy; 2024 - 2025 Karsten Schmidt // MIT License
