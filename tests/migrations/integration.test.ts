import type { BetterAuthDbSchema } from "better-auth/db";
import { describe, expect, test } from "vitest";
import { convertBetterAuthToOperations } from "../../src/schema-converter";
import { SchemaProcessor } from "../../src/schema-processor";
import { SQLGenerator } from "../../src/sql-generator";

describe("Migration Integration", () => {
	test("should convert Better Auth schema to SQL through complete flow", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				order: 1,
				fields: {
					email: { type: "string", unique: true, required: true },
					emailVerified: { type: "boolean", defaultValue: false },
					name: { type: "string", required: false },
					createdAt: { type: "number", required: true },
					updatedAt: { type: "number", required: true },
					image: { type: "string", required: false },
				},
			},
			session: {
				order: 2,
				fields: {
					expiresAt: { type: "number", required: true },
					ipAddress: { type: "string", required: false },
					userAgent: { type: "string", required: false },
					userId: {
						type: "string",
						required: true,
						references: { model: "user", field: "id", onDelete: "cascade" },
					},
				},
			},
			account: {
				order: 3,
				fields: {
					accountId: { type: "string", required: true },
					providerId: { type: "string", required: true },
					userId: {
						type: "string",
						required: true,
						references: { model: "user", field: "id", onDelete: "cascade" },
					},
					accessToken: { type: "string", required: false },
					refreshToken: { type: "string", required: false },
					idToken: { type: "string", required: false },
					expiresAt: { type: "number", required: false },
					password: { type: "string", required: false },
				},
			},
			verification: {
				order: 4,
				fields: {
					identifier: { type: "string", required: true },
					value: { type: "string", required: true },
					expiresAt: { type: "number", required: true },
				},
			},
		};

		// Step 1: Convert Better Auth schema to operations
		const migration = convertBetterAuthToOperations(betterAuthSchema);

		// Step 2: Apply operations to get schema state
		const processor = new SchemaProcessor();
		processor.applyMigration(migration);
		const schemaState = processor.getState();

		// Step 3: Generate SQL from schema state
		const sqlGenerator = new SQLGenerator();
		const sql = sqlGenerator.generateSchema(schemaState);

		// Verify the generated SQL contains expected structures
		expect(sql).toContain("-- Better Auth SQLite Schema");
		expect(sql).toContain("-- Generated automatically - do not edit manually");

		// User table
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "user" (');
		expect(sql).toContain('"id" TEXT PRIMARY KEY NOT NULL');
		expect(sql).toContain('"email" TEXT NOT NULL UNIQUE');
		expect(sql).toContain('"emailVerified" INTEGER NOT NULL DEFAULT 0');
		expect(sql).toContain('"name" TEXT');
		expect(sql).toContain('"createdAt" INTEGER NOT NULL');
		expect(sql).toContain('"updatedAt" INTEGER NOT NULL');
		expect(sql).toContain('"image" TEXT');

		// Session table
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "session" (');
		expect(sql).toContain('"expiresAt" INTEGER NOT NULL');
		expect(sql).toContain('"ipAddress" TEXT');
		expect(sql).toContain('"userAgent" TEXT');
		expect(sql).toContain('"userId" TEXT NOT NULL');
		expect(sql).toContain('REFERENCES "user"("id") ON DELETE CASCADE');

		// Account table
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "account" (');
		expect(sql).toContain('"accountId" TEXT NOT NULL');
		expect(sql).toContain('"providerId" TEXT NOT NULL');
		expect(sql).toContain('"accessToken" TEXT');
		expect(sql).toContain('"refreshToken" TEXT');
		expect(sql).toContain('"password" TEXT');

		// Verification table
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "verification" (');
		expect(sql).toContain('"identifier" TEXT NOT NULL');
		expect(sql).toContain('"value" TEXT NOT NULL');
		expect(sql).toContain('"expiresAt" INTEGER NOT NULL');

		// Indexes
		expect(sql).toContain(
			'CREATE INDEX IF NOT EXISTS "idx_session_userId" ON "session"("userId");',
		);
		expect(sql).toContain(
			'CREATE INDEX IF NOT EXISTS "idx_account_userId" ON "account"("userId");',
		);

		// Should not contain BOOLEAN types (converted to INTEGER)
		expect(sql).not.toContain("BOOLEAN");

		// Verify structure counts
		const tableCount = (sql.match(/CREATE TABLE/g) || []).length;
		const indexCount = (sql.match(/CREATE INDEX/g) || []).length;
		expect(tableCount).toBe(4);
		expect(indexCount).toBe(2); // Only foreign key indexes, not unique constraints
	});

	test("should generate identical SQL to existing migrations", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				order: 1,
				fields: {
					email: { type: "string", unique: true, required: true },
					emailVerified: { type: "boolean", defaultValue: false },
					name: { type: "string", required: false },
					createdAt: { type: "number", required: true },
					updatedAt: { type: "number", required: true },
					image: { type: "string", required: false },
				},
			},
			session: {
				order: 2,
				fields: {
					expiresAt: { type: "number", required: true },
					ipAddress: { type: "string", required: false },
					userAgent: { type: "string", required: false },
					userId: {
						type: "string",
						required: true,
						references: { model: "user", field: "id", onDelete: "cascade" },
					},
				},
			},
			account: {
				order: 3,
				fields: {
					accountId: { type: "string", required: true },
					providerId: { type: "string", required: true },
					userId: {
						type: "string",
						required: true,
						references: { model: "user", field: "id", onDelete: "cascade" },
					},
					accessToken: { type: "string", required: false },
					refreshToken: { type: "string", required: false },
					idToken: { type: "string", required: false },
					expiresAt: { type: "number", required: false },
					password: { type: "string", required: false },
				},
			},
			verification: {
				order: 4,
				fields: {
					identifier: { type: "string", required: true },
					value: { type: "string", required: true },
					expiresAt: { type: "number", required: true },
				},
			},
		};

		// Generate SQL through operation flow
		const migration = convertBetterAuthToOperations(betterAuthSchema);
		const processor = new SchemaProcessor();
		processor.applyMigration(migration);
		const schemaState = processor.getState();
		const sqlGenerator = new SQLGenerator();
		const operationBasedSQL = sqlGenerator.generateSchema(schemaState);

		// Key characteristics that should match
		const expectedPatterns = [
			/CREATE TABLE IF NOT EXISTS "user"/,
			/CREATE TABLE IF NOT EXISTS "session"/,
			/CREATE TABLE IF NOT EXISTS "account"/,
			/CREATE TABLE IF NOT EXISTS "verification"/,
			/"emailVerified" INTEGER NOT NULL DEFAULT 0/,
			/REFERENCES "user"\("id"\) ON DELETE CASCADE/,
			/CREATE INDEX IF NOT EXISTS "idx_session_userId"/,
			/CREATE INDEX IF NOT EXISTS "idx_account_userId"/,
		];

		for (const pattern of expectedPatterns) {
			expect(operationBasedSQL).toMatch(pattern);
		}

		// Should have the right number of tables and indexes
		const tables = operationBasedSQL.match(/CREATE TABLE/g) || [];
		const indexes = operationBasedSQL.match(/CREATE INDEX/g) || [];
		expect(tables.length).toBe(4);
		expect(indexes.length).toBe(2);
	});

	test("should handle plural table names in complete flow", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				fields: {
					email: { type: "string" },
				},
			},
			session: {
				fields: {
					userId: {
						type: "string",
						references: { model: "user", field: "id" },
					},
				},
			},
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema, true); // usePlural = true
		const processor = new SchemaProcessor();
		processor.applyMigration(migration);
		const schemaState = processor.getState();
		const sqlGenerator = new SQLGenerator();
		const sql = sqlGenerator.generateSchema(schemaState);

		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "users" (');
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "sessions" (');
		expect(sql).toContain('REFERENCES "users"("id")');
		expect(sql).toContain(
			'CREATE INDEX IF NOT EXISTS "idx_sessions_userId" ON "sessions"("userId")',
		);
	});

	test("should maintain referential integrity throughout migration", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				order: 1,
				fields: {
					email: { type: "string" },
				},
			},
			profile: {
				order: 2,
				fields: {
					userId: {
						type: "string",
						references: { model: "user", field: "id", onDelete: "cascade" },
					},
				},
			},
			post: {
				order: 3,
				fields: {
					authorId: {
						type: "string",
						references: { model: "user", field: "id", onDelete: "set null" },
					},
					profileId: {
						type: "string",
						references: { model: "profile", field: "id", onDelete: "restrict" },
					},
				},
			},
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema);
		const processor = new SchemaProcessor();
		processor.applyMigration(migration);
		const schemaState = processor.getState();
		const sqlGenerator = new SQLGenerator();
		const sql = sqlGenerator.generateSchema(schemaState);

		// Verify all foreign key constraints are present
		expect(sql).toContain('REFERENCES "user"("id") ON DELETE CASCADE');
		expect(sql).toContain('REFERENCES "user"("id") ON DELETE SET NULL');
		expect(sql).toContain('REFERENCES "profile"("id") ON DELETE RESTRICT');

		// Verify tables are created in dependency order
		const userTableIndex = sql.indexOf('CREATE TABLE IF NOT EXISTS "user"');
		const profileTableIndex = sql.indexOf(
			'CREATE TABLE IF NOT EXISTS "profile"',
		);
		const postTableIndex = sql.indexOf('CREATE TABLE IF NOT EXISTS "post"');

		expect(userTableIndex).toBeLessThan(profileTableIndex);
		expect(profileTableIndex).toBeLessThan(postTableIndex);
	});

	test("should handle complex field configurations", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				fields: {
					email: { type: "string", unique: true, sortable: true },
					age: { type: "number", bigint: true },
					metadata: { type: "string[]" },
					isActive: { type: "boolean", defaultValue: true },
					createdAt: { type: "date", defaultValue: "now()" },
					customField: { type: "string", fieldName: "custom_column" },
				},
			},
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema);
		const processor = new SchemaProcessor();
		processor.applyMigration(migration);
		const schemaState = processor.getState();
		const sqlGenerator = new SQLGenerator();
		const sql = sqlGenerator.generateSchema(schemaState);

		expect(sql).toContain('"email" VARCHAR NOT NULL UNIQUE'); // sortable: true
		expect(sql).toContain('"age" BIGINT'); // bigint: true
		expect(sql).toContain('"metadata" TEXT'); // array type
		expect(sql).toContain('"isActive" INTEGER NOT NULL DEFAULT 1'); // boolean with default
		expect(sql).toContain(
			'"createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
		); // date with now()
		expect(sql).toContain('"custom_column" TEXT'); // custom field name
		expect(sql).not.toContain('"customField"'); // Original name should not appear
	});
});
