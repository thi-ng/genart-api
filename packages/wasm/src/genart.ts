import type { ParamSpecs, RandomFn } from "@genart-api/core";
import type {
	IWasmAPI,
	WasmBridge,
	WasmModuleSpec,
	WasmTypeBase,
} from "@thi.ng/wasm-api";
import {
	$Param,
	type GenArtWasmAPIExports,
	type GenArtWasmAPIImports,
	type ParamBody,
} from "./api.js";

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

			toggleParamValue: (id) => ~~this.param(this.parent.getString(id)),

			_vectorParamValue: (id, valAddr) =>
				this.parent.setF32Array(
					valAddr,
					this.param(this.parent.getString(id))
				),

			_imageParamValueGray: (id, valAddr) =>
				this.parent.setU8Array(
					valAddr,
					this.param(this.parent.getString(id))
				),

			_setUpdate: (addr) => {
				$genart.setUpdate(
					(t, frame) => !!this.parent.exports._update(addr, t, frame)
				);
			},
		};
	}
}
