# Platform independent API for generative art

-   [Status](#status)
-   [About](#about)
    -   [Goals](#goals)
    -   [Non-goals](#non-goals)
-   [Architecture overview](#architecture-overview)
    -   [Lifecycle](#lifecycle)
-   [Core API](#core-api)
    -   [API documentation](#api-documentation)
    -   [Use in your own projects](#use-in-your-own-projects)
-   [Parameters](#parameters)
    -   [Static parameter types](#static-parameter-types)
        -   [Choice](#choice-parameter)
        -   [Color](#color-parameter)
        -   [Date](#date-parameter)
        -   [Datetime](#datetime-parameter)
        -   [Time](#time-of-day-parameter)
        -   [Range](#range-parameter)
        -   [Text](#text-parameter)
        -   [XY](#xy-parameter)
    -   [Dynamic parameter types](#dynamic-parameter-types)
        -   [Ramp](#ramp-parameter)
        -   [Weighted choice](#weighted-choice-parameter)
-   [Platform adapters](#platform-adapters)
    -   [Existing adapter implementations](#existing-adapter-implementations)
    -   [Parameter sourcing](#parameter-sourcing)
    -   [Parameter updates](#parameter-updates)
    -   [Determinism & PRNG provision](#determinism--prng-provision)
    -   [Screen configuration](#screen-configuration)
    -   [Thumbnail/preview generation](#thumbnailpreview-generation)
-   [Getting started](#getting-started)
    -   [Artist's Hello world](#artists)
    -   [Creating a basic PlatformAdapter](#platforms)
-   [License](#license)

## Status

**ALPHA** — Work in progress... Welcoming feedback!

## About

Generative/computational art has long and rich history, but has seen its
popularity soar only over the past ~5 years with the arrival of various online
art platforms to publish these works. The number of these platforms keeps on
mushrooming, each one defining their own ad-hoc solutions how to deal with
common aspects (e.g. handling of parameters to customize pieces/variations,
generating previews etc.). Often, this means artists have to either already
decide on which platform to publish a new piece when they start working on it
and/or spend a considerable amount of time reworking key aspects (like parameter
handling) when repurposing a piece for a different use (e.g. creating hires
print versions, video assets, or displaying the piece in a gallery with
different configurations or requirements). Since most of these online
platforms/startups only ever optimize for their own uses, they don't care about
these issues of asset preparation & adaptation and so it's up to us
artists/producers to address these issues ourselves.

This project defines an API layer addressing recurring issues artists encounter
when publishing and repurposing browser-based generative art works for diverse
online platforms, usage environments (incl. offline, galleries, installations),
and also different aspects of media production (for example how to deal with
realtime/non-realtime rendering when recording image sequences for video
production).

![Overview](https://raw.githubusercontent.com/thi-ng/genart-api/main/diagrams/overview.svg)
Schematic overview of the proposed architecture

The primary purpose of this API is to decouple key aspects commonly used for
most generative/computational art works, to deduplicate feature implementations
and generally reduce time & effort required for adapting browser-based art works
for different uses/environments. These benefits are not _only_ in the interest
of artists, but also simplify how online art platforms can use this API layer to
reduce effort on their end, simplify providing customization features for such
generative art works (and even re-use tooling).

Another positive side effect of adapting the system proposed herein is the
emergence of secondary re-usable tooling with handling the management of
parameters and variations, for example: tooling to generate GUI controls for
editing params, creating/storing/retrieving parameter presets/collections (aka
variations), asset downloaders/uploaders, transcoding tools. Even at this stage,
some of these are already existing and being worked on...

In this document & repository we describe the approach, the proposed
architecture and provide a TypeScript-based reference implementation, including
fully documented interfaces & types, and some example test cases to demonstrate
(and validate!) the approach and benefits.

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
    -   Parameter type-specific validation/coercion
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

Art works requiring/relying on advanced integrations with a specific platform
are naturally highly dependent on those platform features, and so would not
benefit from a more platform-independent approach in any way. Therefore we
consider these use cases as out-of-scope.

However, the proposed system is designed to be extensible in several ways which
enable a number of platform-specific extensions which can be highly beneficial
to all parties involved when adopted and can supported in an unintrusive way.

## Architecture overview

### Lifecycle

![Overview](https://raw.githubusercontent.com/thi-ng/genart-api/main/diagrams/lifecycle.svg)

[Diagram source code](./diagrams/lifecycle.puml)

## Core API

### API documentation

Full API docs are actively being worked on. For now, this readme, the source
code and the example project are the best reference.

[Generated API documentation](https://docs.thi.ng/umbrella/genart-api/)

### Use in your own projects

The reference implementation of the API provided here has no dependencies can be
included by adding the following `<script>` tag to your HTML header:

```html
<script src="https://raw.githubusercontent.com/thi-ng/genart-api/main/dist/genart.min.js"></script>
```

[TypeScript source code](src/index.ts)

This repo also provides a basic [platform adapter](#platform-adapters) for
sourcing parameters via URL query string and can be useful during local
development. This adapter can be added via inclusion of (also see [bundled
example](art.html)):

```html
<script src="https://raw.githubusercontent.com/thi-ng/genart-api/main/dist/adapter-urlparams.min.js"></script>
```

[TypeScript source code](src/adapters/urlparams.ts)

## Parameters

Almost all generative art works use parameters and randomization to produce a
large number of variations. Some of these parameters can be exposed to the
outside world to allow people/agents more participation and direct control over
the generative outcomes.

The API supports an extensible set of parameters types with a selection of
commonly used types supplied as built-ins (described below).

Each parameter declared by the art work is represented in the API as a simple
vanilla JS object and any param value changes are being handled by the param
type's [registered
implementation](https://docs.thi.ng/umbrella/genart-api/interfaces/ParamImpl.html)
(a set of functions dealing with validation, coercion, updating and reading
param values).

For convenience & type safety, the API provides factory functions for all
built-in parameter types.

The following parameter types are available, but other custom ones can be
registered, making the whole system extensible. Each declared param is a simple
JS object and the API provides factory functions for all built-in types helping
to fill in default options.

**IMPORTANT**: All param declarations must provide a `doc` (documentation
string) and most also `default` value (see exceptions below).

### Static parameter types

Generally speaking, parameters can be grouped into static & dynamic parameters
with the former providing the same values each time they're read/evaluted and
the latter being used for time-based, randomized value or obtained from
otherwise dynamic sources (e.g. sensors).

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

Dynamic parameters are either time-based (using a abstract notion of "time"),
randomized or otherwise produce values which could change each time a parameter
is being evaluated by the art work (e.g. sensor inputs, time/date).

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

**Recommended GUI widget:** [Curve
editor](https://github.com/thi-ng/umbrella/tree/develop/examples/ramp-synth)

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

#### Weighted choice parameter

Similar to the [Choice param type](#choice), but here each option also has an
associated weight. Along with [ramps](#ramp), this is the other non-static
parameter type, intended for time-based works, here producing a new random value
each time the parameter is read and yielding a probability distribution defined
by the relative weights given to each option.

```ts
$genart.params.weighted({
    doc: "Controlled randomness",
    options: [
        ["black", 8],
        ["cyan", 4],
        ["magenta", 2],
        ["yellow", 1],
    ],
});

// optionally, labels can be provided for each option
$genart.params.weighted({
    doc: "With labels",
    options: [
        ["#000", 8, "black"],
        ["#0ff", 4, "cyan"],
        ["#f0f", 2, "magenta"],
        ["#ff0", 1, "yellow"],
    ],
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

-   [/src/adapters/dummy.ts](/src/adapters/dummy.ts)
-   [/src/adapters/urlparams.ts](/src/adapters/urlparams.ts)

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

### Artist's Hello world

HTML wrapper:

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
            optional: use custom time provider (e.g. for non-realtime rendering of image sequence)
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

index.js (artwork script)

```js
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

### Creating a basic PlatformAdapter

TODO

## License

&copy; 2024 Karsten Schmidt and contributors // Apache Software License 2.0
