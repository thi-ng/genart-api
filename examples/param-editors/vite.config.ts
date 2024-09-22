import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig({
	build: {
		target: "esnext",
		sourcemap: true,
	},
	plugins: [createHtmlPlugin({ minify: true })],
});
