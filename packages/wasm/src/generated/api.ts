// @ts-ignore possibly includes unused imports
import { defType, Pointer, WasmStringPtr, type IWasmMemoryAccess, type MemorySlice, type MemoryView, type WasmTypeBase, type WasmTypeKeys } from "@thi.ng/wasm-api";
// @ts-ignore
import { __array, __instanceArray, __slice32, __primslice32 } from "@thi.ng/wasm-api/memory";

// @ts-ignore possibly unused
const __str = (mem: IWasmMemoryAccess, base: number, isConst = true) => new WasmStringPtr(mem, base, isConst);

import type { ParamOpts } from "@genart-api/core";

export enum UpdateBehavior {
	event,
	reload,
}

export enum EditPermission {
	private,
	protected,
	public,
}

export enum ImageFormat {
	gray,
	rgba,
}

export enum RampMode {
	linear,
	smooth,
	exp,
}

export enum ParamWidgetType {
	default,
	alt,
	precise,
}

export interface Param extends WasmTypeBase {
	readonly type: WasmStringPtr;
	readonly id: WasmStringPtr;
	readonly name: WasmStringPtr;
	readonly desc: WasmStringPtr;
	readonly doc: WasmStringPtr;
	readonly group: WasmStringPtr;
	readonly update: UpdateBehavior;
	readonly edit: EditPermission;
	readonly widget: ParamWidgetType;
	/**
	 * Zig type: `u8`
	 */
	readonly randomize: number;
	/**
	 * Zig type: `i8`
	 */
	readonly order: number;
	readonly body: ParamBody;
	
	asParam(): ParamOpts;
	
}

// @ts-ignore possibly unused args
export const $Param = defType<Param>(8, 72, (mem, base) => {
	let $type: WasmStringPtr, $id: WasmStringPtr, $name: WasmStringPtr, $desc: WasmStringPtr, $doc: WasmStringPtr, $group: WasmStringPtr;
	return {
		get type(): WasmStringPtr {
			return $type || ($type = __str(mem, base));
		},
		get id(): WasmStringPtr {
			return $id || ($id = __str(mem, (base + 4)));
		},
		get name(): WasmStringPtr {
			return $name || ($name = __str(mem, (base + 8)));
		},
		get desc(): WasmStringPtr {
			return $desc || ($desc = __str(mem, (base + 12)));
		},
		get doc(): WasmStringPtr {
			return $doc || ($doc = __str(mem, (base + 16)));
		},
		get group(): WasmStringPtr {
			return $group || ($group = __str(mem, (base + 20)));
		},
		get update(): UpdateBehavior {
			return mem.u8[(base + 24)];
		},
		get edit(): EditPermission {
			return mem.u8[(base + 25)];
		},
		get widget(): ParamWidgetType {
			return mem.u8[(base + 26)];
		},
		get randomize(): number {
			return mem.u8[(base + 27)];
		},
		get order(): number {
			return mem.i8[(base + 28)];
		},
		get body(): ParamBody {
			return $ParamBody(mem).instance((base + 32));
		},
		
		asParam(): ParamOpts {
			return {
				name: this.name.deref(),
				desc: this.desc.deref(),
				doc: this.doc.deref() || undefined,
				group: this.group.deref(),
				update: <keyof typeof UpdateBehavior>UpdateBehavior[this.update],
				edit: <keyof typeof EditPermission>EditPermission[this.edit],
				widget: <keyof typeof ParamWidgetType>ParamWidgetType[this.widget],
				randomize: !!this.randomize,
				order: this.order,
			};
		}
		
	};
});

export interface ParamBody extends WasmTypeBase {
	readonly choice: ChoiceParam;
	readonly color: ColorParam;
	readonly image: ImageParam;
	readonly ramp: RampParam;
	readonly range: RangeParam;
	readonly text: TextParam;
	readonly toggle: ToggleParam;
	readonly vector: VectorParam;
	readonly xy: XYParam;
}

// @ts-ignore possibly unused args
export const $ParamBody = defType<ParamBody>(8, 40, (mem, base) => {
	return {
		get choice(): ChoiceParam {
			return $ChoiceParam(mem).instance(base);
		},
		get color(): ColorParam {
			return $ColorParam(mem).instance(base);
		},
		get image(): ImageParam {
			return $ImageParam(mem).instance(base);
		},
		get ramp(): RampParam {
			return $RampParam(mem).instance(base);
		},
		get range(): RangeParam {
			return $RangeParam(mem).instance(base);
		},
		get text(): TextParam {
			return $TextParam(mem).instance(base);
		},
		get toggle(): ToggleParam {
			return $ToggleParam(mem).instance(base);
		},
		get vector(): VectorParam {
			return $VectorParam(mem).instance(base);
		},
		get xy(): XYParam {
			return $XYParam(mem).instance(base);
		},
	};
});

export interface ChoiceParam extends WasmTypeBase {
	readonly default: WasmStringPtr;
	readonly options: Option[];
	
	asParam(parent: Param): ReturnType<typeof $genart.params.choice>;
	
}

// @ts-ignore possibly unused args
export const $ChoiceParam = defType<ChoiceParam>(4, 12, (mem, base) => {
	let $default: WasmStringPtr;
	return {
		get default(): WasmStringPtr {
			return $default || ($default = __str(mem, base));
		},
		get options(): Option[] {
			return __slice32(mem, $Option, (base + 4));
		},
		
		asParam(parent: Param) {
			return $genart.params.choice<string>({
				...parent.asParam(),
				default: this.default.deref() || undefined,
				options: this.options.map((x) => x.label.addr ? [x.value.deref(), x.label.deref()]: x.value.deref()),
			});
		}
		
	};
});

export interface Option extends WasmTypeBase {
	readonly value: WasmStringPtr;
	readonly label: WasmStringPtr;
}

// @ts-ignore possibly unused args
export const $Option = defType<Option>(4, 8, (mem, base) => {
	let $value: WasmStringPtr, $label: WasmStringPtr;
	return {
		get value(): WasmStringPtr {
			return $value || ($value = __str(mem, base));
		},
		get label(): WasmStringPtr {
			return $label || ($label = __str(mem, (base + 4)));
		},
	};
});

export interface ColorParam extends WasmTypeBase {
	readonly default: WasmStringPtr;
	
	asParam(parent: Param): ReturnType<typeof $genart.params.color>;
	
}

// @ts-ignore possibly unused args
export const $ColorParam = defType<ColorParam>(4, 4, (mem, base) => {
	let $default: WasmStringPtr;
	return {
		get default(): WasmStringPtr {
			return $default || ($default = __str(mem, base));
		},
		
		asParam(parent: Param) {
			return $genart.params.color({
				...parent.asParam(),
				default: this.default.deref() || undefined,
			});
		}
		
	};
});

export interface ImageParam extends WasmTypeBase {
	readonly default: ImageData;
	/**
	 * Zig type: `u16`
	 */
	readonly width: number;
	/**
	 * Zig type: `u16`
	 */
	readonly height: number;
	readonly format: ImageFormat;
	
	asParam(parent: Param): ReturnType<typeof $genart.params.image>;
	
}

// @ts-ignore possibly unused args
export const $ImageParam = defType<ImageParam>(4, 16, (mem, base) => {
	return {
		get default(): ImageData {
			return $ImageData(mem).instance(base);
		},
		get width(): number {
			return mem.u16[(base + 8) >>> 1];
		},
		get height(): number {
			return mem.u16[(base + 10) >>> 1];
		},
		get format(): ImageFormat {
			return mem.u8[(base + 12)];
		},
		
		asParam(parent: Param) {
			const format = <WasmTypeKeys<ImageData>>ImageFormat[this.format];
			return $genart.params.image({
				...parent.asParam(),
				format,
				width: this.width,
				height: this.height,
				default: this.default[format],
			});
		}
		
	};
});

export interface ImageData extends WasmTypeBase {
	/**
	 * Zig type: `ConstU8Slice`
	 */
	readonly gray: Uint8Array;
	/**
	 * Zig type: `ConstU32Slice`
	 */
	readonly rgba: Uint32Array;
}

// @ts-ignore possibly unused args
export const $ImageData = defType<ImageData>(4, 8, (mem, base) => {
	return {
		get gray(): Uint8Array {
			return __primslice32(mem, mem.u8, base, 0);
		},
		get rgba(): Uint32Array {
			return __primslice32(mem, mem.u32, base, 2);
		},
	};
});

export interface RampParam extends WasmTypeBase {
	/**
	 * Zig type: `ConstF64Slice`
	 */
	readonly stops: Float64Array;
	readonly mode: RampMode;
	
	asParam(parent: Param): ReturnType<typeof $genart.params.ramp>;
	
}

// @ts-ignore possibly unused args
export const $RampParam = defType<RampParam>(4, 12, (mem, base) => {
	return {
		get stops(): Float64Array {
			return __primslice32(mem, mem.f64, base, 3);
		},
		get mode(): RampMode {
			return mem.u8[(base + 8)];
		},
		
		asParam(parent: Param) {
			const src = this.stops;
			const stops: [number,number][] = [];
			for(let i = 0; i < src.length; i += 2) stops.push([src[i], src[i+1]]);
			return $genart.params.ramp({
				...parent.asParam(),
				mode: <keyof typeof RampMode>RampMode[this.mode],
				stops,
			});
		}
		
	};
});

export interface RangeParam extends WasmTypeBase {
	/**
	 * Zig type: `f64`
	 */
	readonly default: number;
	/**
	 * Zig type: `f64`
	 */
	readonly min: number;
	/**
	 * Zig type: `f64`
	 */
	readonly max: number;
	/**
	 * Zig type: `f64`
	 */
	readonly step: number;
	/**
	 * Zig type: `f64`
	 */
	readonly exponent: number;
	
	asParam(parent: Param): ReturnType<typeof $genart.params.range>;
	
}

// @ts-ignore possibly unused args
export const $RangeParam = defType<RangeParam>(8, 40, (mem, base) => {
	return {
		get default(): number {
			return mem.f64[base >>> 3];
		},
		get min(): number {
			return mem.f64[(base + 8) >>> 3];
		},
		get max(): number {
			return mem.f64[(base + 16) >>> 3];
		},
		get step(): number {
			return mem.f64[(base + 24) >>> 3];
		},
		get exponent(): number {
			return mem.f64[(base + 32) >>> 3];
		},
		
		asParam(parent: Param) {
			return $genart.params.range({
				...parent.asParam(),
				default: isFinite(this.default) ? this.default : undefined,
				min: this.min,
				max: this.max,
				step: this.step,
				exponent: this.exponent,
			});
		}
		
	};
});

export interface TextParam extends WasmTypeBase {
	readonly default: WasmStringPtr;
	readonly match: WasmStringPtr;
	/**
	 * Zig type: `u32`
	 */
	readonly minLength: number;
	/**
	 * Zig type: `u32`
	 */
	readonly maxLength: number;
	/**
	 * Zig type: `u8`
	 */
	readonly multiline: number;
	
	asParam(parent: Param): ReturnType<typeof $genart.params.text>;
	
}

// @ts-ignore possibly unused args
export const $TextParam = defType<TextParam>(4, 20, (mem, base) => {
	let $default: WasmStringPtr, $match: WasmStringPtr;
	return {
		get default(): WasmStringPtr {
			return $default || ($default = __str(mem, base));
		},
		get match(): WasmStringPtr {
			return $match || ($match = __str(mem, (base + 4)));
		},
		get minLength(): number {
			return mem.u32[(base + 8) >>> 2];
		},
		get maxLength(): number {
			return mem.u32[(base + 12) >>> 2];
		},
		get multiline(): number {
			return mem.u8[(base + 16)];
		},
		
		asParam(parent: Param) {
			return $genart.params.text({
				...parent.asParam(),
				default: this.default.deref(),
				match: this.match.deref() || undefined,
				minLength: this.minLength || undefined,
				maxLength: this.maxLength || undefined,
				multiline: !!this.multiline,
			});
		}
		
	};
});

export interface ToggleParam extends WasmTypeBase {
	/**
	 * 0 = false, 1 = true, 255 = undefined
	 * 
	 * @remarks
	 * Zig type: `u8`
	 */
	readonly default: number;
	
	asParam(parent: Param): ReturnType<typeof $genart.params.toggle>;
	
}

// @ts-ignore possibly unused args
export const $ToggleParam = defType<ToggleParam>(1, 1, (mem, base) => {
	return {
		get default(): number {
			return mem.u8[base];
		},
		
		asParam(parent: Param) {
			return $genart.params.toggle({
				...parent.asParam(),
				default: this.default === 255 ? undefined : this.default !== 0,
			});
		}
		
	};
});

export interface VectorParam extends WasmTypeBase {
	/**
	 * Zig type: `ConstF32Slice`
	 */
	readonly default: Float32Array;
	/**
	 * Zig type: `u32`
	 */
	readonly size: number;
	/**
	 * Zig type: `f32`
	 */
	readonly min: number;
	/**
	 * Zig type: `f32`
	 */
	readonly max: number;
	/**
	 * Zig type: `f32`
	 */
	readonly step: number;
	
	asParam(parent: Param): ReturnType<typeof $genart.params.xy>;
	
}

// @ts-ignore possibly unused args
export const $VectorParam = defType<VectorParam>(4, 24, (mem, base) => {
	return {
		get default(): Float32Array {
			return __primslice32(mem, mem.f32, base, 2);
		},
		get size(): number {
			return mem.u32[(base + 8) >>> 2];
		},
		get min(): number {
			return mem.f32[(base + 12) >>> 2];
		},
		get max(): number {
			return mem.f32[(base + 16) >>> 2];
		},
		get step(): number {
			return mem.f32[(base + 20) >>> 2];
		},
		
		asParam(parent: Param) {
			return $genart.params.vector({
				...parent.asParam(),
				size: this.size,
				default: [...this.default],
				min: this.min,
				max: this.max,
				step: this.step,
			});
		}
		
	};
});

export interface XYParam extends WasmTypeBase {
	/**
	 * Zig type: `[2]f32`
	 */
	readonly default: Float32Array;
	
	asParam(parent: Param): ReturnType<typeof $genart.params.xy>;
	
}

// @ts-ignore possibly unused args
export const $XYParam = defType<XYParam>(4, 8, (mem, base) => {
	return {
		get default(): Float32Array {
			const addr = base >>> 2;
			return mem.f32.subarray(addr, addr + 2);
		},
		
		asParam(parent: Param) {
			const [x, y] = this.default;
			return $genart.params.xy({
				...parent.asParam(),
				default: [x, y],
			});
		}
		
	};
});
