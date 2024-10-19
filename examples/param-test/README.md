# genart-api param test

[Live demo with editor](https://demo.thi.ng/genart-api/param-editors/?url=https://demo.thi.ng/genart-api/param-test/)

This basic example gives an overview of the supported built-in param types and
the overall proposed GenArt API workflow/setup.

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
cd examples/param-test
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

(cd examples/param-test && yarn start)

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

The various [parameters defined in the example source code](src/index.ts), can
be customized via URL search params (query string), e.g.

-   http://localhost:5173/?dot=yello&txt=genart-api&size=200&curve=0.333,1&ramp=s,0,0.2,0.5,0.8,1,0.2
-   [http://localhost:5173/?\_\_width=1280&\_\_height=720&\_\_seed=123456789](http://localhost:5173/?__width=1280&__height=720&__seed=123456789)

## License

&copy; 2024 Karsten Schmidt // MIT license
