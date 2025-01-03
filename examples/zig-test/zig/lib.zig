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

inline fn defParam(typeID: [*:0]const u8, spec: anytype, body: anytype) api.Param {
    return .{
        .type = typeID,
        .id = spec.id,
        .name = spec.name,
        .desc = spec.desc,
        .doc = if (@hasField(@TypeOf(spec), "doc")) spec.doc else null,
        .group = if (@hasField(@TypeOf(spec), "group")) spec.group else "main",
        .update = if (@hasField(@TypeOf(spec), "update")) spec.update else .event,
        .edit = if (@hasField(@TypeOf(spec), "edit")) spec.edit else .protected,
        .widget = if (@hasField(@TypeOf(spec), "widget")) spec.widget else .default,
        .body = body,
    };
}

pub inline fn choice(spec: anytype) api.Param {
    return defParam("choice", spec, .{
        .choice = .{
            .options = api.ConstOptionSlice.wrap(spec.options),
            .default = if (@hasField(@TypeOf(spec), "default")) spec.default else null,
        },
    });
}

pub inline fn color(spec: anytype) api.Param {
    return defParam("color", spec, .{
        .color = .{
            .default = if (@hasField(@TypeOf(spec), "default")) spec.default else null,
        },
    });
}

pub inline fn ramp(spec: anytype) api.Param {
    return defParam("ramp", spec, .{
        .ramp = .{
            .stops = api.ConstF64Slice.wrap(spec.stops),
            .mode = if (@hasField(@TypeOf(spec), "mode")) spec.mode else .linear,
        },
    });
}

pub inline fn range(spec: anytype) api.Param {
    return defParam("range", spec, .{
        .range = .{
            .default = if (@hasField(@TypeOf(spec), "default")) spec.default else std.math.inf(f64),
            .min = if (@hasField(@TypeOf(spec), "min")) spec.min else 0,
            .max = if (@hasField(@TypeOf(spec), "max")) spec.max else 100,
            .step = if (@hasField(@TypeOf(spec), "step")) spec.step else 1,
            .exponent = if (@hasField(@TypeOf(spec), "exponent")) spec.exponent else 1,
        },
    });
}

pub inline fn text(spec: anytype) api.Param {
    return defParam("text", spec, .{
        .text = .{
            .default = if (@hasField(@TypeOf(spec), "default")) spec.default else std.math.inf(f64),
            .match = if (@hasField(@TypeOf(spec), "match")) spec.match else null,
            .minLength = if (@hasField(@TypeOf(spec), "minLength")) spec.minLength else 0,
            .maxLength = if (@hasField(@TypeOf(spec), "maxLength")) spec.maxLength else 0,
        },
    });
}

pub inline fn toggle(spec: anytype) api.Param {
    return defParam("toggle", spec, .{
        .toggle = .{
            .default = if (@hasField(@TypeOf(spec), "default")) spec.default else 255,
        },
    });
}

pub inline fn xy(spec: anytype) api.Param {
    return defParam("xy", spec, .{
        .xy = .{
            .default = if (@hasField(@TypeOf(spec), "default")) spec.default else [2]f32{ 0.5, 0.5 },
        },
    });
}
