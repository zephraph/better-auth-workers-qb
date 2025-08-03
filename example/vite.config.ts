import { defineConfig } from "vite";
import path from "path";

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
				configure: (proxy, options) => {
					proxy.on("error", (err, req, res) => {
						console.log("proxy error", err);
					});
					proxy.on("proxyReq", (proxyReq, req, res) => {
						console.log("Sending Request to the Target:", req.method, req.url);
					});
					proxy.on("proxyRes", (proxyRes, req, res) => {
						console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
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
