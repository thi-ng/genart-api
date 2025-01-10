# @genart-api/wasm

[![npm version](https://img.shields.io/npm/v/@genart-api/wasm.svg)](https://www.npmjs.com/package/@genart-api/wasm)
![npm downloads](https://img.shields.io/npm/dm/@genart-api/wasm.svg)
[![Mastodon Follow](https://img.shields.io/mastodon/follow/109331703950160316?domain=https%3A%2F%2Fmastodon.thi.ng&style=social)](https://mastodon.thi.ng/@toxi)

WebAssembly bindings for [GenArtAPI](https://github.com/thi-ng/genart-api/) and
the [thi.ng/wasm-api](https://thi.ng/wasm-api) toolchain.

This integration is designed as an API module for the
[thi.ng/wasm-api](https://thi.ng/wasm-api) toolchain, and includes polyglot
bindings code for both [Zig](https://ziglang.org) & TypeScript.

## Usage examples

| **Project**                                                                   | **Live demo w/ editor**                                                                            | **Description**                           |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [zig-test](https://github.com/thi-ng/genart-api/tree/main/examples/zig-test/) | [Demo](https://demo.thi.ng/genart-api/param-editors/?url=https://demo.thi.ng/genart-api/zig-test/) | Zig/WebAssembly API wrapper example (WIP) |

## Project integration

### Add dependencies

```bash
yarn add @genart-api/wasm @thi.ng/wasm-api @thi.ng/wasm-api-canvas @thi.ng/wasm-api-dom
```

### Basic TypeScript WASM bridge setup

```ts
import {
	GenArtWasmAPIModule,
	type GenArtWasmAPIExports,
} from "@genart-api/wasm";
import { WasmBridge } from "@thi.ng/wasm-api";
import {
	WasmCanvas2DModule,
	type WasmCanvas2DExports,
} from "@thi.ng/wasm-api-canvas";
// (ViteJS style import of WASM module URL)
import WASM_URL from "./main.wasm?url";

// combined WASM exports of all API modules used, incl. any custom user defined additions.
interface WasmApp extends GenArtWasmAPIExports, WasmCanvas2DExports {
	// custom user defined start function (see /zig/main.zig)
	start(): void;
}

// create new WASM bridge with extra API module(s)
// see: https://docs.thi.ng/umbrella/wasm-api/interfaces/WasmModuleSpec.html
const bridge = new WasmBridge<WasmApp>([
	GenArtWasmAPIModule,
	WasmCanvas2DModule,
]);
// instantiate WASM module & bindings
await bridge.instantiate(fetch(WASM_URL));

// call WASM main function to kick off
bridge.exports.start();
```

### Basic Zig code setup

```zig
const std = @import("std");
const wasm = @import("wasm-api");
const bindgen = @import("wasm-api-bindgen");
const canvas = @import("wasm-api-canvas");
const dom = @import("wasm-api-dom");
const genart = @import("genart-api");

// expose thi.ng/wasm-api core API (incl. panic handler & allocation fns)
pub usingnamespace wasm;

// (OPTIONAL) allocator, also exposed & used by JS-side WasmBridge & DOM module
// https://github.com/thi-ng/umbrella/blob/develop/packages/wasm-api/zig/lib.zig
var gpa = std.heap.GeneralPurposeAllocator(.{}){};
pub const WASM_ALLOCATOR = gpa.allocator();

// main entry point
export fn start() void {
    // declare parameters
    genart.setParams(
        &.{
            genart.color(.{ .id = "bg", .name = "Background color", .desc = "Demo only" }),
            genart.range(.{ .id = "number", .name = "Test number", .desc = "Demo only" }),
        },
        // $genart.setParams() is an async function on the JS side.
        // to simplify mechanics, we pass the setup() function (below) as callback
        // to continue with initialization once setParams() is finished...
        setup,
    );
}

var canvasID: i32 = undefined;
var info: dom.WindowInfo = undefined;

// main initialization, called AFTER parameters have been declared
fn setup() void {
    // create fullscreen canvas
    dom.getWindowInfo(&info);
    canvasID = dom.createCanvas(&.{ .width = info.innerWidth, .height = info.innerHeight, .parent = dom.body });
    canvas.beginCtx(canvasID);

    // set frame update loop/function
    genart.setUpdate(update);
}

// main frame update/animation function.
// receives current time (in millis) and frame number,
fn update(time: f64, frame: f64) bool {
    const w: f32 = @floatFromInt(info.innerWidth);
    const h: f32 = @floatFromInt(info.innerHeight);
    // buffers for reading param values
    var color: [8:0]u8 = undefined;
    // get current bg color param value
    _ = genart.stringParamValue("bg", &color);
    // fill canvas
    canvas.setFill(&color);
    canvas.fillRect(0, 0, w, h);

    // MUST return true to indicate animation should continue...
    return true;
}
```

### Zig build script

Add `build.zig` script ([further
information](https://github.com/thi-ng/umbrella/tree/develop/packages/wasm-api#using-the-zig-build-system)):

```zig
const std = @import("std");

pub fn build(b: *std.Build) void {
    // please consult the thi.ng/wasm-api README for details!
    const lib = @import("node_modules/@thi.ng/wasm-api/zig/build.zig").wasmLib(b, .{
        // declare WASM API packages to use
        .modules = &.{
            .{ .name = "genart-api", .path = "@genart-api/wasm/zig/lib.zig" },
            .{ .name = "wasm-api-canvas", .path = "@thi.ng/wasm-api-canvas/zig/lib.zig" },
            .{ .name = "wasm-api-dom", .path = "@thi.ng/wasm-api-dom/zig/lib.zig" },
        },
        // (optional) build mode override
        .optimize = .ReleaseSmall,
    });

    b.installArtifact(lib);
}
```

### Build WASM binary

```bash
zig build
```

The WASM module will be written to `zig-out/bin/main.wasm`.

## (Re)Building type definitions

The following command generates both Zig & TypeScript bindings code for the
included [type
definitions](https://github.com/thi-ng/genart-api/blob/main/packages/wasm/src/typedefs.json).

```bash
yarn build:bindings
```
