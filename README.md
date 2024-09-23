# Platform independent API for generative art

-   [Status](#status)
-   [About](#about)
    -   [Goals](#goals)
    -   [Non-goals](#non-goals)
-   [Core API](#core-api)
    -   [Architecture overview](#architecture-overview)
        -   [Lifecycle](#lifecycle)
    -   [API documentation](#api-documentation)
-   [Parameters](#parameters)
    -   [Static parameter types](#static-parameter-types)
        -   [Choice](#choice-parameter)
        -   [Color](#color-parameter)
        -   [Date](#date-parameter)
        -   [Datetime](#datetime-parameter)
        -   [Time](#time-of-day-parameter)
        -   [Range](#range-parameter)
        -   [Text](#text-parameter)
        -   [Weighted choice](#weighted-choice-parameter)
        -   [XY](#xy-parameter)
    -   [Dynamic parameter types](#dynamic-parameter-types)
        -   [Ramp](#ramp-parameter)
-   [Platform adapters](#platform-adapters)
    -   [Existing adapter implementations](#existing-adapter-implementations)
    -   [Parameter sourcing](#parameter-sourcing)
    -   [Parameter updates](#parameter-updates)
    -   [Determinism & PRNG provision](#determinism--prng-provision)
    -   [Screen configuration](#screen-configuration)
    -   [Thumbnail/preview generation](#thumbnailpreview-generation)
-   [Getting started](#getting-started)
    -   [Bundled examples](#bundled-examples)
    -   [Artist's Hello world](#an-artists-hello-world)
    -   [Creating a basic PlatformAdapter](#platforms)
-   [License](#license)

## Status

**ALPHA** — Work in progress... **Welcoming feedback!** 🙏

## About

Over the past years, generative/computational art has experienced a surge in
popularity because of the availability of online art platforms for publishing
these works. The number of these platforms keeps on mushrooming, each one
defining their own ad hoc solutions to deal with common aspects (e.g. handling
of parameters to customize pieces/variations, generating previews, etc.). Often,
this means artists have to either already decide on which platform to publish a
new piece before they work on it and/or spend a considerable amount of time
reworking key aspects (like parameter, resolution or time handling) when
repurposing a piece for a different use (e.g. creating hires print versions,
high-quality video assets, or displaying the piece in a gallery with different
configurations or requirements). Since online platforms/startups usually only
optimize for their own uses and neglecting the needs of artists regarding asset
preparation, adaptation and re-use, we must take it upon ourselves to address
these workflow issues more efficiently.

To improve this situation, this project proposes an API layer and a message
protocol addressing recurring issues artists encounter when publishing and
repurposing browser-based generative art works — be it for diverse online
platforms, environments (incl. offline, galleries, installations), but also
aforementioned aspects of media production (for example helping to deal with
realtime/non-realtime rendering when recording image sequences for video
production, and do so in an unintrusive & externally controlled manner).

![Overview](https://raw.githubusercontent.com/thi-ng/genart-api/main/diagrams/overview.svg)
Schematic overview of the proposed architecture

The primary purpose of this API is to decouple key aspects commonly used for
most generative/computational art works, to deduplicate feature implementations
and reduce the time & effort required for adapting browser-based art works for
different uses/environments. These benefits are not _only_ in the interest of
artists, but also simplify how online art platforms can use this API layer to
reduce effort on their end, simplify providing customization features for such
generative art works (and even re-use tooling).

Another positive side effect of adapting the system proposed here: The emergence
of secondary re-usable tooling to manage parameters and variations, for example:
tooling to generate GUI controls for editing params, creating/storing/retrieving
parameter presets/collections (aka variations), asset downloaders, transcoding
tools. Even at this stage, some of these are existing already and actively being
worked on...

In this document & repository we describe the approach, the proposed
architecture and provide a TypeScript-based reference implementation, including
fully documented interfaces & types, and some example test cases to demonstrate
(and validate!) the approach and its benefits.

### Goals

-   Decouple art works from presentation platform:
    -   Art works can be authored without direct knowledge of which platform(s)
        they're being displayed or published at
-   Straightforward repurposing/integration of art works into diverse environments:
    -   Online art platforms
    -   Personal websites/portfolios
    -   Offline, museums, galleries...
    -   Non-realtime use cases (high-res video/frame recording)
-   Any platform-specifics can be injected via small plugin adapters which can
    be added to an art work's HTML wrapper without any code changes required
    -   Examples of platform-specifics:
        -   Handling parameter and/or feature declarations exposed by the art work
        -   Handling parameter value overrides, param value decoding/encoding
        -   Handling thumbnail/preview generation
        -   Defining/forcing display size & densities
-   Provide an extensible, platform-independent parameter system with a set of
    commonly used parameter types
    -   Parameter type-specific validation, coercion, randomization
    -   Randomized parameter lookups (per individual read)
    -   Timebased parameters (e.g. [ramps](#ramp-parameter))
    -   Built-in support for custom parameter types and their implementation
-   Define a messaging/event system for notification of state & param changes
-   For time-based works
    -   Transport control (aka start/stop/resume)
    -   Provide choice of time provider plugins:
        -   Real-time (i.e. `requestAnimationFrame()`-based animation) and/or
        -   Offline (non-realtime, with configurable fixed time base)
-   Enable re-usable secondary tooling:
    -   Auto-generated GUIs for param controls/overrides
    -   Variation/snapshot/preset creation/selection
    -   Asset export (w/ param metadata)

### Non-goals

This API aims to **remain as minimal as possible** and will not directly support
every feature of every platform, which would cause feature creep, bloat and
unsustainable maintenance effort.

Artworks requiring or relying on advanced integrations with a specific platform
are naturally highly dependent on those platform features, and so would not
benefit from a more platform-independent approach in any way. Therefore, we
consider these use cases as out-of-scope.

However, the proposed system is designed to enable platform-specific extensions
in several ways, which can highly benefit all parties involved when adopted and
can be supported unintrusively. For example, a platform/device can provide
sensor input and expose it through a custom parameter type, allowing a mock
implementation to be provided when running elsewhere.

## Core API

### Architecture overview

#### Lifecycle

![Overview](https://raw.githubusercontent.com/thi-ng/genart-api/main/diagrams/lifecycle.svg)

[Diagram source code](https://github.com/thi-ng/genart-api/tree/main/diagrams/lifecycle.puml)

### API documentation

Full API docs are actively being worked on. For now, this readme, the source
code and the [example projects](#bundled-examples) are the best reference.

[Generated API documentation](https://docs.thi.ng/umbrella/genart-api/)

## Parameters

Almost all generative art works use parameters and randomization to produce
numerous variations. Exposing some of these parameters to the outside world can
allow people/agents to have more participation and direct control over the
generative outcomes.

The API supports an extensible set of parameters types with a selection of
commonly used types supplied as built-ins (described below).

Each parameter declared by the artwork is a simple vanilla JS object and any
param value changes are being handled by the API and the param type’s
[registered
implementation](https://docs.thi.ng/umbrella/genart-api/interfaces/ParamImpl.html)
(a set of functions dealing with validation, coercion, updating and reading
param values). For convenience & type safety, the API provides factory functions
for all built-in parameter types.

The following parameter types are available, but other custom ones can be
registered, making the entire system extensible. Each declared param spec is a
simple JS object, and the API provides factory functions for all built-in types,
helping to fill in any default options.

**IMPORTANT**: All param declarations must include a `desc` (brief description)
and have the option to define `default` values for most parameter types. If no
default value is provided, a randomized value will be chosen within the
constraints of the param.

### Static parameter types

Generally speaking, parameters can be grouped into static & dynamic parameters
with the former providing the same values each time they're read/evaluated and
the latter being used for time-based values obtained from otherwise dynamic
sources (e.g. sensors).

This section describes the set of _static_ param types:

#### Choice parameter

This enum-like param can only take on values from a fixed list of options. For
simplicity values are always strings, but optionally can also define labels
(only used for display purposes by external tooling).

```ts
// options
$genart.params.choice({
    doc: "Shape size preset",
    options: ["s", "m", "l"],
    default: "m",
});

// ...or using options with labels
$genart.params.choice({
    doc: "Shape size preset",
    options: [
        ["s", "Small"],
        ["m", "Medium"],
        ["l", "Large"],
    ],
    options: "m",
});
```

##### Recommended GUI widget

-   Drop-down menu
-   Radio buttons

#### Color parameter

CSS hex color value (6 digits only). Other/newer color types (e.g. `oklch()`)
might be supported later, but currently omitted due to lack of native browser
widgets for editing these colors...

```ts
$genart.params.color({
    doc: "Background color",
    default: "#aabbcc",
});
```

##### Recommended GUI widget

-   Color picker

#### Date parameter

JS `Date` value in precision of full days only (UTC midnight).

```ts
$genart.params.date({
    doc: "Date",
    default: new Date("2024-09-05"),
});
```

##### Recommended GUI widget

-   Date & time chooser
-   Numeric range slider (UNIX epoch)

#### Datetime parameter

JS `Date` value (in UTC).

```ts
$genart.params.datetime({
    doc: "Date and time (in UTC)",
    default: new Date("2024-09-05T12:34:56+02:00"),
});
```

##### Recommended GUI widget

-   Date & time chooser
-   Numeric range slider (UNIX epoch)

#### Time parameter

Time-of-day parameter with values as `[hour, minute, second]`-tuples in 24h format.

##### Recommended GUI widget

-   HMS time chooser
-   HMS dropdown menus
-   HMS text input fields

#### Range parameter

Numeric value from a closed range/interval (defined by `min`/`max`, defaulting
to [0, 100]). If `step` is given, the value will be rounded to multiples of
`step` (always clamped to min/max).

```ts
$genart.params.range({
    doc: "Pick a number between 0-100",
    min: 0,
    max: 100,
    step: 5,
});
```

#### Text parameter

Single or multi-line text, optionally with `min`/`max` length and/or regexp
pattern validation.

```ts
$genart.params.text({
    doc: "Seed phrase",
    max: 256
    match: "^[a-z ]+$"
    multiline: true
});
```

##### Recommended GUI widget

-   Single or multiline text input field

#### Weighted choice parameter

Similar to the [Choice parameter type](#choice), but here each option also
has an associated weight/importance. When randomizing this parameter, a new
value is chosen based on the probability distribution defined by the relative
weights given to each option.

Note: The options can be given in any order and their weights are always only
treated relative to each other. The `$genart.params.weighted()` factory function
is automatically sorting these options by weight and pre-computes their total
weight.

If no default value is given, it will be picked randomly (using the weights, as
described above).

```ts
// define color options with these probabilities:
// - black:   8/15th (53%)
// - cyan:    4/15th (27%)
// - magenta: 2/15th (13%)
// - yellow:  1/15th (7%)
$genart.params.weighted({
    desc: "Controlled randomness",
    options: [
        // format: [weight, value]
        [8, "black"],
        [4, "cyan"],
        [2, "magenta"],
        [1, "yellow"],
    ],
});

// optionally, labels can be provided for each option
$genart.params.weighted({
    desc: "With labels",
    options: [
        // format: [weight, value, label]
        [8, "#000", "black"],
        [4, "#0ff", "cyan"],
        [2, "#f0f", "magenta"],
        [1, "#ff0", "yellow"],
    ],
});
```

##### Recommended GUI widget

-   Drop-down menu
-   Radio buttons

#### XY parameter

A 2D dimensional tuple which produces values in the [0,0] .. [1,1] range. Useful
to control two co-dependent parameters using an XY controller/touchpad...

```ts
$genart.params.xy({
    doc: "Bottom-left: [dark,dry] / Top-right: [bright,wet]",
    default: [0.5, 0.5],
});
```

##### Recommended GUI widget

-   XY pad controller
-   Pair of sliders (X & Y individually)

### Dynamic parameter types

Dynamic parameters are either time-based (using a abstract notion of "time") or
otherwise produce values which could change each time a parameter is being
read/evaluated by the art work (e.g. sensor inputs).

Unlike [static param types](#static-parameter-types), these parameters have **no
default value** and their actual value is always computed.

#### Ramp parameter

A ramp defines a one-dimensional curve/gradient via a number of stops/keyframes,
from which then an actual value will be derived by sampling the curve at a
specific position. Ramp are different to other parameter types in that they're
mostly intended for time-based parameters whose value should evolve over time
(rather than being a static quantity).

Ramps support any number of stops/keyframes (though, at least 2 are required!)
and by default the API supports the following interpolation modes:

-   `linear`: linear interpolation (default)
-   `exp`: exponential interpolation
-   `smooth`: smoothstep

**Recommended GUI widget:**

-   [Curve editor](https://github.com/thi-ng/umbrella/tree/develop/examples/ramp-synth)

```ts
$genart.params.ramp({
    doc: "Brightness over time",
    stops: [
        [0, 0.1],
        [0.9, 1],
        [1, 0],
    ],
    mode: "smooth",
});
```

### Custom parameter types

TODO

[Platform adapters](#platform-adapters) can register custom parameter types and
their implementation via
[`$genart.registerParamType()`](https://docs.thi.ng/umbrella/genart-api/interfaces/GenArtAPI.html#registerParamType).
These can be useful to provide additional platform-specific parameters (e.g.
values obtained from arbitrary hardware sensors to which an art work might
respond dynamically).

-   [`ParamImpl` interface definition](https://docs.thi.ng/umbrella/genart-api/interfaces/ParamImpl.html)
-   [`registerParamType()`](https://docs.thi.ng/umbrella/genart-api/interfaces/GenArtAPI.html#registerParamType)

## Platform adapters

TODO This section will describe the role(s) of adapters responsible for
providing (deployment) platform-specific functionality and interop features.

-   [`PlatformAdapter` interface definition](https://docs.thi.ng/umbrella/genart-api/interfaces/PlatformAdapter.html)

### Existing adapter implementations

-   [/src/adapters/dummy.ts](https://github.com/thi-ng/genart-api/tree/main/src/adapters/dummy.ts)
-   [/src/adapters/urlparams.ts](https://github.com/thi-ng/genart-api/tree/main/src/adapters/urlparams.ts)

### Parameter sourcing

TODO

### Parameter updates

TODO

### Determinism & PRNG provision

TODO

### Screen configuration

TODO

### Thumbnail/preview generation

TODO

## Getting started

### Bundled examples

This repo contains several examples used for testing and evaluating the
reference API implementation. These are all separate projects/packages located
in the [/examples](https://github.com/thi-ng/genart-api/tree/main/examples)
directory. Please ensure you read their README instructions, since a certain
build order must be used:

-   [param-test](https://github.com/thi-ng/genart-api/tree/main/examples/param-test/):
    Minimal "art" example using various parameter types
-   [param-editors](https://github.com/thi-ng/genart-api/tree/main/examples/param-editors/):
    GUI param editors to modify params exposed by an art project running in an
    `<iframe>`.

### An artist's "Hello world"

This section describes the basic approach to create a `GenArtAPI` conformant art
project.

**The reference implementation of the API provided here has no dependencies**
and can be included by downloading/copying the scripts in the
[/dist](https://github.com/thi-ng/genart-api/tree/main/dist) directory to your
project and adding the following `<script>` tags to your HTML header:

```html
<script src="genart.min.js"></script>
```

-   [TypeScript source code](https://github.com/thi-ng/genart-api/tree/main/src/index.ts)
-   [Minified release build](https://github.com/thi-ng/genart-api/tree/main/dist/genart.min.js)

This repo also provides a basic [platform adapter](#platform-adapters) for
sourcing parameters via URL query string (aka
[`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)).
This adapter can be useful during local development and used as basis for other
use cases:

```html
<script src="adapter-urlparams.min.js"></script>
```

-   [TypeScript source code](https://github.com/thi-ng/genart-api/tree/main/src/adapters/urlparams.ts)
-   [Minified release build](https://github.com/thi-ng/genart-api/tree/main/dist/adapter-urlparams.min.js)

#### Example files

<details><summary>HTML example wrapper</summary>

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Hello GenArtAPI</title>
        <!-- main GenArtAPI script -->
        <script src="genart.min.js"></script>
        <!-- dummy platform adapter -->
        <script src="adapter-urlparams.min.js"></script>
        <style>
            body {
                margin: 0;
                overflow: hidden;
            }
        </style>
    </head>
    <body>
        <!--
            optional: use custom time provider (e.g. for non-realtime rendering of image sequences)
            configure API to use offline time (new frame every 250 ms)
        -->
        <script type="module">
            // import { timeProviderOffline } from "./time-offline.min.js";
            // $genart.setTimeProvider(timeProviderOffline(250));
        </script>
        <!-- User artwork script -->
        <script type="module" src="index.js"></script>
    </body>
</html>
```

</details>

<details><summary>Minimal example artwork script</summary>

```js
// index.js
(async () => {
    // ensure platform adapter is ready
    await $genart.waitForAdapter();

    // declare parameters
    const param = await $genart.setParams({
        bgColor: $genart.params.color({
            name: "Bg color",
            desc: "Canvas background color",
            doc: "Optional extended documentation or usage hints",
            default: "#0000ff",
            update: "reload", // trigger reload on value change
        }),

        maxR: $genart.params.range({
            name: "Max radius",
            desc: "Maximum brush size",
            default: 50,
            min: 10,
            max: 100,
            step: 5,
        }),
    });

    // obtain screen config
    const { width, height, dpr } = $genart.screen;

    // alias PRNG function (for convenience)
    const random = $genart.random.rnd;

    // create canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    // use param (in TS param value types will be inferred automatically)
    ctx.fillStyle = param("bgColor");
    // clear canvas
    ctx.fillRect(0, 0, width, height);

    // main update/draw function
    // time (in seconds) and frame number supplied by GenArtAPI & time provider
    const update = (time, frame) => {
        const radius = random() * param("maxR");
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.arc(random() * width, random() * height, radius, 0, Math.PI * 2);
        ctx.stroke();
        console.log(time, frame);
    };

    // register update function
    // depending on platform adapter/specifics, in most cases
    // this will also auto-start animation...
    $genart.setUpdate(update);
})();
```

</details>

### Creating a basic PlatformAdapter

TODO for now see [existing adapter
implementations](#existing-adapter-implementations)...

## License

&copy; 2024 Karsten Schmidt and contributors // Apache Software License 2.0
