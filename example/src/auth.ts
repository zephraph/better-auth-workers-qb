import { betterAuth } from "better-auth";
import { workersQBAdapter } from "better-auth-workers-qb";
import { D1QB } from "workers-qb";

const DB = new D1QB({});

export const auth = betterAuth({
	database: workersQBAdapter({
		database: DB,
		usePlural: false, // Use singular table names (user, session, etc.)
		debugLogs: false,
	}),

	// Email and password authentication
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},

	// Session configuration
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},

	// Security settings
	advanced: {
		useSecureCookie: false, // Set to true in production
		generateId: false, // Let better-auth generate IDs
	},
});

// Export types for use in your application
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
