import type { GenArtAPI } from "./api.js";

declare global {
	/**
	 * Globally exposed singleton instance of {@link GenArtAPI}
	 */
	var $genart: GenArtAPI;
}
