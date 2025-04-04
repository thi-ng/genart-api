const std = @import("std");
const wasm = @import("wasm-api");
const bindgen = @import("wasm-api-bindgen");
const canvas = @import("wasm-api-canvas");
const dom = @import("wasm-api-dom");
const genart = @import("genart-api");

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
                .options = genart.options(&.{
                    .{ .value = "HSL" },
                    .{ .value = "LCH" },
                    .{ .value = "RGB" },
                    .{ .value = "XYZ" },
                }),
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
            genart.toggle(.{
                .id = "filled",
                .name = "Filled dot",
                .desc = "Demo only",
            }),
            genart.xy(.{
                .id = "dotshape",
                .name = "Dot shape/radius",
                .desc = "Demo only",
            }),
            genart.vector(.{
                .id = "vec",
                .name = "Test vector",
                .size = 3,
                .default = &[_]f32{ 10, 20, 30 },
                .min = 0,
                .max = 100,
                .step = 1,
            }),
            // genart.image(.{
            //     .id = "img",
            //     .name = "Test",
            //     .width = 2,
            //     .height = 2,
            //     .format = .rgba,
            //     .default = &[_]u32{ 0, 0, 0, 0 },
            // }),
        },
        // $genart.setParams() is an async function on the JS side.
        // to simplify mechanics, we pass the setup() function (below) as callback
        // to continue with initialization once setParams() is finished...
        setup,
    );
}

var canvasID: i32 = undefined;
var overlayID: i32 = undefined;
var info: dom.WindowInfo = undefined;

/// main initialization AFTER parameters have been declared
fn setup() void {
    wasm.printStr("setup()");
    // create fullscreen canvas
    dom.getWindowInfo(&info);
    canvasID = dom.createCanvas(&.{ .width = info.innerWidth, .height = info.innerHeight, .parent = dom.body });
    overlayID = dom.createElement(&.{ .tag = "pre", .id = "info", .parent = dom.body });
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
    _ = genart.stringParamValue("bgcol", &color);
    canvas.setFill(&color);
    // canvas.setFill(@ptrCast(bg.ptr));
    canvas.fillRect(0, 0, w, h);

    // draw circle at ramp position
    var tnorm = t * 0.001 * 0.25;
    tnorm -= std.math.floor(tnorm);

    const isFilled = genart.toggleParamValue("filled") > 0;
    if (isFilled) {
        canvas.setFill("#ff0");
    } else {
        canvas.setStroke("#ff0");
    }

    var dotShape: [2]f32 = undefined;
    var vec: [3]f32 = undefined;
    genart.xyParamValue("dotshape", &dotShape);
    genart.vecParamValue("vec", 3, &vec);

    canvas.beginPath();
    canvas.ellipse(
        @floatCast(tnorm * w),
        @floatCast((1.0 - genart.rampParamValue("ramp", tnorm)) * h),
        dotShape[0] * 50,
        dotShape[1] * 50,
        0,
        0,
        std.math.tau,
        false,
    );
    if (isFilled) {
        canvas.fill();
    } else {
        canvas.stroke();
    }

    // format & write timing info to canvas
    var buf: [512:0]u8 = undefined;
    const txt = std.fmt.bufPrintZ(
        &buf,
        \\choice: {s}
        \\bg: {s}
        \\shape: {d:.2}
        \\density: {d:.2}
        \\vector: {d:.0}
        \\
        \\t={d:.2} frame={d}
    ,
        .{
            genart.stringParamValue("choice", &choice),
            genart.stringParamValue("bgcol", &color),
            dotShape,
            genart.numberParamValue("density"),
            vec,
            t,
            frame,
        },
    ) catch return false;
    dom.setInnerText(overlayID, @as([*:0]const u8, @ptrCast(txt.ptr)));

    // MUST return true to indicate animation should continue...
    return true;
}
