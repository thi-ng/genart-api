const std = @import("std");

pub fn build(b: *std.Build) void {
    // Please consult the thi.ng/wasm-api README for details!
    const lib = @import("wasm-api-build.zig").wasmLib(b, .{
        // Only needed for this monorepo!!
        .base = "../../node_modules",
        // Declare extra WASM API packages to use
        .modules = &.{
            .{ .name = "genart-api", .path = "@genart-api/wasm/zig/lib.zig" },
            .{ .name = "wasm-api-canvas", .path = "@thi.ng/wasm-api-canvas/zig/lib.zig" },
            .{ .name = "wasm-api-dom", .path = "@thi.ng/wasm-api-dom/zig/lib.zig" },
        },
        // build mode override
        .optimize = .ReleaseSmall,
    });

    b.installArtifact(lib);
}
