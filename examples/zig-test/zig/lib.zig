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

pub inline fn choice(spec: api.ChoiceParam) api.Param {
    return .{ .choice = spec };
}

pub inline fn color(spec: api.ColorParam) api.Param {
    return .{ .color = spec };
}

pub inline fn range(spec: api.RangeParam) api.Param {
    return .{ .range = spec };
}

/// Syntax sugar for: `ConstOptionSlice.wrap()`
pub inline fn options(items: []const api.Option) api.ConstOptionSlice {
    return api.ConstOptionSlice.wrap(items);
}
