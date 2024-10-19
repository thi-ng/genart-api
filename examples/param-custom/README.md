# genart-api custom parameter example

[Pre-built live demo with editor](https://demo.thi.ng/genart-api/param-editors/?url=https://demo.thi.ng/genart-api/param-custom/)

This example defines a custom parameter type (a configurable oscillator) and
should be used in combination with the [parameter editor
example](https://github.com/thi-ng/genart-api/tree/main/examples/param-editors)
to enable interactive configuration of all the parameters used.

## Launching & building

> [!IMPORTANT]
> Before running this example, make sure you first build the actual GenArt API
> files.

```bash
# Starting in the repo root directory...

# install typescript etc.
yarn install

# build API files
yarn build

# switch to this example
cd examples/param-custom
yarn install

# run vite dev server
yarn start

# or create production build bundle
yarn build
```

### Use with param editor

To use this example with a param editor, you can either use the [online param
editor](https://demo.thi.ng/genart-api/param-editors/)
or you'll need to run both locally at the same time. The easiest way to do so is
to launch them from two separate terminals, like so:

```bash
# from the genart-api repo root

(cd examples/param-custom && yarn start)

# this should open the example in the browser, but you can close that window again...

########

# in a second terminal...
(cd examples/param-editors && yarn start)

# this also should open the param editor in the browser
```

The param-editor is configured to run @ http://localhost:8080/, whereas the
example is served from a different port: http://localhost:5173/. Paste this
latter URL into the `Art URL` input field of the editor and press enter to load
the new example. Then select the `@thi.ng/imgui` editor implementation from the
dropdown menu to start configuring the parameters...

## License

&copy; 2024 Karsten Schmidt // MIT license
