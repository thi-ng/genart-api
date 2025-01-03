const std = @import("std");
const bindgen = @import("wasm-api-bindgen");

pub const OptionSlice = bindgen.Slice([]Option, [*]Option);
pub const ConstOptionSlice = bindgen.Slice([]const Option, [*]const Option);

pub const U8Slice = bindgen.Slice([]u8, [*]u8);
pub const ConstU8Slice = bindgen.Slice([]const u8, [*]const u8);

pub const F64Slice = bindgen.Slice([]f64, [*]f64);
pub const ConstF64Slice = bindgen.Slice([]const f64, [*]const f64);

pub const UpdateBehavior = enum(u8) {
    event,
    reload,
};

pub const EditPermission = enum(u8) {
    private,
    protected,
    public,
};

/// Currently unused
pub const ImageFormat = enum(u8) {
    gray,
    rgb,
    argb,
};

pub const RampMode = enum(u8) {
    linear,
    smooth,
    exp,
};

pub const ParamWidgetType = enum(u8) {
    default,
    alt,
    precise,
};

pub const Param = extern struct {
    type: bindgen.ConstStringPtr,
    id: bindgen.ConstStringPtr,
    name: bindgen.ConstStringPtr,
    desc: bindgen.ConstStringPtr,
    doc: ?bindgen.ConstStringPtr = null,
    group: bindgen.ConstStringPtr = "main",
    update: UpdateBehavior = .event,
    edit: EditPermission = .protected,
    widget: ParamWidgetType = .default,
    randomize: u8 = 1,
    order: i8 = 0,
    body: ParamBody,
};

pub const ParamBody = extern union {
    choice: ChoiceParam,
    color: ColorParam,
    ramp: RampParam,
    range: RangeParam,
    text: TextParam,
    toggle: ToggleParam,
    xy: XYParam,
};

pub const ChoiceParam = extern struct {
    default: ?bindgen.ConstStringPtr = null,
    options: ConstOptionSlice,
};

pub const Option = extern struct {
    value: bindgen.ConstStringPtr,
    label: ?bindgen.ConstStringPtr = null,
};

pub const ColorParam = extern struct {
    default: ?bindgen.ConstStringPtr = null,
};

/// Currently only supports grayscale image data
pub const ImageParam = extern struct {
    default: ConstU8Slice,
    width: u16,
    height: u16,
};

pub const RampParam = extern struct {
    stops: ConstF64Slice,
    mode: RampMode = .linear,
};

pub const RangeParam = extern struct {
    default: f64 = std.math.inf(f64),
    min: f64 = 0,
    max: f64 = 100,
    step: f64 = 1,
    exponent: f64 = 1,
};

pub const TextParam = extern struct {
    default: bindgen.ConstStringPtr,
    match: ?bindgen.ConstStringPtr = null,
    minLength: u32 = 0,
    maxLength: u32 = 1024,
    multiline: u8 = 0,
};

pub const ToggleParam = extern struct {
    /// 0 = false, 1 = true, 255 = undefined
    default: u8 = 255,
};

pub const XYParam = extern struct {
    default: [2]f32 = [2]f32{ 0.5, 0.5 },
};
