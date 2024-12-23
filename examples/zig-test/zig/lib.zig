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

pub inline fn choice(spec: anytype) api.Param {
    return .{
        .type = "choice",
        .id = spec.id,
        .name = spec.name,
        .desc = spec.desc,
        .doc = if (@hasField(@TypeOf(spec), "doc")) spec.doc else null,
        .group = if (@hasField(@TypeOf(spec), "group")) spec.group else "main",
        .update = if (@hasField(@TypeOf(spec), "update")) spec.update else .event,
        .edit = if (@hasField(@TypeOf(spec), "edit")) spec.edit else .protected,
        .widget = if (@hasField(@TypeOf(spec), "widget")) spec.widget else .default,
        .body = .{
            .choice = .{
                .options = api.ConstOptionSlice.wrap(spec.options),
                .default = if (@hasField(@TypeOf(spec), "default")) spec.default else null,
            },
        },
    };
}

pub inline fn color(spec: anytype) api.Param {
    return .{
        .type = "color",
        .id = spec.id,
        .name = spec.name,
        .desc = spec.desc,
        .doc = if (@hasField(@TypeOf(spec), "doc")) spec.doc else null,
        .group = if (@hasField(@TypeOf(spec), "group")) spec.group else "main",
        .update = if (@hasField(@TypeOf(spec), "update")) spec.update else .event,
        .edit = if (@hasField(@TypeOf(spec), "edit")) spec.edit else .protected,
        .widget = if (@hasField(@TypeOf(spec), "widget")) spec.widget else .default,
        .body = .{
            .color = .{
                .default = if (@hasField(@TypeOf(spec), "default")) spec.default else null,
            },
        },
    };
}

pub inline fn ramp(spec: anytype) api.Param {
    return .{
        .type = "ramp",
        .id = spec.id,
        .name = spec.name,
        .desc = spec.desc,
        .doc = if (@hasField(@TypeOf(spec), "doc")) spec.doc else null,
        .group = if (@hasField(@TypeOf(spec), "group")) spec.group else "main",
        .update = if (@hasField(@TypeOf(spec), "update")) spec.update else .event,
        .edit = if (@hasField(@TypeOf(spec), "edit")) spec.edit else .protected,
        .widget = if (@hasField(@TypeOf(spec), "widget")) spec.widget else .default,
        .body = .{
            .ramp = .{
                .stops = api.ConstF64Slice.wrap(spec.stops),
                .mode = if (@hasField(@TypeOf(spec), "mode")) spec.mode else .linear,
            },
        },
    };
}

pub inline fn range(spec: anytype) api.Param {
    return .{
        .type = "range",
        .id = spec.id,
        .name = spec.name,
        .desc = spec.desc,
        .doc = if (@hasField(@TypeOf(spec), "doc")) spec.doc else null,
        .group = if (@hasField(@TypeOf(spec), "group")) spec.group else "main",
        .update = if (@hasField(@TypeOf(spec), "update")) spec.update else .event,
        .edit = if (@hasField(@TypeOf(spec), "edit")) spec.edit else .protected,
        .widget = if (@hasField(@TypeOf(spec), "widget")) spec.widget else .default,
        .body = .{
            .range = .{
                .default = if (@hasField(@TypeOf(spec), "default")) spec.default else std.math.inf(f64),
                .min = if (@hasField(@TypeOf(spec), "min")) spec.min else 0,
                .max = if (@hasField(@TypeOf(spec), "max")) spec.max else 100,
                .step = if (@hasField(@TypeOf(spec), "step")) spec.step else 1,
                .exponent = if (@hasField(@TypeOf(spec), "exponent")) spec.exponent else 1,
            },
        },
    };
}

pub inline fn text(spec: anytype) api.Param {
    return .{
        .type = "text",
        .id = spec.id,
        .name = spec.name,
        .desc = spec.desc,
        .doc = if (@hasField(@TypeOf(spec), "doc")) spec.doc else null,
        .group = if (@hasField(@TypeOf(spec), "group")) spec.group else "main",
        .update = if (@hasField(@TypeOf(spec), "update")) spec.update else .event,
        .edit = if (@hasField(@TypeOf(spec), "edit")) spec.edit else .protected,
        .widget = if (@hasField(@TypeOf(spec), "widget")) spec.widget else .default,
        .body = .{
            .text = .{
                .default = if (@hasField(@TypeOf(spec), "default")) spec.default else std.math.inf(f64),
                .match = if (@hasField(@TypeOf(spec), "match")) spec.match else null,
                .min = if (@hasField(@TypeOf(spec), "min")) spec.min else 0,
                .max = if (@hasField(@TypeOf(spec), "max")) spec.max else 0,
            },
        },
    };
}
