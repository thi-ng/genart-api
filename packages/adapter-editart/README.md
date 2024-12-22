# @genart-api/adapter-editart

[GenArtAPI](https://github.com/thi-ng/genart-api/) platform adapter for the
[editart.xyz](https://editart.xyz) art platform.

See main [README](https://github.com/thi-ng/genart-api/blob/main/README.md) for
details.

## Usage

```bash
yarn add @genart-api/core @genart-api/adpater-editart

# create dest dir
mkdir -p lib

# copy files
cp node_modules/@genart-api/core/*.min.js lib
cp node_modules/@genart-api/adapter-editart/*.min.js lib
```

If you're a TypeScript user, you'll also want to add the `types` field in your
`tsconfig.json`:

tsconfig.json:

```json
{
	"compilerOptions": {
		"types": ["@genart-api/core", "@genart-api/adapter-editart"]
	}
}
```

In your HTML wrapper, add the following script tags to the `<head>` to load the
core `GenArtAPI` and the **EditArt** platform adapter:

```html
<script src="./lib/genart.min.js"></script>
<script src="./lib/adapter-editart.min.js"></script>
```

See [related
section](https://github.com/thi-ng/genart-api/blob/main/README.md#use-in-your-own-projects-an-artists-hello-world)
in main project README for more details...

Once running, you can then test your example in the EditArt sandbox:

https://www.editart.xyz/sandbox

## Parameter handling

### Type adaptations & conversions

> [!IMPORTANT]
> Parameter adaptation for different platforms is fully invisible to the artwork
> and no code changes need to be done in the artwork (which is the entire
> purpose of platform adapters in this system).

Because **EditArt** only supports at most 5 number parameters (with slider
controls), only the following `GenArtAPI` param types can be used for projects
intended for this platform. Where possible, types will be adapted, and even
though the **EditArt** param UI controls will only ever be sliders, your artwork
remain independent from these platform constraints and can still use the
original param type intended (e.g. a [choice
param](https://github.com/thi-ng/genart-api/blob/main/README.md#choice-parameter)).

Params using other types will be ignored and will only ever evaluate to their
assigned (or randomized) default values. When using such unsupported types, the
platform adapter will log a warning message in the browser console.

-   [Choice](https://github.com/thi-ng/genart-api/blob/main/README.md#choice-parameter)
-   [Range](https://github.com/thi-ng/genart-api/blob/main/README.md#range-parameter)
-   [Toggle](https://github.com/thi-ng/genart-api/blob/main/README.md#toggle-parameter)
-   [Weighted choice](https://github.com/thi-ng/genart-api/blob/main/README.md#weighted-choice-parameter)

### Selection

This platform adapter only considers parameters with [non-private `.edit`
permissions](https://docs.thi.ng/genart-api/core/interfaces/ParamOpts.html#edit).

### Ordering

To ensure deterministic mapping between the 5 param values exposed by the
**EditArt** platform and the params defined by the artwork, the platform adpater
uses the following approach:

-   All non-eligible params (with unsupported types) are ignored (see [earlier
    section](#type-adaptations--conversions))
-   Declared params are sorted by their specified
    [`.order`](https://docs.thi.ng/genart-api/core/interfaces/ParamOpts.html#order)
    as primary sort key and then by their ID as secondary sort key
-   Only the first max. 5 of the sorted parameters are used (mapped to
    **EditArt**'s `m0`...`m4` params).

### Update behavior

**EditArt** doesn't support the concept of live adjustable params and any param
change always triggers a full restart of the artwork.

## License

&copy; 2024 Karsten Schmidt // MIT License
