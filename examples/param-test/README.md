# genart-api param test

This basic example gives an overview of the supported built-in param types and
the overall proposed GenArt API workflow/setup.

## Launching & building

> [!IMPORTANT]
> Before running this example, make sure you first build the actual GenArt API
> files. Furthermore, this example MUST be built prior to starting/building the
> [param-editors example](../param-editors/).

```bash
# Starting in the repo root directory...

# install typescript etc.
yarn install

# build API files
yarn build

# switch to example
cd examples/param-test

# run vite dev server
yarn start

# create production build bundle
yarn build
```

## Customizing parameters

The various [parameters defined in the example source code](src/index.ts), can
be customized via URL search params (query string), e.g.

-   http://localhost:5173/?dot=yello&txt=genart-api&size=200&curve=0.333,1&ramp=s,0,0.2,0.5,0.8,1,0.2
-   http://localhost:5173/?\_\_width=1280&\_\_height=720&\_\_seed=123456789

For a more userfriendly param editing experience, please see the [param-editors
example](../param-editors/).

## License

&copy; 2024 Karsten Schmidt // Apache Software License 2.0
