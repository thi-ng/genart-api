# genart-api param test

[Pre-built live demo with editor](https://demo.thi.ng/genart-api/param-editors/?url=https://demo.thi.ng/genart-api/p5-basic/)

This is a basic example using [p5.js](https://p5js.org) with a GenArt API
workflow/setup.

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
cd examples/p5-basic
yarn install

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

(cd examples/p5-basic && yarn start)

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

## Customizing parameters via URL

The various [parameters defined in the example source code](src/index.js), can
be customized via URL search params (query string), e.g.

-   http://localhost:5173/?stroke=f8e808&fill=f48206&bg=39d9d7&radius=0.70&scaleX=0.0036&scaleT=0.0007

## License

&copy; 2024 - 2025 Karsten Schmidt // MIT license
