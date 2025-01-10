import type { WasmExports } from "@thi.ng/wasm-api";

export * from "./generated/api.js";

export interface GenArtWasmAPIImports extends WebAssembly.ModuleImports {
	_setParams(specs: number, num: number, callback: number): void;
	_setUpdate(addr: number): void;
	_stringParamValue(id: number, slice: number, maxBytes: number): number;
	numberParamValue(id: number): number;
	rampParamValue(id: number, t: number): number;
	toggleParamValue(id: number): number;
	_vectorParamValue(id: number, ptr: number): void;
}

export interface GenArtWasmAPIExports extends WasmExports {
	_setParamsCallback(callback: number): void;
	_update(callback: number, t: number, frame: number): number;
}
