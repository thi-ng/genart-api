const std = @import("std");
const wasm = @import("wasm-api");
const bindgen = @import("wasm-api-bindgen");
const types = @import("types.zig");

const ParamSlice = bindgen.Slice([]const types.Param, [*]const types.Param);

pub const GenArtError = error{
    InvalidParams,
};

/// Auto-initialization hook called from JS when the module initializes
export fn _genart_init() void {
    if (wasm.allocator()) |allocator| {
        _ = allocator;
    }
}

pub extern "genart" fn _setParams(specs: [*]const types.Param, num: usize, callback: *const anyopaque) void;

pub extern "genart" fn _setUpdate(update: *const anyopaque) void;

pub extern "genart" fn _stringParamValue(id: [*:0]const u8, val: [*:0]u8, maxBytes: usize) usize;

pub extern "genart" fn numberParamValue(id: [*:0]const u8) f64;

pub extern "genart" fn rampParamValue(id: [*:0]const u8, t: f64) f64;

pub extern "genart" fn toggleParamValue(id: [*:0]const u8) u8;

pub extern "genart" fn _vectorParamValue(id: [*:0]const u8, val: [*]f32) void;

pub extern "genart" fn _imageParamValueGray(id: [*:0]const u8, val: [*]u8) void;

pub const SetParamsCallback = *const fn () void;

pub const UpdateCallback = *const fn (t: f64, frame: f64) bool;

pub fn setParams(specs: []const types.Param, callback: SetParamsCallback) void {
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

inline fn defParam(typeID: [*:0]const u8, spec: anytype, body: types.ParamBody) types.Param {
    var param = types.Param{
        .type = typeID,
        .id = spec.id,
        .name = spec.name,
        .body = body,
    };
    inline for (.{ "desc", "doc", "group", "update", "edit", "widget", "randomize", "order" }) |id| {
        defField(types.Param, &param, spec, id);
    }
    return param;
}

/// Helper to wrap options for a `choice` param spec. See docs there for code example.
pub inline fn options(items: []const types.Option) types.ConstOptionSlice {
    return types.ConstOptionSlice.wrap(items);
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
pub inline fn choice(spec: anytype) types.Param {
    var param = types.ChoiceParam{ .options = spec.options };
    defField(types.ChoiceParam, &param, spec, "default");
    return defParam("choice", spec, .{ .choice = param });
}

/// Defines a color param spec.
pub inline fn color(spec: anytype) types.Param {
    var param = types.ColorParam{};
    defField(types.ColorParam, &param, spec, "default");
    return defParam("color", spec, .{ .color = param });
}

/// Defines an image param spec.
pub inline fn image(spec: anytype) types.Param {
    if (spec.default.len != spec.width * spec.height) @compileError("wrong image data size");
    return defParam("image", spec, .{
        .image = types.ImageParam{
            .width = spec.width,
            .height = spec.height,
            .format = spec.format,
            .default = if (spec.format == .gray)
                types.ImageData{ .gray = types.ConstU8Slice.wrap(spec.default) }
            else
                types.ImageData{ .rgba = types.ConstU32Slice.wrap(spec.default) },
        },
    });
}

/// Defines a ramp param spec.
pub inline fn ramp(spec: anytype) types.Param {
    var param = types.RampParam{ .stops = types.ConstF64Slice.wrap(spec.stops) };
    defField(types.RampParam, &param, spec, "mode");
    return defParam("ramp", spec, .{ .ramp = param });
}

/// Defines a range param spec.
pub inline fn range(spec: anytype) types.Param {
    var param = types.RangeParam{};
    inline for (.{ "default", "min", "max", "step", "exponent" }) |id| {
        defField(types.RangeParam, &param, spec, id);
    }
    return defParam("range", spec, .{ .range = param });
}

/// Defines a text param spec.
pub inline fn text(spec: anytype) types.Param {
    var param = types.TextParam{};
    inline for (.{ "default", "match", "minLength", "maxLength", "multiline" }) |id| {
        defField(types.TextParam, &param, spec, id);
    }
    return defParam("text", spec, .{ .text = param });
}

/// Defines a toggle/checkbox param spec.
pub inline fn toggle(spec: anytype) types.Param {
    var param = types.ToggleParam{};
    defField(types.ToggleParam, &param, spec, "default");
    return defParam("toggle", spec, .{ .toggle = param });
}

/// Defines a n-dimensional vector param spec. Also see `xy()`.
pub inline fn vector(spec: anytype) types.Param {
    if (spec.default.len != spec.size) @compileError("wrong vector size");
    var param = types.VectorParam{
        .size = spec.size,
        .default = types.ConstF32Slice.wrap(spec.default),
    };
    inline for (.{ "min", "max", "step" }) |id| {
        defField(types.VectorParam, &param, spec, id);
    }
    return defParam("vector", spec, .{ .vector = param });
}

/// Defines a XY (2D vector) param spec. Also see `vector()`.
pub inline fn xy(spec: anytype) types.Param {
    var param = types.XYParam{};
    defField(types.XYParam, &param, spec, "default");
    return defParam("xy", spec, .{ .xy = param });
}
