const std = @import("std");

pub fn build(b: *std.Build) void {
    // Please consult the thi.ng/wasm-api README for details!
    const lib = @import("node_modules/@thi.ng/wasm-api/zig/build.zig").wasmLib(b, .{
        // Declare extra WASM API packages to use
        .modules = &.{
            .{ .name = "wasm-api-canvas", .path = "@thi.ng/wasm-api-canvas/zig/lib.zig" },
            .{ .name = "wasm-api-dom", .path = "@thi.ng/wasm-api-dom/zig/lib.zig" },
        },
        // build mode override
        .optimize = .ReleaseSmall,
    });

    b.installArtifact(lib);
}
