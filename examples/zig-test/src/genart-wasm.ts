import type {
	IWasmAPI,
	WasmBridge,
	WasmExports,
	WasmModuleSpec,
	WasmTypeBase,
} from "@thi.ng/wasm-api";
import type { ParamSpecs, RandomFn } from "../../../dist/api.js";
import { $Param, type ParamBody } from "./generated/api.js";

export * from "./generated/api.js";

export interface GenArtWasmAPIImports extends WebAssembly.ModuleImports {
	_setParams(specs: number, num: number, callback: number): void;
	_setUpdate(addr: number): void;
	_stringParamValue(id: number, slice: number, maxBytes: number): number;
	numberParamValue(id: number): number;
	rampParamValue(id: number, t: number): number;
}

export interface GenArtWasmAPIExports extends WasmExports {
	_setParamsCallback(callback: number): void;
	_update(callback: number, t: number, frame: number): number;
}

export const GenArtWasmAPIModule: WasmModuleSpec<GenArtWasmAPIExports> = {
	id: "genart",
	factory: () => new GenArtWasmAPI(),
};

type ParamType = keyof Omit<ParamBody, keyof WasmTypeBase>;

export class GenArtWasmAPI implements IWasmAPI<GenArtWasmAPIExports> {
	parent!: WasmBridge<GenArtWasmAPIExports>;
	param!: (id: string, t?: number, rnd?: RandomFn) => any;

	async init(parent: WasmBridge<GenArtWasmAPIExports>) {
		this.parent = parent;
		await $genart.waitForAdapter();
		await $genart.waitForTimeProvider();
		return true;
	}

	getImports(): GenArtWasmAPIImports {
		return {
			_setParams: (base, num, callback) => {
				const specs: ParamSpecs = {};
				for (let spec of $Param(this.parent).instanceArray(base, num)) {
					const type = <ParamType>spec.type.deref();
					specs[spec.id.deref()] = spec.body[type].asParam(spec);
				}
				console.log(specs);
				(async () => {
					this.param = await $genart.setParams(specs);
					this.parent.exports._setParamsCallback(callback);
				})();
			},

			_stringParamValue: (idAddr, valAddr, maxBytes) =>
				this.parent.setString(
					this.param(this.parent.getString(idAddr)),
					valAddr,
					maxBytes,
					true
				),

			numberParamValue: (id) => this.param(this.parent.getString(id)),

			rampParamValue: (id, t) => this.param(this.parent.getString(id), t),

			_setUpdate: (addr) => {
				$genart.setUpdate(
					(t, frame) => !!this.parent.exports._update(addr, t, frame)
				);
			},
		};
	}
}
