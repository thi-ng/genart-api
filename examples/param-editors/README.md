# genart-api param editors

[Online version](https://demo.thi.ng/genart-api/param-editors/)

> [!IMPORTANT]
> Message names have been updated in v0.14.0 and are partially incompatible with
> older versions. Please see [commit
> details](https://github.com/thi-ng/genart-api/commit/35b627d7380bad75d280cc1e051ec7ed23aa8995)
> for what has changed and why, and what (might) need to be changed in your projects.
>
> **The parameter editors are only compatible with artworks using (at minimum)
> the above stated version of the GenArtAPI reference implementation.**

This example provides a couple of GUI editors (WIP) to customize parameter
values exposed by an artwork running in an `<iframe>` and using the GenArt API
with the [bundled
`URLParamAdapter`](../../README.md#existing-adapter-implementations).

The editor supports any compatible artwork whose URL can be entered via an input
field or supplied as URL parameter, like so:

http://localhost:8080/?url=https://demo.thi.ng/genart-api/param-test/

The two editor implementation also serve to show how a parent window with 3rd
party tooling can receive parameter definitions and update param values.
Depending on the art piece and how its parameters have been configured, most
changes can be applied immediately. If a param has been declared to require a
reload when changed, this behavior will be respected & handled automatically
(the platform adapter's responsibility).

The two available GUI editors are only provided as example and used to evaluate
the GenArt API inter-frame message protocol. They are based on:

-   [@thi.ng/rdom-forms](https://thi.ng/rdom-forms): Data-driven declarative &
    extensible HTML form generation, using standard HTML input elements
-   [@thi.ng/imgui](https://thi.ng/imgui): Canvas based GUI components. Not all
    mobile friendly, but offers superior UI/UX for
    [ramps](../../README.md#ramp-parameter) & [XY param
    types](../../README.md#xy-parameter)

## Launching & building

```bash
# Starting in the repo root directory...

# install typescript etc.
yarn install

# build API files
yarn build

# switch to this example
cd examples/param-editors
yarn install

# run vite dev server
yarn start

# create production build bundle
yarn build
```

## License

&copy; 2024 - 2025 Karsten Schmidt // MIT license
