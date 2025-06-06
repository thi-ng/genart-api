import type { Param, ParamSpecs } from "./params.js";
import type { PRNG } from "./random.js";
import type { ScreenConfig } from "./screen.js";
import type { Traits } from "./traits.js";

/**
 * Platform defined presentation mode for the artwork:
 *
 * - `play`: default mode
 * - `preview`: capturing, thumbnail, etc.
 * - `edit`: platform has param editor active
 */
export type RunMode = "play" | "preview" | "edit";

/**
 * A plugin component responsible to implement and/or negotiate **any** platform
 * specific behavior of the overall {@link GenArtAPI} functionality. To
 * repurpose an artwork for a different platform, artist should only require to
 * switch out a single `<script>` tag in the HTML wrapper of their piece, but
 * otherwise require **zero** code changes.
 */
export interface PlatformAdapter {
	readonly mode: RunMode;
	readonly screen: ScreenConfig;
	readonly prng: PRNG;
	readonly seed: string;

	/**
	 * Human-readable but unique identifier for this platform adapter
	 * implementation.
	 *
	 * @remarks
	 * This ID should be derrived from the target art platform's name, domain
	 * name or package name, and can also include version info.
	 *
	 * External tooling (e.g. parameter editors) can utilize this information to
	 * inform/warn about compatibility. Also see {@link InfoMessage} for related
	 * use cases.
	 */
	readonly id: string;

	/**
	 * Platform supplied ID of the person/agent collecting/creating/minting the
	 * current artwork. Undefined if the platform doesn't support this concept.
	 *
	 * @remarks
	 * This API is not intended to be tied up with crypto/NFT-based concepts,
	 * even though currently it's likely only NFT platforms will or can provide
	 * this kind of information.
	 *
	 * Currently, there're no guarantees or constraints for this value. Even the
	 * concrete meaning & stability of a "collector" value here is also left
	 * wide open on purpose. For a custom digital art online store this could be
	 * the name of the collector/customer, but on supporting NFT platforms it
	 * would likely be the address of the person/agent who minted the artwork.
	 *
	 * Also see {@link PlatformAdapter.iteration}.
	 */
	readonly collector?: string;

	/**
	 * Platform supplied iteration number of the artwork's edition.
	 * Undefined if platform doesn't support this concept.
	 *
	 * @remarks
	 * Also see {@link PlatformAdapter.collector}.
	 */
	readonly iteration?: number;

	/**
	 * Called by {@link GenArtAPI.setParams} to receive parameter specs provided
	 * by the artwork and to allow the adapter to inject additional platform
	 * specific parameters into the given {@link ParamSpecs} object.
	 *
	 * @remarks
	 * **No platform-specific param initialization should happen at this
	 * stage.** The param specs passed to this function might be still not fully
	 * initialized (i.e. might still have missing default values). The same goes
	 * for any params injected here. Use {@link PlatformAdapter.initParams} for
	 * actual platform specific initialization (which will be called
	 * automatically if present, see lifecycle diagram).
	 *
	 * **If additional parameters are injected, the adapter MUST ensure their
	 * naming doesn't override existing params, i.e. these param names should be
	 * prefixed with a platform specific prefix (e.g. `foo:` or `__`)**
	 *
	 * @param params
	 */
	augmentParams?(params: ParamSpecs): ParamSpecs;

	/**
	 * Called by {@link GenArtAPI.setParams} to receive fully initialized
	 * parameter specs provided by the artwork (and possibly augmented by
	 * {@link PlatformAdapter.augmentParams}. This function allows the adapter
	 * to prepare itself for param initialization (e.g. initiating a network
	 * request for loading parameter overrides). This function is async and MUST
	 * throw an error if pre-initialization failed on the adapter's side.
	 *
	 * @remarks
	 * The actual value parsing of individual parameter customization only
	 * happens later via {@link PlatformAdapter.updateParam} (which is also
	 * indirectly called by {@link GenArtAPI.setParams} after this function
	 * returns).
	 *
	 * @param params
	 */
	initParams?(params: ParamSpecs): Promise<void>;

	/**
	 * Called by {@link GenArtAPI.updateParams} (and indirectly by
	 * {@link GenArtAPI.setParams}) to possibly augment/update a single param
	 * spec with any customizations sourced via platform-specific means (e.g.
	 * from URL query-string params).
	 *
	 * @remarks
	 * The function can return one of the following:
	 *
	 * 1. If the function returns `void`, no customizations found/performed and
	 *    no notifications will be triggered.
	 * 3. If the function returns `{ update: { key1: any, key2: any, ...} }`,
	 *    the given keys in the param spec will be modified/customized with
	 *    their new values via calling {@link GenArtAPI.setParamValue} for each
	 *    key-value pair. The keys to be updated MUST correspond to nested param
	 *    specs defined by the main param type's {@link ParamImpl.params},
	 *    otherwise an error will be thrown (see [Composite
	 *    parameters](https://github.com/thi-ng/genart-api/blob/main/README.md#composite-parameters)
	 *    for reference).
	 * 3. If the function returns `{ value: any }` and if that `value` is
	 *    non-nullish, the param spec will be updated via
	 *    {@link GenArtAPI.setParamValue}.
	 *
	 * If this function returned a `value` and/or `update`, and if the retured
	 * value(s) passed param type-specific validation (see
	 * {@link ParamImpl.validate}), then by default
	 * {@link GenArtAPI.setParamValue} emits a {@link ParamChangeMessage} message
	 * with the updated param spec.
	 *
	 * @param id
	 * @param spec
	 */
	updateParam(
		id: string,
		spec: Readonly<Param<any>>
	): Promise<{ value?: any; update?: Record<string, any> } | void>;

	/**
	 * See {@link GenArtAPI.setTraits}.
	 *
	 * @param traits
	 */
	setTraits?(traits: Traits): void;

	/**
	 * Platform-specific handler to deal with capturing a thumbnail/preview of
	 * the art piece. (e.g. by sending a message to the parent window). See
	 * {@link GenArtAPI.capture}.
	 *
	 * @param el
	 */
	capture(el?: HTMLCanvasElement | SVGElement): void;
}
