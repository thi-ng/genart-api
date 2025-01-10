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

pub extern "genart" fn _xyParamValue(id: [*:0]const u8, val: [*]f32) void;

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

pub fn xyParamValue(name: [*:0]const u8, val: *[2]f32) void {
    _xyParamValue(name, val);
}

inline fn defField(comptime T: type, param: *T, spec: anytype, name: []const u8) void {
    if (@hasField(@TypeOf(spec), name)) @field(param, name) = @field(spec, name);
}

inline fn defParam(typeID: [*:0]const u8, spec: anytype, body: anytype) api.Param {
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

pub inline fn choice(spec: anytype) api.Param {
    var param = api.ChoiceParam{ .options = api.ConstOptionSlice.wrap(spec.options) };
    defField(api.ChoiceParam, &param, spec, "default");
    return defParam("choice", spec, .{ .choice = param });
}

pub inline fn color(spec: anytype) api.Param {
    var param = api.ColorParam{};
    defField(api.ColorParam, &param, spec, "default");
    return defParam("color", spec, .{ .color = param });
}

pub inline fn image(spec: anytype) api.Param {
    return defParam("image", spec, .{
        .image = api.ImageParam{
            .width = spec.width,
            .height = spec.height,
            .default = spec.default,
        },
    });
}

pub inline fn ramp(spec: anytype) api.Param {
    var param = api.RampParam{ .stops = api.ConstF64Slice.wrap(spec.stops) };
    defField(api.RampParam, &param, spec, "mode");
    return defParam("ramp", spec, .{ .ramp = param });
}

pub inline fn range(spec: anytype) api.Param {
    var param = api.RangeParam{};
    inline for (.{ "default", "min", "max", "step", "exponent" }) |id| {
        defField(api.RangeParam, &param, spec, id);
    }
    return defParam("range", spec, .{ .range = param });
}

pub inline fn text(spec: anytype) api.Param {
    var param = api.TextParam{};
    inline for (.{ "default", "match", "minLength", "maxLength", "multiline" }) |id| {
        defField(api.TextParam, &param, spec, id);
    }
    return defParam("text", spec, .{ .text = param });
}

pub inline fn toggle(spec: anytype) api.Param {
    var param = api.ToggleParam{};
    defField(api.ToggleParam, &param, spec, "default");
    return defParam("toggle", spec, .{ .toggle = param });
}

pub inline fn xy(spec: anytype) api.Param {
    var param = api.XYParam{};
    defField(api.XYParam, &param, spec, "default");
    return defParam("xy", spec, .{ .xy = param });
}
