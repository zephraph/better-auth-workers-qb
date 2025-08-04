import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		target: "esnext",
		outDir: "dist",
	},
	server: {
		port: 5173,
		proxy: {
			"/api/auth": {
				target: "http://localhost:3001",
				changeOrigin: true,
				configure: (proxy, _options) => {
					proxy.on("error", (err, _req, _res) => {
						console.log("proxy error", err);
					});
					proxy.on("proxyReq", (_proxyReq, req, _res) => {
						console.log("Sending Request to the Target:", req.method, req.url);
					});
					proxy.on("proxyRes", (proxyRes, req, _res) => {
						console.log(
							"Received Response from the Target:",
							proxyRes.statusCode,
							req.url,
						);
					});
				},
			},
		},
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
