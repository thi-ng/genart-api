import { defineConfig } from "vite";
// import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig({
	build: { target: "esnext" },
	// plugins: [createHtmlPlugin({ minify: true })],
});
