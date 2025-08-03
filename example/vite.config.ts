import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
	build: {
		target: "esnext",
		outDir: "dist",
	},
	server: {
		port: 5173,
	},
	resolve: {
		alias: {
			"better-auth-workers-qb": path.resolve(__dirname, "../src/index.ts"),
		},
	},
	optimizeDeps: {
		exclude: ["@cloudflare/workers-types"],
	},
});
