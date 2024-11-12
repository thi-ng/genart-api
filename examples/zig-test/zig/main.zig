const std = @import("std");
const wasm = @import("wasm-api");
const bindgen = @import("wasm-api-bindgen");
const canvas = @import("wasm-api-canvas");
const dom = @import("wasm-api-dom");
const genart = @import("lib.zig");

// only needed for debug builds
pub fn log(
    comptime _: std.log.Level,
    comptime _: @Type(.EnumLiteral),
    comptime _: []const u8,
    _: anytype,
) void {}

// expose thi.ng/wasm-api core API (incl. panic handler & allocation fns)
pub usingnamespace wasm;

// allocator, also exposed & used by JS-side WasmBridge & DOM module
// https://github.com/thi-ng/umbrella/blob/develop/packages/wasm-api/zig/lib.zig
var gpa = std.heap.GeneralPurposeAllocator(.{}){};
pub const WASM_ALLOCATOR = gpa.allocator();

export fn start() void {
    wasm.printStr("starting...");
    genart.setParams(
        &.{
            genart.choice(.{
                .id = "choice",
                .name = "Color mode",
                .desc = "Demo only",
                .options = &.{
                    .{ .value = "HSL" },
                    .{ .value = "LCH" },
                    .{ .value = "RGB" },
                    .{ .value = "XYZ" },
                },
            }),
            genart.color(.{
                .id = "bgcol",
                .name = "Background",
                .desc = "Background color",
                // .default = "#abcdef",
            }),
            genart.ramp(.{
                .id = "ramp",
                .name = "Ramp",
                .desc = "Draw a curve",
                .stops = &.{ 0, 0, 0.5, 1, 1, 0 },
            }),
            genart.range(.{
                .id = "density",
                .name = "Density",
                .desc = "Demo only",
                .max = 1,
                .step = 0.01,
            }),
        },
        // $genart.setParams() is an async function on the JS side.
        // to simplify mechanics, we pass the setup() function (below) as callback
        // to continue with initialization once setParams() is finished...
        setup,
    );
}

var canvasID: i32 = undefined;
var info: dom.WindowInfo = undefined;

/// main initialization AFTER parameters have been declared
fn setup() void {
    wasm.printStr("setup()");
    // create fullscreen canvas
    dom.getWindowInfo(&info);
    canvasID = dom.createCanvas(&.{
        .width = info.innerWidth,
        .height = info.innerHeight,
        .parent = dom.body,
    });
    canvas.beginCtx(canvasID);
    canvas.setFont("32px sans-serif");
    canvas.setTextAlign(.right);
    // set frame update loop/function
    genart.setUpdate(update);
}

/// main frame update/animation function.
/// receives current time (in millis) and frame number,
fn update(t: f64, frame: f64) bool {
    const w: f32 = @floatFromInt(info.innerWidth);
    const h: f32 = @floatFromInt(info.innerHeight);
    // buffers for reading param values
    var color: [8:0]u8 = undefined;
    var choice: [8:0]u8 = undefined;
    // get current bg color param value
    const bg = genart.stringParamValue("bgcol", &color);
    canvas.setFill(@ptrCast(bg.ptr));
    canvas.fillRect(0, 0, w, h);

    // draw circle at ramp position
    var tnorm = t * 0.001 * 0.25;
    tnorm -= std.math.floor(tnorm);
    canvas.setFill("#ff0");
    canvas.beginPath();
    canvas.arc(
        @floatCast(tnorm * w),
        @floatCast((1.0 - genart.rampParamValue("ramp", tnorm)) * h),
        20,
        0,
        std.math.tau,
        false,
    );
    canvas.fill();

    // format & write timing info to canvas
    var buf: [256:0]u8 = undefined;
    var txt = std.fmt.bufPrintZ(&buf, "t={d:.2} frame={d}", .{ t, frame }) catch return false;
    canvas.setFill("#fff");
    canvas.fillText(@ptrCast(txt.ptr), w - 20, h - 36, 0);

    // same for current values of other params...
    txt = std.fmt.bufPrintZ(&buf, "choice: {s}, bg: {s}, density: {d:.2}", .{
        genart.stringParamValue("choice", &choice),
        genart.stringParamValue("bgcol", &color),
        genart.numberParamValue("density"),
    }) catch return false;
    canvas.fillText(@as([*:0]const u8, @ptrCast(txt.ptr)), w - 20, h - 2 * 36, 0);

    // MUST return true to indicate animation should continue...
    return true;
}
