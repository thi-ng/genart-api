# Platform independent API for generative art

-   [Status](#status)
-   [About](#about)
    -   [Goals](#goals)
    -   [Non-goals](#non-goals)
-   [Core API](#core-api)
    -   [Definitions / terminology](#definitions--terminology)
    -   [Architecture overview](#architecture-overview)
        -   [Lifecycle](#lifecycle)
        -   [State machine](#state-machine)
        -   [Message types](#message-types)
    -   [API documentation](#api-documentation)
-   [Parameters](#parameters)
    -   [Static parameter types](#static-parameter-types)
        -   [Choice](#choice-parameter)
        -   [Color](#color-parameter)
        -   [Date](#date-parameter)
        -   [Datetime](#datetime-parameter)
        -   [Image](#image-parameter)
        -   [List](#list-parameter)
        -   [Range](#range-parameter)
        -   [Text](#text-parameter)
        -   [Time](#time-of-day-parameter)
        -   [Toggle](#toggle-parameter)
        -   [Weighted choice](#weighted-choice-parameter)
        -   [XY](#xy-parameter)
    -   [Dynamic parameter types](#dynamic-parameter-types)
        -   [Ramp](#ramp-parameter)
    -   [Custom parameter types](#custom-parameter-types)
        -   [Example: Oscillator parameter type](#example-oscillator-parameter-type)
    -   [Composite parameter types](#composite-parameter-types)
-   [Traits](#traits)
-   [Platform adapters](#platform-adapters)
    -   [Existing adapter implementations](#existing-adapter-implementations)
    -   [Parameter sourcing](#parameter-sourcing)
    -   [Parameter updates](#parameter-updates)
    -   [Determinism & PRNG provision](#determinism--prng-provision)
    -   [Screen configuration](#screen-configuration)
        -   [Handling dynamic resizing](#handling-dynamic-resizing)
    -   [Thumbnail/preview generation](#thumbnailpreview-generation)
-   [Time providers](#time-providers)
    -   [Existing time provider implementations](#existing-time-provider-implementations)
-   [Getting started](#getting-started)
    -   [Examples projects](#example-projects)
    -   [Project template](#project-template)
    -   [Installion as package](#installion-as-package)
    -   [Manual installation](#manual-installation)
    -   [Use in your own projects: Artist's Hello world](#use-in-your-own-projects-an-artists-hello-world)
    -   [Creating a basic PlatformAdapter](#platforms)
-   [Build information](#build-information)
    -   [Building core API files](#building-core-api-files)
    -   [Building examples](#build-information)
-   [Parameter editors](#parameter-editors)
-   [License](#license)

## Status

**ALPHA** — Work in progress... **Welcoming feedback!** 🙏

Please also see RFCs and open questions in the [issue
tracker](https://github.com/thi-ng/genart-api/issues). Thanks!

> [!NOTE]
> tl;dr Jump to the [Getting started section](#getting-started).

## About

Over the past years, generative/computational art has experienced a surge in
popularity because of the availability of online art platforms for publishing
these works. The number of these platforms keeps on mushrooming, each one
defining their own ad hoc solutions to deal with common aspects (e.g. [handling
of parameters](#parameters) to customize pieces/variations, generating previews,
etc.). Often, this means artists have to either already decide on which platform
to publish a new piece before they work on it and/or spend a considerable amount
of time reworking key aspects (like parameter, [screen
resolution](#screen-configuration) or [time handling](#time-providers)) when
repurposing a piece for a different use (e.g. creating hires print versions,
high-quality video assets, or displaying the piece in a gallery with different
configurations or requirements). Since online platforms/startups usually only
optimize for their own uses and neglecting the needs of artists regarding asset
preparation, adaptation and re-use, we must take it upon ourselves to address
these workflow issues more efficiently.

To improve this situation, this project proposes an API layer and a message
protocol addressing recurring issues artists encounter when publishing and
repurposing browser-based generative artworks — be it for diverse online
platforms, environments (incl. offline, galleries, installations), but also
aforementioned aspects of media production (for example helping to deal with
realtime/non-realtime rendering when recording image sequences for video
production, and do so in an unintrusive & externally controlled manner).

![Overview](https://raw.githubusercontent.com/thi-ng/genart-api/main/diagrams/overview.svg)

Schematic overview of the proposed architecture

The primary purpose of this API is to decouple key aspects commonly used for
most generative/computational artworks, to deduplicate feature implementations
and reduce the time & effort required for adapting browser-based artworks for
different uses/environments. These benefits are not _only_ in the interest of
artists, but also simplify how online art platforms can use this API layer to
reduce effort on their end, simplify providing customization features for such
generative artworks (and even re-use tooling).

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

-   Decouple artworks from presentation platform:
    -   artworks can be authored without direct knowledge of which platform(s)
        they're being displayed or published at
-   Straightforward repurposing/integration of artworks into diverse environments:
    -   Online art platforms
    -   Personal websites/portfolios
    -   Offline, museums, galleries...
    -   Non-realtime use cases (high-res video/frame recording)
-   Any platform-specifics can be injected via small plugin adapters which can
    be added to an artwork's HTML wrapper without any code changes required
    -   Examples of platform-specifics:
        -   Handling parameter and/or feature declarations exposed by the artwork
        -   Handling parameter value overrides, param value decoding/encoding
        -   Handling thumbnail/preview generation
        -   Defining/forcing display size & densities
-   Provide an extensible, platform-independent parameter system with a set of
    commonly used parameter types
    -   Parameter type-specific validation, coercion, randomization
    -   Composite parameter types
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

### Definitions / terminology

-   **Artwork**: A browser-based art piece running in a standard HTML
    environment
-   **Platform**: The host website, application, or system in which the
    artwork's HMTL wrapper will be deployed and which might provide parameter
    customizations, PRNG seeds, control playback behavior, handle preview
    generation etc.
-   **Platform adpater**: A software plugin for the proposed GenArt API which
    handles and/or translates all platform specifics
-   **Time provider**: A software plugin for the proposed GenArt API which is
    used to provide animation time information and schedule animation frames,
    all controlled by the main GenArt API layer.

### Architecture overview

#### Lifecycle

![Overview](https://raw.githubusercontent.com/thi-ng/genart-api/main/diagrams/lifecycle.svg?20241008)

[Diagram source code](https://github.com/thi-ng/genart-api/blob/main/diagrams/lifecycle.puml)

#### State machine

The API implements a finite state machine with the following possible states:

-   `init`: Initial state until the [platform adapter](#platform-adapters), [time
    provider](#time-providers) and the artwork's update function have been
    registered or an error occurred during any init steps
-   `ready`: All init steps have been completed and playback of the artwork can
    commence
-   `play`: API is currently running the animation loop, ruuning the artwork
-   `stop`: Animation loop has been paused/stopped
-   `error`: API is in an unrecoverable error state

#### Message types

TODO

-   `genart:setparams`
-   `genart:setparamvalue`
-   `genart:settraits`
-   `genart:randomizeparam`
-   `genart:paramchange`
-   `genart:paramerror`
-   `genart:statechange`
-   `genart:start`
-   `genart:resume`
-   `genart:stop`
-   `genart:capture`

### API documentation

Full API docs are actively being worked on. For now, this readme, the source
code and the [example projects](#bundled-examples) are the best reference.

[Generated API documentation](https://docs.thi.ng/umbrella/genart-api/)

## Parameters

Almost all generative artworks use parameters and randomization to produce
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
    name: "Test param",
    desc: "Shape size preset",
    options: ["s", "m", "l"],
    default: "m",
});

// ...or using options with labels
$genart.params.choice({
    name: "Test param",
    desc: "Shape size preset",
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
    name: "Test param",
    desc: "Background color",
    default: "#aabbcc",
});
```

##### Recommended GUI widget

-   Color picker

#### Date parameter

JS `Date` value in precision of full days only (UTC midnight).

```ts
$genart.params.date({
    name: "Test param",
    desc: "Best before date",
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
    name: "Test param",
    desc: "Date and time (in UTC)",
    default: new Date("2024-09-05T12:34:56+02:00"),
});
```

##### Recommended GUI widget

-   Date & time chooser
-   Numeric range slider (UNIX epoch)

#### Image parameter

Image parameters are used to provide spatially varied param values (e.g.
gradient maps, masks etc.) by allowing the artwork to read pixel values from
different points in the image.

An image param has a pixel array as `value`, alongside `width`, `height` and
`format`, which can be:

-   `gray` (8 bits)
-   `rgb` (packed int, 24 bits, channels in MSB order: R,G,B)
-   `argb` (packed int, 32 bits, channels in MSB order: A,R,G,B)

The `format` is only used as hint for platform adapters and external tooling
(e.g. GUI param editors) to optimize their handling of the image data. I.e. an
image with mode `gray` can be encoded as byte sequence vs. `argb` requiring 4
bytes per pixel. Likewise a param editor allowing image uploads/customizations
is responsible to resize an image to the expected dimensions and provide its
data in the expected format.

[Related example](https://github.com/thi-ng/genart-api/tree/main/examples/param-image)

> [!IMPORTANT]
> Note to artists: Ensure to keep your image size requirements as low as
> possible! Storing image data in URL parameters (as done by most platforms) has
> hard browser-defined limits and this param type is not (yet?) supported by any
> of the major online art platforms.

#### List parameter

TODO

##### Numeric list

```ts
$genart.params.numlist({
    name: "test",
    desc: "List of numbers",
    default: [1, 2, 3],
});
```

##### String list

```ts
$genart.params.strlist({
    name: "test",
    desc: "List of strings",
    default: ["a", "b", "c"],
});
```

#### Range parameter

Numeric value from a closed range/interval (defined by `min`/`max`, defaulting
to [0, 100]). If `step` is given, the value will be rounded to multiples of
`step` (always clamped to min/max).

```ts
$genart.params.range({
    name: "Test param",
    desc: "Pick a number between 0-100",
    min: 0,
    max: 100,
    step: 5,
});
```

##### Recommended GUI widget

-   number dial/slider with value label
-   number input field

#### Text parameter

Single or multi-line text, optionally with `min`/`max` length and/or regexp
pattern validation.

```ts
$genart.params.text({
    name: "Test param",
    desc: "Seed phrase",
    max: 256
    match: "^[a-z ]+$"
    multiline: true
});
```

##### Recommended GUI widget

-   Single or multiline text input field

#### Time parameter

Time-of-day parameter with values as `[hour, minute, second]`-tuples in 24h format.

##### Recommended GUI widget

-   HMS time chooser
-   HMS dropdown menus
-   HMS text input fields

#### Toggle parameter

On/off switch (boolean) parameter.

##### Recommended GUI widget

-   checkbox

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
    name: "Test param",
    desc: "Bottom-left: [dark,dry] / Top-right: [bright,wet]",
    default: [0.5, 0.5],
});
```

##### Recommended GUI widget

-   XY pad controller
-   Pair of sliders (X & Y individually)

### Dynamic parameter types

Dynamic parameters are either time-based (using a abstract notion of "time") or
otherwise produce values which could change each time a parameter is being
read/evaluated by the artwork (e.g. sensor inputs).

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
    name: "Test param",
    desc: "Brightness over time",
    stops: [
        [0, 0.1],
        [0.9, 1],
        [1, 0],
    ],
    mode: "smooth",
});
```

### Custom parameter types

The system supports registering custom parameter types and their implementation
via
[`$genart.registerParamType()`](https://docs.thi.ng/umbrella/genart-api/interfaces/GenArtAPI.html#registerParamType).
These can be useful to provide additional app-specific or platform-specific
parameters (e.g. values obtained from arbitrary hardware sensors to which an
artwork might respond dynamically).

-   [`ParamImpl` interface definition](https://docs.thi.ng/umbrella/genart-api/interfaces/ParamImpl.html)
-   [`registerParamType()`](https://docs.thi.ng/umbrella/genart-api/interfaces/GenArtAPI.html#registerParamType)

The `registerParamType()` allows overriding of existing param type
implementations, but doing so will print a warning. When an artwork or platform
registers its own types, it SHOULD consider namespacing the type name, e.g.
`platformname:customtype`.

#### Example: Oscillator parameter type

The following example shows how to implement, register and then use a sine wave
oscillator parameter type, providing time-based values. A more advanced version
is shown in the [param-custom
example](https://github.com/thi-ng/genart-api/blob/main/examples/param-custom).

```ts
// define a new param type with given name and implementation.
interface OscParam extends Param<number> {
    type: "user:sinosc";
    freq: number;
    amp: number;
    offset: number;
}

// this implementation does not allow any customizations or value randomization
// (the latter is common to all dynamic params, since the value is ALWAYS computed)
$genart.registerParamType("user:sinosc", {
    // for brevity we decide this param cannot be customized (once defined)
    valid: (spec, key, value) => false,
    // the read function is called each time this param is evaluated,
    // here to provide a time-based value
    read: (spec, t) => {
        const { freq, amp, offset } = <OscParam>spec;
        return Math.sin(t * freq * Math.PI * 2) * amp + offset;
    },
});

// register parameter
const param = $genart.setParams({
    sine: {
        type: "user:sinosc", // param type (should be unique)
        freq: 0.25, // frequency in Hz
        amp: 5, // amplitude
        offset: 5, // center offset
        default: 0, // ignored
    },
});

$genart.setUpdate((t) => {
    // current time in seconds
    t *= 0.001;
    // evaluate param
    console.log(t, param("sine", t));
    // keep on animating
    return true;
});
```

### Composite parameter types

Composite parameter types contain child parameters to allow the main param be
configured in more detailed/complex ways. Usually, a composite parameter type
will define a
[`.read()`](https://docs.thi.ng/umbrella/genart-api/interfaces/ParamImpl.html#read)
method to dynamically produce values, based on the current configuration
of its child params.

An example of such a composite parameter type is an extended version of the
oscillator described in the [previous
section](#example-oscillator-parameter-type).

TODO

Please see the [param-custom
example](https://github.com/thi-ng/genart-api/blob/main/examples/param-custom)
for reference...

## Traits

Some platforms support the concept of artist-defined metadata, commonly called
"traits" or "features". In most cases, this metadata is a key-value dictionary,
where the keys are arbitrarily defined criteria the artist wants to expose, and
usually, the values are derived from the current parameter configuration of a
particular variation.

This API principally supports this use case via the `$genart.setTraits()`
function, but it's the platform adapter's responsibility to deal with this
information provided, i.e. declaring traits has zero impact on any other
workings or state of the API layer.

The value of a single trait can be a number, string or boolean.

```ts
// declare a single param
const param = await $genart.setParams({
    bright: $genart.params.range({
        name: "brightness",
        desc: "overall brightness",
        min: 0,
        max: 100,
    }),
});

// internal random param
const density = $genart.random.rnd();

// declare traits to outside world
$genart.setTraits({
    brightness: param("bright") < 50 ? "dark" : "light",
    density: Math.floor(density * 100) + "%",
});
```

## Platform adapters

TODO This section will describe the role(s) of adapters responsible for
providing (deployment) platform-specific functionality and interop features.

-   [`PlatformAdapter` interface definition](https://docs.thi.ng/umbrella/genart-api/interfaces/PlatformAdapter.html)

### Existing adapter implementations

-   [/src/adapters/urlparams.ts](https://github.com/thi-ng/genart-api/blob/main/src/adapters/urlparams.ts) : Reference implementation
-   [/src/adapters/dummy.ts](https://github.com/thi-ng/genart-api/blob/main/src/adapters/dummy.ts) : Absolute barebones, scaffolding only

### Parameter sourcing

TODO write docs

### Parameter updates

TODO write docs

### Determinism & PRNG provision

Related issues/RFCs:

-   [#1: Provide single PRNG or allow platfom adapters to define implementation?](https://github.com/thi-ng/genart-api/issues/1)

Platform adapters are responsible to provide a seedable and resettable,
deterministic pseudo-random number generator which the artwork can access via
[`$genart.random`](https://docs.thi.ng/umbrella/genart-api/interfaces/GenArtAPI.html#random).
Usually, the adapter just has to return the PRNG provided by the respective
platform.

-   [PRNG interface definition](https://docs.thi.ng/umbrella/genart-api/interfaces/PRNG.html)
-   [Example implementation in a platform adapter](https://github.com/thi-ng/genart-api/blob/17cbe7df708601d40ee353e77605525822f27ab1/src/adapters/urlparams.ts#L56-L73)

For cases where a platform does not provide its own PRNG, this repo contains two
implementations which can be used by an adapter:

-   [SFC32](https://github.com/thi-ng/genart-api/blob/main/src/prng/sfc32.ts)
-   [XorShift128](https://github.com/thi-ng/genart-api/blob/main/src/prng/xorshift128.ts)

### Screen configuration

Platform adapters are responsible to provide screen/canvas dimensions (and pixel
density information) to the artwork, and the latter MUST use the
[`$genart.screen`](https://docs.thi.ng/umbrella/genart-api/interfaces/GenArtAPI.html#screen)
accessor to obtain this information (rather than directly querying
`window.innerWidth` etc.). This accessor returns a [`ScreenConfig`
object](https://docs.thi.ng/umbrella/genart-api/interfaces/ScreenConfig.html).

This approach gives the platform full control to define fixed dimensions,
irrespective of actual window dimensions and also be in charge of resizing
behavior.

#### Handling dynamic resizing

Similar to the above, artwork which aims to be responsive to changing screen
configurations MUST NOT listen to `window` resize events directly, but MUST add
a listener for `genart:resize` messages, like so:

```ts
// resize events contain the new screen config
$genart.on("genart:resize", ({ screen }) => {
    console.log("new screen info:", screen.width, screen.height, screen.dpr);
});
```

If an artwork is unable to dynamically respond to resize events, it should at
least implement a handler which reloads the window on resize, like so:

```ts
$genart.on("genart:resize", () => location.reload());
```

### Thumbnail/preview generation

TODO

## Time providers

A time provider is a further decoupling mechanism to allow artists (or
platforms) to re-purpose an artwork in different media production or asset
management contexts. Common scenarios include: an artist (or platform) might
want to produce high-res outputs or high-quality video assets which can only be
created by running the piece at a much lower frame rate (or a frame rate
controlled via external events/triggers). In order to protect the artwork code
from having to be adjusted for these use cases, the API uses pluggable timing
providers which are merely responsible to schedule the next animation frame and
provide a related timestamp and frame number.

The API defaults to using a [`requestAnimationFrame()`-based
provider](https://github.com/thi-ng/genart-api/blob/main/src/time/raf.ts), but
this one can be replaced by loading an alternative implementation via another
`<script>` tag, like so:

```html
<!-- main GenArtAPI script -->
<script src="./lib/genart.js"></script>
<!--
    optional: use custom time provider (e.g. for non-realtime rendering of image sequences)
    configure API to use offline time (new frame every 250 ms)
    IMPORTANT: MUST be loaded AFTER the main genart script!
-->
<script type="module">
    // import { timeProviderOffline } from "./lib/time-offline.js";
    // $genart.setTimeProvider(timeProviderOffline(250));
</script>
```

### Existing time provider implementations

-   [/src/time/raf.ts](https://github.com/thi-ng/genart-api/blob/main/src/time/raf.ts): `requestAnimationFrame()`-based
-   [/src/time/offline.ts](https://github.com/thi-ng/genart-api/blob/main/src/time/offline.ts): non-realtime, configurable

## Getting started

> [!NOTE]
> The reference implementation of the API provided has no dependencies.

### Example projects

This repo contains several examples used for testing and evaluating the
reference API implementation. These are all separate projects/packages located
in the [/examples](https://github.com/thi-ng/genart-api/tree/main/examples)
directory. Please ensure you read their README instructions, since a certain
build order must be used:

| **Project**                                                                            | **Live demo**                                                                                          | **Description**                                                |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| [param-test](https://github.com/thi-ng/genart-api/tree/main/examples/param-test/)      | [Demo](https://demo.thi.ng/genart-api/param-editors/?url=https://demo.thi.ng/genart-api/param-test/)   | Minimal "art" example using various parameter types            |
| [param-image](https://github.com/thi-ng/genart-api/tree/main/examples/param-image/)    | [Demo](https://demo.thi.ng/genart-api/param-editors/?url=https://demo.thi.ng/genart-api/param-image/)  | Example using an image map parameter                           |
| [param-custom](https://github.com/thi-ng/genart-api/tree/main/examples/param-custom/)  | [Demo](https://demo.thi.ng/genart-api/param-editors/?url=https://demo.thi.ng/genart-api/param-custom/) | Custom & composite parameter type example                      |
| [param-editors](https://github.com/thi-ng/genart-api/tree/main/examples/param-custom/) |                                                                                                        | Example/reference [editor implementations](#parameter-editors) |

### Project template

This repo contains an empty project template which can be used as starting point
for new projects. The template uses TypeScript & Vite, but can be _very_ easily
adapted to other tooling (eg. there's hardly any code, so switching to
JavaScript requires just renaming the source file).

-   TODO move template to own repo for easier use

```bash
git clone https://github.com/thi-ng/genart-api.git

# copy template to new directory
cp -R genart-api/project-template my-new-art-project

# install dependencies (genart api, typescript, vite)
cd my-new-art-project
yarn install
```

### Installion as package

The [@thi.ng/genart-api package](https://www.npmjs.com/@thi.ng/genart-api)
contains the pre-built release files & type declarations, but is **not** an ESM
module which can (or even should) be imported via `import` syntax. The API is
always provided as singleton via the global `$genart` variable.

Instead, the JS file(s) should be copied to your project's `/lib` dir (or
similar) to be referenced by `<script>` tag in your HTML wrapper (see below):

```bash
yarn add @thi.ng/genart-api

# create dest dir
mkdir -p lib

# copy files
cp node_modules/@thi.ng/genart-api/*.js lib
```

If you're a TypeScript user, you'll also want to add the package to your
`tsconfig.json` types field OR add a declaration file with the following content
to your `/src` directory:

tsconfig.json

```json
{
    "compilerOptions": {
        "types": ["@thi.ng/genart-api"]
    }
}
```

/src/types.d.ts:

```ts
/// <reference types="@thi.ng/genart-api" />
```

Then you should be ready to go to [the next
step](#use-in-your-own-projects-an-artists-hello-world)...

### Manual installation

The [/dist](https://github.com/thi-ng/genart-api/tree/main/dist) directory
contains all pre-built release files and type declarations which you should copy
to your project directory (e.g. in a `/lib` dir or similar).

If you're a TypeScript user, you'll also want to add a declaration file with the
following content to your `/src` directory:

/src/types.d.ts:

```ts
/// <reference types="../lib/genart.d.ts" />
```

### Use in your own projects: An artist's "Hello world"

This section explains the basic approach to create a `GenArtAPI` conformant art
project and assumes you have installed the API files/types via one of the ways
described above.

```html
<script src="./lib/genart.min.js"></script>
```

-   [TypeScript source code](https://github.com/thi-ng/genart-api/blob/main/src/index.ts)

#### Reference platform adapter

The repo provides a basic [platform adapter](#platform-adapters) for sourcing
parameters via URL query string (aka
[`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)).
This adapter can be useful during local development, or used as basis for other
use cases:

```html
<script src="./lib/adapter-urlparams.min.js"></script>
```

-   [TypeScript source code](https://github.com/thi-ng/genart-api/blob/main/src/adapters/urlparams.ts)

#### Example files

<details><summary>HTML example wrapper</summary>

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Hello GenArtAPI</title>
        <!-- main GenArtAPI script -->
        <script src="./lib/genart.js"></script>
        <!-- platform adapter -->
        <script src="./lib/adapter-urlparams.js"></script>
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
            // import { timeProviderOffline } from "./lib/time-offline.js";
            // $genart.setTimeProvider(timeProviderOffline(250));
        </script>
        <!-- User artwork script -->
        <script type="module" src="/src/index.js"></script>
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
            name: "Bg color", // mandatory human readable name
            desc: "Canvas background color", // mandatory brief description
            doc: "Optional extended documentation or usage hints",
            default: "#0000ff", // default value (if omitted, will be initialized to random...)
            update: "reload", // trigger reload on value change
        }),

        // this param has no default, so will be initialized to random value
        // (unless the platform provides a customized value)
        maxR: $genart.params.range({
            name: "Max radius",
            desc: "Maximum brush size",
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
    // time (in milliseconds) and frame number supplied by GenArtAPI & time provider
    const update = (time, frame) => {
        const radius = random() * param("maxR");
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.arc(random() * width, random() * height, radius, 0, Math.PI * 2);
        ctx.stroke();
        console.log(time, frame);

        // function must return true for animation to continue
        return true;
    };

    // register update function
    // depending on platform adapter/specifics, in most cases
    // this will also auto-start animation...
    $genart.setUpdate(update);
})();
```

</details>

### Creating a basic PlatformAdapter

TODO for now see [existing adapter implementations](#existing-adapter-implementations)...

## Build information

### Building core API files

```bash
yarn install

# output files will be written to /dist
yarn build

# generate TypeScript type declarations (also written to /dist)
yarn build:types
```

### Building examples

The following command is used to create production builds of _all_ examples:

```bash
# from the repo root
yarn build:examples
```

## Parameter editors

The repo contains two reference implementations of GUI parameter editors to
modify param values exposed by an artwork running in an embedded `<iframe>`.
These editors can be used to customize parameters of the other [bundled
examples](#bundled-examples) (or any other project using GenArt API and the
supplied [reference platform adapter](#reference-platform-adapter)). See the
[param-editors
readme](https://github.com/thi-ng/genart-api/tree/main/examples/param-editors/)
for details.

The following table provides an overview of the **current** parameter types
support in both editors:

| Param type       | thi.ng/rdom editor | thi.ng/imgui editor |
| ---------------- | ------------------ | ------------------- |
| Choice           | ✅                 | ✅                  |
| Color            | ✅                 | ✅ (1)              |
| Composite params | ❌                 | ✅ (2)              |
| Date             | ✅                 | ✅                  |
| Datetime         | ✅                 | ❌                  |
| Image            | ✅                 | ❌                  |
| List             | ❌                 | ❌                  |
| Range            | ✅                 | ✅                  |
| Ramp             | ❌                 | ✅                  |
| Text             | ✅                 | ✅ (3)              |
| Time             | ✅                 | ❌                  |
| Toggle           | ✅                 | ✅                  |
| Weighted choice  | ✅                 | ✅                  |
| XY               | ✅ (1)             | ✅                  |

-   (1) No dedicated widget yet, using fallback only
-   (2) See [composite parameter types](#composite-parameter-types)
-   (3) Only single line, not mobile friendly

## License

&copy; 2024 Karsten Schmidt and contributors // MIT License
