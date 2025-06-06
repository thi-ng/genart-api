const std = @import("std");
const wasm = @import("wasm-api");
const bindgen = @import("wasm-api-bindgen");
const api = @import("api.zig");

pub usingnamespace api;

const ParamSlice = bindgen.Slice([]const api.Param, [*]const api.Param);

pub const GenArtError = error{
    InvalidParams,
};

/// Auto-initialization hook called from JS when the module initializes
export fn _genart_init() void {
    if (wasm.allocator()) |allocator| {
        _ = allocator;
    }
}

pub extern "genart" fn _setParams(specs: [*]const api.Param, num: usize, callback: *const anyopaque) void;

pub extern "genart" fn _setUpdate(update: *const anyopaque) void;

pub extern "genart" fn _stringParamValue(id: [*:0]const u8, val: [*:0]u8, maxBytes: usize) usize;

pub extern "genart" fn numberParamValue(id: [*:0]const u8) f64;

pub extern "genart" fn rampParamValue(id: [*:0]const u8, t: f64) f64;

pub extern "genart" fn toggleParamValue(id: [*:0]const u8) u8;

pub extern "genart" fn _vectorParamValue(id: [*:0]const u8, val: [*]f32) void;

pub extern "genart" fn _imageParamValueGray(id: [*:0]const u8, val: [*]u8) void;

pub const SetParamsCallback = *const fn () void;

pub const UpdateCallback = *const fn (t: f64, frame: f64) bool;

pub fn setParams(specs: []const api.Param, callback: SetParamsCallback) void {
    _setParams(specs.ptr, specs.len, callback);
}

pub fn setUpdate(callback: UpdateCallback) void {
    _setUpdate(callback);
}

export fn _update(callback: *anyopaque, t: f64, frame: f64) bool {
    return @as(UpdateCallback, @ptrCast(callback))(t, frame);
}

export fn _setParamsCallback(callback: *anyopaque) void {
    @as(SetParamsCallback, @ptrCast(callback))();
}

pub fn stringParamValue(name: [*:0]const u8, val: [:0]u8) []u8 {
    return val[0.._stringParamValue(name, val.ptr, val.len + 1)];
}

pub fn vecParamValue(name: [*:0]const u8, comptime size: usize, val: *[size]f32) void {
    _vectorParamValue(name, val);
}

pub fn xyParamValue(name: [*:0]const u8, val: *[2]f32) void {
    _vectorParamValue(name, val);
}

pub fn imageParamValueGray(name: [*:0]const u8, comptime size: usize, val: *[size]u8) void {
    _imageParamValueGray(name, val);
}

inline fn defField(comptime T: type, param: *T, spec: anytype, name: []const u8) void {
    if (@hasField(@TypeOf(spec), name)) @field(param, name) = @field(spec, name);
}

inline fn defParam(typeID: [*:0]const u8, spec: anytype, body: api.ParamBody) api.Param {
    var param = api.Param{
        .type = typeID,
        .id = spec.id,
        .name = spec.name,
        .body = body,
    };
    inline for (.{ "desc", "doc", "group", "update", "edit", "widget", "randomize", "order" }) |id| {
        defField(api.Param, &param, spec, id);
    }
    return param;
}

/// Helper to wrap options for a `choice` param spec. See docs there for code example.
pub inline fn options(items: []const api.Option) api.ConstOptionSlice {
    return api.ConstOptionSlice.wrap(items);
}

/// Defines a choice param spec. Use `options()` to wrap possible values.
/// ```
/// genart.choice(.{
///   .id = "test",
///   .name = "Testing",
///   .options = genart.options(&.{
///     .{ .value = "hsl" },
///     .{ .value = "rgb" },
///   }),
/// })
/// ```
///
pub inline fn choice(spec: anytype) api.Param {
    var param = api.ChoiceParam{ .options = spec.options };
    defField(api.ChoiceParam, &param, spec, "default");
    return defParam("choice", spec, .{ .choice = param });
}

/// Defines a color param spec.
pub inline fn color(spec: anytype) api.Param {
    var param = api.ColorParam{};
    defField(api.ColorParam, &param, spec, "default");
    return defParam("color", spec, .{ .color = param });
}

/// Defines an image param spec.
pub inline fn image(spec: anytype) api.Param {
    if (spec.default.len != spec.width * spec.height) @compileError("wrong image data size");
    return defParam("image", spec, .{
        .image = api.ImageParam{
            .width = spec.width,
            .height = spec.height,
            .format = spec.format,
            .default = if (spec.format == .gray)
                api.ImageData{ .gray = api.ConstU8Slice.wrap(spec.default) }
            else
                api.ImageData{ .rgba = api.ConstU32Slice.wrap(spec.default) },
        },
    });
}

/// Defines a ramp param spec.
pub inline fn ramp(spec: anytype) api.Param {
    var param = api.RampParam{ .stops = api.ConstF64Slice.wrap(spec.stops) };
    defField(api.RampParam, &param, spec, "mode");
    return defParam("ramp", spec, .{ .ramp = param });
}

/// Defines a range param spec.
pub inline fn range(spec: anytype) api.Param {
    var param = api.RangeParam{};
    inline for (.{ "default", "min", "max", "step", "exponent" }) |id| {
        defField(api.RangeParam, &param, spec, id);
    }
    return defParam("range", spec, .{ .range = param });
}

/// Defines a text param spec.
pub inline fn text(spec: anytype) api.Param {
    var param = api.TextParam{};
    inline for (.{ "default", "match", "minLength", "maxLength", "multiline" }) |id| {
        defField(api.TextParam, &param, spec, id);
    }
    return defParam("text", spec, .{ .text = param });
}

/// Defines a toggle/checkbox param spec.
pub inline fn toggle(spec: anytype) api.Param {
    var param = api.ToggleParam{};
    defField(api.ToggleParam, &param, spec, "default");
    return defParam("toggle", spec, .{ .toggle = param });
}

/// Defines a n-dimensional vector param spec. Also see `xy()`.
pub inline fn vector(spec: anytype) api.Param {
    if (spec.default.len != spec.size) @compileError("wrong vector size");
    var param = api.VectorParam{
        .size = spec.size,
        .default = api.ConstF32Slice.wrap(spec.default),
    };
    inline for (.{ "min", "max", "step" }) |id| {
        defField(api.VectorParam, &param, spec, id);
    }
    return defParam("vector", spec, .{ .vector = param });
}

/// Defines a XY (2D vector) param spec. Also see `vector()`.
pub inline fn xy(spec: anytype) api.Param {
    var param = api.XYParam{};
    defField(api.XYParam, &param, spec, "default");
    return defParam("xy", spec, .{ .xy = param });
}
