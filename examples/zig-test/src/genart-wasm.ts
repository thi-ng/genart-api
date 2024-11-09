import {
	type IWasmAPI,
	type WasmBridge,
	type WasmExports,
	type WasmModuleSpec,
	type WasmType,
} from "@thi.ng/wasm-api";
import type { ParamSpecs, RandomFn } from "../../../dist/api.js";
import { $Param, type Param } from "./generated/api.js";

export * from "./generated/api.js";

export interface GenArtWasmAPIImports extends WebAssembly.ModuleImports {
	_setParams(specs: number, num: number, callback: number): void;
	_setUpdate(addr: number): void;
	_stringParamValue(id: number, slice: number, maxBytes: number): number;
	numberParamValue(id: number): number;
}

export interface GenArtWasmAPIExports extends WasmExports {
	_setParamsCallback(callback: number): void;
	_update(callback: number, t: number, frame: number): number;
}

export const GenArtWasmAPIModule: WasmModuleSpec<GenArtWasmAPIExports> = {
	id: "genart",
	factory: () => new GenArtWasmAPI(),
};

type ParamType = "choice" | "color" | "range";

export class GenArtWasmAPI implements IWasmAPI<GenArtWasmAPIExports> {
	parent!: WasmBridge<GenArtWasmAPIExports>;
	param!: (id: string, t?: number, rnd?: RandomFn) => any;
	$Param!: WasmType<Param>;
	async init(parent: WasmBridge<GenArtWasmAPIExports>) {
		this.parent = parent;
		await $genart.waitForAdapter();
		await $genart.waitForTimeProvider();
		this.$Param = $Param(parent);
		return true;
	}

	getImports(): GenArtWasmAPIImports {
		return {
			_setParams: (base, num, callback) => {
				const specs: ParamSpecs = {};
				for (let spec of this.$Param!.instanceArray(base, num)) {
					const type = <ParamType>spec.choice.type.deref();
					specs[spec.choice.id.deref()] = spec[type].asParam();
				}
				console.log(specs);
				(async () => {
					this.param = await $genart.setParams(specs);
					this.parent.exports._setParamsCallback(callback);
				})();
			},

			_stringParamValue: (id, valAddr, maxBytes) =>
				this.parent.setString(
					this.param(this.parent.getString(id)),
					valAddr,
					maxBytes,
					true
				),

			numberParamValue: (id) => this.param(this.parent.getString(id)),

			_setUpdate: (addr) => {
				$genart.setUpdate(
					(t, frame) => !!this.parent.exports._update(addr, t, frame)
				);
			},
		};
	}
}
