# @genart-api/time-fps-overlay

[GenArtAPI](https://github.com/thi-ng/genart-api/) time provider for development
purposes, which collects FPS samples and injects a canvas overlay to visualize
recent frame rates and compute moving averages. The visualization can be
configured via [provided
options](https://github.com/thi-ng/genart-api/blob/main/packages/time-fps-overlay/src/index.ts).

See main
[README](https://github.com/thi-ng/genart-api/blob/main/README.md#time-providers)
for details.

## Usage

```bash
yarn add @genart-api/time-fps-overlay

# create dest dir
mkdir -p lib

# copy files
cp node_modules/@genart-api/time-fps-overlay/*.min.js lib
```

In your HTML wrapper, add the following script tags to the `<head>` to load the
core `GenArtAPI` and the **Layer** platform adapter:

```html
<script src="./lib/genart.min.js"></script>
<script src="./lib/time-fps-overlay.min.js"></script>
<script>
	$genart.setTimeProvider(timeProviderOverlay({}));
</script>
```

## License

&copy; 2024 - 2025 Karsten Schmidt // MIT License
