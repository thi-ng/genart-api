# genart-api Zig/WASM test

[Live demo with editor](https://demo.thi.ng/genart-api/param-editors/?url=https://demo.thi.ng/genart-api/zig-test/)

This basic example is used as test bed for the work-in-progress [Zig &
WebAssembly API bindings](../../packages/wasm/) of the otherwise
JavaScript-based GenArt API workflow/setup. This integration is designed as a
module for the [thi.ng/wasm-api](https://thi.ng/wasm-api) toolchain, and
includes polyglot bindings code for both Zig & TypeScript.

## Launching & building

Please ensure you have Zig v0.13.x and the
[Binaryen](https://github.com/WebAssembly/binaryen) WASM toolchain installed,
both of which are required for building this project.

> [!IMPORTANT]
> Before running this example, make sure you first build the actual GenArt API
> files.

```bash
# Starting in the repo root directory...

# install typescript etc.
yarn install

# build all packages
yarn build

# switch to this example & install dependencies
cd examples/zig-test

# run vite dev server
yarn start

# create production build bundle
yarn build
```

### Use with param editor

To use this example with a param editor, you can either use the [online param
editor](https://demo.thi.ng/genart-api/param-editors/) or you'll need to run
both locally at the same time. The easiest way to do so is to launch them from
two separate terminals, like so:

```bash
# from the genart-api repo root

(cd examples/zig-test && yarn start)

# this should open the example in the browser, but you can close that window again...

########

# in a second terminal...
(cd examples/param-editors && yarn start)

# this also should open the param editor in the browser
```

The param-editor is configured to run @ http://localhost:8080/, whereas the
example is served from a different port: http://localhost:5173/. Paste this
latter URL into the `Art URL` input field of the editor and press enter to load
the new example. Then select an editor implementation from the dropdown menu to
start configuring the parameters...

## License

&copy; 2024 - 2025 Karsten Schmidt // MIT license
