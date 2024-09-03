import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { resolve } from "node:path";

export default defineConfig({
	build: {
		target: "esnext",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				art: resolve(__dirname, "art.html"),
			},
		},
	},
	plugins: [createHtmlPlugin({ minify: true })],
});
