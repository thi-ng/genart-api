/**
 * Screen/canvas configuration defined by the {@link PlatformAdapter} and
 * accessible by the artwork via {@link GenArtAPI.screen}. Artworks MUST use
 * this information provided rather than `window.innerWidfth` and
 * `window.innerHeight`.
 */
export interface ScreenConfig {
	/**
	 * Display width in CSS pixels.
	 */
	width: number;
	/**
	 * Display height in CSS pixels.
	 */
	height: number;
	/**
	 * Display device pixel ratio (i.e. HDPI multiplier)
	 */
	dpr: number;
}
