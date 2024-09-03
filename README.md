# Platform independent API for generative art

## About

### Goals

-   Art works can be authored without direct dependency on online platform(s) where they're published
-   Straightforward repurposing/integration of art pieces in different environments:
    -   Personal websites/portfolios
    -   Offline, museums, galleries...
    -   Non-realtime use cases (high-res video/frame recording)
-   Any platform-specifics can be injected via plugin adapters
-   Extensible, platform-independent parameter system
-   For time-based works, choice of time provider plugins:
    -   Real-time (i.e. `requestAnimationFrame()`-based animation) and/or
    -   Offline (non-realtime, with configurable fixed time base)
-   (Optional) secondary tooling:
    -   Auto-generated GUIs for param control
    -   Variation snapshots/preset creation/selection
    -   Asset export (w/ param metadata)

### Non-goals

-   Support for every feature of every platform
-   ...

## Status

**ALPHA** — Work in progress... Welcoming feedback/issues!

## Parameters

Almost all generative art works use parameters and randomization to produce a
large number of variations. Some of these parameters can be exposed to the
outside world to allow people/agents more participation and direct control over
the generative outcomes.

### Parameter types

The following parameter types are available, but other custom ones can be
registered, making the whole system extensible. Each declared param is a simple
JS object and the API provides factory functions for all built-in types helping
to fill in default options.

**IMPORTANT**: All param declarations must provide a `doc` (documentation
string) and most also `default` value (see exceptions below).

#### Choice

This enum-like param can only take on values from a fixed list of options. For
simplicity values are always strings, but optionally can also define labels
(only used for display purposes by external tooling).

**Recommended GUI widget:** Drop-down menu

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

#### Color

CSS hex color value (6 digits only). Other/newer color types (e.g. `oklch()`)
might be supported later, but currently omitted due to lack of native browser
widgets for editing these colors...

**Recommended GUI widget:** Color picker

```ts
$genart.params.color({
    doc: "Background color",
    default: "#aabbcc",
});
```

#### Ramp

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

#### Range

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

#### Text

Single or multi-line text, optionally with `min`/`max` length and/or regexp pattern validation.

```ts
$genart.params.text({
    doc: "Seed phrase",
    max: 256
    match: "^[a-z ]+$"
    multiline: true
});
```

#### Weighted choice

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

#### XY pair

A 2D dimensional tuple which produces values in the [0,0] .. [1,1] range. Useful
to control two co-dependent parameters using an XY controller/touchpad...

```ts
$genart.params.xy({
    doc: "Bottom-left: [dark,dry] / Top-right: [bright,wet]",
    default: [0.5, 0.5],
});
```

## Supported platforms/approaches

New adapters can be defined by implementing a super minimal API:

-   [`PlatformAdapter` interface](https://github.com/thi-ng/genart-api/blob/e67e4ced7d787816ac2a2b193ccc32345eda2ebd/src/api.ts#L217)
-   [URL query string adapter](src/adapters/urlparams.ts)

## Lifecycle & workflow

**TODO (this entire section is outdated)**

-   [Diagram](dev/overview.plantuml)
-   [Workflows](dev/workflow.md)

### Art defines params

-   calls `$genapi.setParams()`
    -   API augments spec via `adapter.updateParam()`
    -   posts `genart:setparams` message with updated param specs & values to current & parent window
-   parent window receives message
    -   (re)creates GUI widgets for editing values

### User edits param value via GUI

-   GUI posts `setparamvalue` message to iframe (id, value)
-   api receives message validates value & updates param
    -   posts `paramchange` message w/ updated spec
        -   adapter's responsibility to respect param update behavior (e.g. force reload)

## License

&copy; 2024 Karsten Schmidt // Apache Software License 2.0
