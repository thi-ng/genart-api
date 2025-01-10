import {
	GenArtWasmAPIModule,
	type GenArtWasmAPIExports,
} from "@genart-api/wasm";
import type { Fn0 } from "@thi.ng/api";
import { ConsoleLogger, ROOT } from "@thi.ng/logger";
import { WasmBridge } from "@thi.ng/wasm-api";
import {
	WasmCanvas2DModule,
	type WasmCanvas2DExports,
} from "@thi.ng/wasm-api-canvas";
import WASM_URL from "./main.wasm?url";

ROOT.set(new ConsoleLogger());

/**
 * Combined WASM exports of all API modules used, incl. any custom user defined
 * additions.
 *
 * @remarks
 * These are usually all functions/symbols which can be called/accessed from the
 * JS side.
 */
interface WasmApp extends GenArtWasmAPIExports, WasmCanvas2DExports {
	/**
	 * Custom user defined start function (see /zig/main.zig)
	 */
	start: Fn0<void>;
}

(async () => {
	// create new WASM bridge with extra API module
	// we pass an array of additional module declarations
	// see: https://docs.thi.ng/umbrella/wasm-api/interfaces/WasmModuleSpec.html
	const bridge = new WasmBridge<WasmApp>(
		[GenArtWasmAPIModule, WasmCanvas2DModule]
		// new ConsoleLogger("wasm")
	);
	// instantiate WASM module & bindings
	await bridge.instantiate(fetch(WASM_URL));

	// call WASM main function to kick off
	bridge.exports.start();
})();
