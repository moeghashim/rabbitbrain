import { fileURLToPath } from "node:url";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import manifest from "./manifest.config.js";

export default defineConfig({
	plugins: [react(), crx({ manifest })],
	resolve: {
		alias: {
			"@pi-starter/contracts": fileURLToPath(new URL("../../packages/contracts/src/index.ts", import.meta.url)),
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
});
