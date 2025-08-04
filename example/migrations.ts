import type { OperationalMigration } from "./schema-types";

export const createInitialTables: OperationalMigration = {
	name: "0001_create_initial_tables",
	operations: [
		{
			type: "createTable",
			table: "user",
			columns: {
				id: { type: "TEXT", primaryKey: true, nullable: false },
				email: { type: "TEXT", unique: true, nullable: false },
				emailVerified: {
					type: "BOOLEAN",
					nullable: false,
					defaultValue: false,
				},
				name: { type: "TEXT", nullable: true },
				createdAt: { type: "INTEGER", nullable: false },
				updatedAt: { type: "INTEGER", nullable: false },
				image: { type: "TEXT", nullable: true },
			},
		},
		{
			type: "createTable",
			table: "session",
			columns: {
				id: { type: "TEXT", primaryKey: true, nullable: false },
				expiresAt: { type: "INTEGER", nullable: false },
				ipAddress: { type: "TEXT", nullable: true },
				userAgent: { type: "TEXT", nullable: true },
				userId: {
					type: "TEXT",
					nullable: false,
					references: { table: "user", column: "id", onDelete: "CASCADE" },
				},
			},
		},
		{
			type: "createTable",
			table: "account",
			columns: {
				id: { type: "TEXT", primaryKey: true, nullable: false },
				accountId: { type: "TEXT", nullable: false },
				providerId: { type: "TEXT", nullable: false },
				userId: {
					type: "TEXT",
					nullable: false,
					references: { table: "user", column: "id", onDelete: "CASCADE" },
				},
				accessToken: { type: "TEXT", nullable: true },
				refreshToken: { type: "TEXT", nullable: true },
				idToken: { type: "TEXT", nullable: true },
				expiresAt: { type: "INTEGER", nullable: true },
				password: { type: "TEXT", nullable: true },
			},
		},
		{
			type: "createTable",
			table: "verification",
			columns: {
				id: { type: "TEXT", primaryKey: true, nullable: false },
				identifier: { type: "TEXT", nullable: false },
				value: { type: "TEXT", nullable: false },
				expiresAt: { type: "INTEGER", nullable: false },
			},
		},
		{
			type: "createIndex",
			table: "session",
			index: { name: "idx_session_userId", columns: ["userId"] },
		},
		{
			type: "createIndex",
			table: "account",
			index: { name: "idx_account_userId", columns: ["userId"] },
		},
		{
			type: "createIndex",
			table: "verification",
			index: { name: "idx_verification_identifier", columns: ["identifier"] },
		},
	],
};

export const migrations: OperationalMigration[] = [createInitialTables];
