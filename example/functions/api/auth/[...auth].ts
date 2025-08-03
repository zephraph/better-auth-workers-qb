import { betterAuth } from "better-auth";
import { workersQBAdapter } from "better-auth-workers-qb";

interface Env {
  DB: D1Database;
}

export async function onRequest(
  context: EventContext<Env, any, any>,
): Promise<Response> {
  // Inject the D1 database instance into the auth instance
  const authWithDB = betterAuth({
    database: workersQBAdapter({
      database: context.env.DB,
      usePlural: false,
      debugLogs: true,
    }),
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
  });

  return authWithDB.handler(context.request);
}
