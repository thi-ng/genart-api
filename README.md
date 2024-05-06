# Platform independent API for generative art

## About

### Goals

-   Art works can be authored without direct dependency on online platform(s) where they're published
-   Straightforward repurposing/integration of art pieces in different environments:
    -   Personal websites/portfolios
    -   Offline, museums, galleries...
    -   Non-realtime use cases (high-res video/frame recording)
-   Any platform-specifics can be injected via plugin adapters
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

## Supported platforms/approaches

New adapters can be defined by implementing a super minimal API:

-   [`PlatformAdapter` interface](https://github.com/thi-ng/genart-api/blob/e67e4ced7d787816ac2a2b193ccc32345eda2ebd/src/api.ts#L217)
-   [URL query string adapter](src/adapters/urlparams.ts)

## Workflow

TODO (outdated)

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
