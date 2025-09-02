const std = @import("std");

pub fn build(b: *std.Build) void {
    b.installArtifact(@import("wasm-api-build.zig").wasmLib(b, .{
        // Only needed for this monorepo!!
        .base = "../../node_modules",
        // Declare extra WASM API packages to use
        // Each package can also declare dependencies to other such packages
        // (wasm-api and wasm-api-bindgen are made available everywhere)
        .modules = &.{
            .{ .name = "genart-api", .path = "@genart-api/wasm/zig/lib.zig" },
            .{ .name = "wasm-api-canvas", .path = "@thi.ng/wasm-api-canvas/zig/lib.zig" },
            .{ .name = "wasm-api-dom", .path = "@thi.ng/wasm-api-dom/zig/lib.zig" },
        },
        // (optional) build mode override
        // if commented out, we can pass CLI args to choose build mode (default: .Debug)
        // see build:zig-prod script alias in package.json
        .optimize = .ReleaseSmall,
    }));
}
