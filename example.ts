import { betterAuth } from "better-auth";
import { workersQBAdapter } from "./src";

// Example Cloudflare Worker
interface Env {
  D1_DATABASE: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const auth = betterAuth({
      database: workersQBAdapter({
        database: env.D1_DATABASE,
        usePlural: false,
        debugLogs: true,
      }),
      // Other Better Auth configuration
      trustedOrigins: ["http://localhost:3000"],
    });

    return auth.handler(request);
  },
};