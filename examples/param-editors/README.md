# genart-api param editors

[Live demo](https://demo.thi.ng/umbrella/genart-api/)

This example provides a couple of GUI editors to customize parameters exposed by
an art project running in an `<iframe>` and using the GenArt API approach.

The example serves to show how a parent window can receive parameter definitions
and update param values. Depending on the art piece and how its parameters have
been configured, most changes should be applied immediately. If a param has been
configured to require a reload when changed, this behavior will be respected &
handled automatically.

The two currently available GUI editors are only provided as example and to
evaluate the GenArt API inter-frame message protocol. They are based on:

-   [@thi.ng/imgui](https://thi.ng/imgui): Canvas based GUI components. Not all
    mobile friendly, but offers superior UI/UX for
    [ramps](../../README.md#ramp-parameter) & [XY param
    types](../../README.md#xy-parameter)
-   [@thi.ng/rdom-forms](https://thi.ng/rdom-forms): Data-driven declarative &
    extensible HTML form generation, using standard HTML input elements.

## Launching & building

> [!IMPORTANT]
> Before running this example, make sure you first build the actual GenArt API
> files AND build the [param-test example](../param-test/).

```bash
# Starting in the repo root directory...

# install typescript etc.
yarn install

# build API files
yarn build

# build param-test example
(cd examples/param-test && yarn build)

# switch to this example
cd examples/param-editors

# run vite dev server
yarn start

# create production build bundle
yarn build
```

## License

&copy; 2024 Karsten Schmidt // Apache Software License 2.0
