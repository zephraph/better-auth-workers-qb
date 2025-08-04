import { describe, expect, test } from "vitest";
import type { SchemaState } from "../../src/schema-types";
import { SQLGenerator } from "../../src/sql-generator";

describe("SQLGenerator", () => {
	test("should generate CREATE TABLE statement for simple table", () => {
		const generator = new SQLGenerator();
		const state: SchemaState = {
			tables: {
				users: {
					name: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
						email: { type: "TEXT", unique: true, nullable: false },
						name: { type: "TEXT", nullable: true },
					},
				},
			},
		};

		const sql = generator.generateSchema(state);

		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "users" (');
		expect(sql).toContain('"id" TEXT PRIMARY KEY NOT NULL');
		expect(sql).toContain('"email" TEXT NOT NULL UNIQUE');
		expect(sql).toContain('"name" TEXT');
		expect(sql).not.toContain('"name" TEXT NOT NULL'); // Should be nullable
	});

	test("should generate foreign key references", () => {
		const generator = new SQLGenerator();
		const state: SchemaState = {
			tables: {
				users: {
					name: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
					},
				},
				posts: {
					name: "posts",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
						userId: {
							type: "TEXT",
							nullable: false,
							references: { table: "users", column: "id", onDelete: "CASCADE" },
						},
					},
				},
			},
		};

		const sql = generator.generateSchema(state);

		expect(sql).toContain('REFERENCES "users"("id") ON DELETE CASCADE');
	});

	test("should generate default values correctly", () => {
		const generator = new SQLGenerator();
		const state: SchemaState = {
			tables: {
				users: {
					name: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
						active: { type: "BOOLEAN", nullable: false, defaultValue: true },
						count: { type: "INTEGER", nullable: false, defaultValue: 0 },
						label: { type: "TEXT", nullable: true, defaultValue: "default" },
						createdAt: {
							type: "TEXT",
							nullable: false,
							defaultValue: "CURRENT_TIMESTAMP",
						},
					},
				},
			},
		};

		const sql = generator.generateSchema(state);

		expect(sql).toContain('"active" INTEGER NOT NULL DEFAULT 1'); // Boolean as INTEGER
		expect(sql).toContain('"count" INTEGER NOT NULL DEFAULT 0');
		expect(sql).toContain("\"label\" TEXT DEFAULT 'default'");
		expect(sql).toContain(
			'"createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
		);
	});

	test("should handle BOOLEAN type conversion to INTEGER", () => {
		const generator = new SQLGenerator();
		const state: SchemaState = {
			tables: {
				users: {
					name: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
						isActive: { type: "BOOLEAN", nullable: false },
						isVerified: {
							type: "BOOLEAN",
							nullable: true,
							defaultValue: false,
						},
					},
				},
			},
		};

		const sql = generator.generateSchema(state);

		expect(sql).toContain('"isActive" INTEGER NOT NULL');
		expect(sql).toContain('"isVerified" INTEGER DEFAULT 0');
		expect(sql).not.toContain("BOOLEAN"); // Should be converted to INTEGER
	});

	test("should generate VARCHAR with length", () => {
		const generator = new SQLGenerator();
		const state: SchemaState = {
			tables: {
				users: {
					name: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
						code: { type: "VARCHAR", length: 10, nullable: false },
					},
				},
			},
		};

		const sql = generator.generateSchema(state);

		expect(sql).toContain('"code" VARCHAR(10) NOT NULL');
	});

	test("should generate CREATE INDEX statements", () => {
		const generator = new SQLGenerator();
		const state: SchemaState = {
			tables: {
				users: {
					name: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
						email: { type: "TEXT", nullable: false },
					},
					indexes: [
						{ name: "idx_users_email", columns: ["email"] },
						{
							name: "idx_users_unique_email",
							columns: ["email"],
							unique: true,
						},
					],
				},
			},
		};

		const sql = generator.generateSchema(state);

		expect(sql).toContain(
			'CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");',
		);
		expect(sql).toContain(
			'CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_unique_email" ON "users"("email");',
		);
	});

	test("should generate composite indexes", () => {
		const generator = new SQLGenerator();
		const state: SchemaState = {
			tables: {
				users: {
					name: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
						firstName: { type: "TEXT", nullable: false },
						lastName: { type: "TEXT", nullable: false },
					},
					indexes: [
						{ name: "idx_users_name", columns: ["firstName", "lastName"] },
					],
				},
			},
		};

		const sql = generator.generateSchema(state);

		expect(sql).toContain(
			'CREATE INDEX IF NOT EXISTS "idx_users_name" ON "users"("firstName", "lastName");',
		);
	});

	test("should generate complete schema with header comments", () => {
		const generator = new SQLGenerator();
		const state: SchemaState = {
			tables: {
				users: {
					name: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
					},
				},
			},
		};

		const sql = generator.generateSchema(state);

		expect(sql).toMatch(/^-- Better Auth SQLite Schema/);
		expect(sql).toContain("-- Generated automatically - do not edit manually");
	});

	test("should handle empty schema", () => {
		const generator = new SQLGenerator();
		const state: SchemaState = { tables: {} };

		const sql = generator.generateSchema(state);

		expect(sql).toContain("-- Better Auth SQLite Schema");
		expect(sql).toContain("-- Generated automatically - do not edit manually");
		expect(
			sql.split("\n").filter((line) => line.trim().startsWith("CREATE")).length,
		).toBe(0);
	});

	test("should generate expected Better Auth schema", () => {
		const generator = new SQLGenerator();
		const state: SchemaState = {
			tables: {
				user: {
					name: "user",
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
				session: {
					name: "session",
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
					indexes: [{ name: "idx_session_userId", columns: ["userId"] }],
				},
			},
		};

		const sql = generator.generateSchema(state);

		// Verify user table
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "user" (');
		expect(sql).toContain('"emailVerified" INTEGER NOT NULL DEFAULT 0');

		// Verify session table with foreign key
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "session" (');
		expect(sql).toContain('REFERENCES "user"("id") ON DELETE CASCADE');

		// Verify index
		expect(sql).toContain(
			'CREATE INDEX IF NOT EXISTS "idx_session_userId" ON "session"("userId");',
		);

		// Should not contain any BOOLEAN types (converted to INTEGER)
		expect(sql).not.toContain("BOOLEAN");

		// Should have proper structure
		expect(sql.split("CREATE TABLE").length - 1).toBe(2); // 2 tables
		expect(sql.split("CREATE INDEX").length - 1).toBe(1); // 1 index
	});
});
