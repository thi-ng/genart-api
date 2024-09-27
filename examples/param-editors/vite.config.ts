import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { resolve } from "node:path";

export default defineConfig({
	build: {
		target: "esnext",
		// sourcemap: true,
	},
	// currently disabled: causing issues with loading iframe
	// plugins: [createHtmlPlugin({ minify: true })],
});
