// @ts-ignore possibly includes unused imports
import { defType, Pointer, WasmStringPtr, type IWasmMemoryAccess, type MemorySlice, type MemoryView, type WasmTypeBase } from "@thi.ng/wasm-api";
// @ts-ignore
import { __array, __instanceArray, __slice32, __primslice32 } from "@thi.ng/wasm-api/memory";

// @ts-ignore possibly unused
const __str = (mem: IWasmMemoryAccess, base: number, isConst = true) => new WasmStringPtr(mem, base, isConst);

import type { ParamOpts } from "../../../../dist/api.js";

export enum UpdateBehavior {
	event,
	reload,
}

export enum EditPermission {
	private,
	protected,
	public,
}

/**
 * Currently unused
 */
export enum ImageFormat {
	gray,
	rgb,
	argb,
}

export enum RampMode {
	linear,
	smooth,
	exp,
}

export interface Param extends WasmTypeBase {
	readonly type: WasmStringPtr;
	readonly id: WasmStringPtr;
	readonly name: WasmStringPtr;
	readonly desc: WasmStringPtr;
	readonly doc: WasmStringPtr;
	readonly update: UpdateBehavior;
	readonly edit: EditPermission;
	/**
	 * Zig type: `u8`
	 */
	readonly randomize: number;
	readonly body: ParamBody;
	
	asParam(): ParamOpts;
	
}

// @ts-ignore possibly unused args
export const $Param = defType<Param>(8, 64, (mem, base) => {
	let $type: WasmStringPtr, $id: WasmStringPtr, $name: WasmStringPtr, $desc: WasmStringPtr, $doc: WasmStringPtr;
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
		get update(): UpdateBehavior {
			return mem.u8[(base + 20)];
		},
		get edit(): EditPermission {
			return mem.u8[(base + 21)];
		},
		get randomize(): number {
			return mem.u8[(base + 22)];
		},
		get body(): ParamBody {
			return $ParamBody(mem).instance((base + 24));
		},
		
		asParam(): ParamOpts {
			return {
				name: this.name.deref(),
				desc: this.desc.deref(),
				doc: this.doc.deref() || undefined,
				update: <any>UpdateBehavior[this.update],
				edit: <any>EditPermission[this.edit],
				randomize: !!this.randomize
			};
		}
		
	};
});

export interface ParamBody extends WasmTypeBase {
	readonly choice: ChoiceParam;
	readonly color: ColorParam;
	readonly ramp: RampParam;
	readonly range: RangeParam;
	readonly text: TextParam;
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
		get ramp(): RampParam {
			return $RampParam(mem).instance(base);
		},
		get range(): RangeParam {
			return $RangeParam(mem).instance(base);
		},
		get text(): TextParam {
			return $TextParam(mem).instance(base);
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

/**
 * Currently only supports grayscale image data
 */
export interface ImageParam extends WasmTypeBase {
	/**
	 * Zig type: `ConstU8Slice`
	 */
	readonly default: Uint8Array;
	/**
	 * Zig type: `u16`
	 */
	readonly width: number;
	/**
	 * Zig type: `u16`
	 */
	readonly height: number;
	
	asParam(parent: Param): ReturnType<typeof $genart.params.image>;
	
}

// @ts-ignore possibly unused args
export const $ImageParam = defType<ImageParam>(4, 12, (mem, base) => {
	return {
		get default(): Uint8Array {
			return __primslice32(mem, mem.u8, base, 0);
		},
		get width(): number {
			return mem.u16[(base + 8) >>> 1];
		},
		get height(): number {
			return mem.u16[(base + 10) >>> 1];
		},
		
		asParam(parent: Param) {
			return $genart.params.image({
				...parent.asParam(),
				//format: <any>ImageFormat[this.format],
				format: "gray",
				width: this.width,
				height: this.height,
				default: this.default,
			});
		}
		
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
				mode: <any>RampMode[this.mode],
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
	readonly min: number;
	/**
	 * Zig type: `u32`
	 */
	readonly max: number;
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
		get min(): number {
			return mem.u32[(base + 8) >>> 2];
		},
		get max(): number {
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
				min: this.min || undefined,
				max: this.max || undefined,
				multiline: !!this.multiline,
			});
		}
		
	};
});
