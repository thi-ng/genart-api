# genart-api param editors

[Live demo](https://demo.thi.ng/umbrella/genart-api/)

This example provides a couple of GUI editors (WIP) to customize parameter
values exposed by an artwork running in an `<iframe>` and using the GenArt API
with the [bundled
`URLParamAdapter`](../../README.md#existing-adapter-implementations).

The editor supports any compatible artwork whose URL can be entered via an input
field or supplied as URL parameter, like so:

http://localhost:8080/?url=https://demo.thi.ng/genart-api/param-test/

The editors also serve to show how a parent window with 3rd party tooling can
receive parameter definitions and update param values. Depending on the art
piece and how its parameters have been configured, most changes can be applied
immediately. If a param has been declared to require a reload when changed, this
behavior will be respected & handled automatically (the platform adapter's
responsibility).

The two currently available GUI editors are only provided as example and to
evaluate the GenArt API inter-frame message protocol. They are based on:

-   [@thi.ng/rdom-forms](https://thi.ng/rdom-forms): Data-driven declarative &
    extensible HTML form generation, using standard HTML input elements
-   [@thi.ng/imgui](https://thi.ng/imgui): Canvas based GUI components. Not all
    mobile friendly, but offers superior UI/UX for
    [ramps](../../README.md#ramp-parameter) & [XY param
    types](../../README.md#xy-parameter)

## Launching & building

> [!IMPORTANT]
> Before running this example, make sure you first have launched or built a
> compatible GenArt API artwork or use one of these online examples:
>
> -   https://demo.thi.ng/genart-api/param-test/
> -   https://demo.thi.ng/genart-api/param-image/

```bash
# Starting in the repo root directory...

# install typescript etc.
yarn install

# build API files
yarn build

# switch to this example
cd examples/param-editors

# run vite dev server
yarn dev

# create production build bundle
yarn build
```

Also please see [related notes in other bundled examples](../param-test/README.md)!

## License

&copy; 2024 Karsten Schmidt // Apache Software License 2.0
