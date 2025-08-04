import { describe, test, expect } from "bun:test";
import { convertBetterAuthToOperations } from "../../src/schema-converter";
import type { BetterAuthDbSchema } from "better-auth/db";

describe("Schema Converter", () => {
	test("should convert simple Better Auth table to operations", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				fields: {
					email: { type: "string", unique: true, required: true },
					name: { type: "string", required: false }
				}
			}
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema);

		expect(migration.name).toBe("0001_create_initial_tables");
		expect(migration.operations).toHaveLength(1);

		const createTableOp = migration.operations[0];
		expect(createTableOp.type).toBe("createTable");
		expect(createTableOp.table).toBe("user");

		if (createTableOp.type === "createTable") {
			expect(createTableOp.columns.id).toEqual({
				type: "TEXT",
				primaryKey: true,
				nullable: false
			});
			expect(createTableOp.columns.email).toEqual({
				type: "TEXT",
				unique: true,
				nullable: true // required: true maps to nullable: true in our system
			});
			expect(createTableOp.columns.name).toEqual({
				type: "TEXT",
				nullable: true
			});
		}
	});

	test("should handle foreign key references", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				fields: {
					email: { type: "string" }
				}
			},
			session: {
				fields: {
					userId: {
						type: "string",
						references: { model: "user", field: "id", onDelete: "cascade" }
					}
				}
			}
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema);

		expect(migration.operations).toHaveLength(3); // 2 tables + 1 index

		const sessionTableOp = migration.operations.find(
			op => op.type === "createTable" && op.table === "session"
		);

		expect(sessionTableOp).toBeDefined();
		if (sessionTableOp?.type === "createTable") {
			expect(sessionTableOp.columns.userId.references).toEqual({
				table: "user",
				column: "id",
				onDelete: "CASCADE"
			});
		}

		// Should create index for foreign key
		const indexOp = migration.operations.find(
			op => op.type === "createIndex"
		);
		expect(indexOp).toBeDefined();
		if (indexOp?.type === "createIndex") {
			expect(indexOp.table).toBe("session");
			expect(indexOp.index.name).toBe("idx_session_userId");
			expect(indexOp.index.columns).toEqual(["userId"]);
		}
	});

	test("should handle different field types", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				fields: {
					email: { type: "string", sortable: true },
					age: { type: "number" },
					salary: { type: "number", bigint: true },
					isActive: { type: "boolean" },
					createdAt: { type: "date" },
					tags: { type: "string[]" }
				}
			}
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema);
		const createTableOp = migration.operations[0];

		if (createTableOp.type === "createTable") {
			expect(createTableOp.columns.email.type).toBe("VARCHAR"); // sortable: true
			expect(createTableOp.columns.age.type).toBe("INTEGER");
			expect(createTableOp.columns.salary.type).toBe("BIGINT"); // bigint: true
			expect(createTableOp.columns.isActive.type).toBe("BOOLEAN");
			expect(createTableOp.columns.createdAt.type).toBe("TEXT");
			expect(createTableOp.columns.tags.type).toBe("TEXT"); // array type
		}
	});

	test("should handle default values", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				fields: {
					isActive: { type: "boolean", defaultValue: true },
					count: { type: "number", defaultValue: 0 },
					label: { type: "string", defaultValue: "user" },
					createdAt: { type: "date", defaultValue: "now()" }
				}
			}
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema);
		const createTableOp = migration.operations[0];

		if (createTableOp.type === "createTable") {
			expect(createTableOp.columns.isActive.defaultValue).toBe(true);
			expect(createTableOp.columns.count.defaultValue).toBe(0);
			expect(createTableOp.columns.label.defaultValue).toBe("user");
			expect(createTableOp.columns.createdAt.defaultValue).toBe("CURRENT_TIMESTAMP");
		}
	});

	test("should use custom field names", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				fields: {
					emailAddress: {
						type: "string",
						fieldName: "email",
						unique: true
					}
				}
			}
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema);
		const createTableOp = migration.operations[0];

		if (createTableOp.type === "createTable") {
			expect(createTableOp.columns.email).toBeDefined();
			expect(createTableOp.columns.emailAddress).toBeUndefined();
			expect(createTableOp.columns.email.unique).toBe(true);
		}
	});

	test("should handle table ordering", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			session: {
				order: 2,
				fields: {
					userId: { type: "string", references: { model: "user", field: "id" } }
				}
			},
			user: {
				order: 1,
				fields: {
					email: { type: "string" }
				}
			}
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema);

		// First operation should be creating user table (order: 1)
		const firstTableOp = migration.operations[0];
		expect(firstTableOp.type).toBe("createTable");
		if (firstTableOp.type === "createTable") {
			expect(firstTableOp.table).toBe("user");
		}

		// Second operation should be creating session table (order: 2)
		const secondTableOp = migration.operations[1];
		expect(secondTableOp.type).toBe("createTable");
		if (secondTableOp.type === "createTable") {
			expect(secondTableOp.table).toBe("session");
		}
	});

	test("should use plural table names when configured", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				fields: {
					email: { type: "string" }
				}
			}
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema, true); // usePlural = true

		const createTableOp = migration.operations[0];
		expect(createTableOp.type).toBe("createTable");
		if (createTableOp.type === "createTable") {
			expect(createTableOp.table).toBe("users"); // Pluralized
		}
	});

	test("should not create index for unique fields", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				fields: {
					email: {
						type: "string",
						unique: true,
						references: { model: "profile", field: "id" }
					}
				}
			}
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema);

		// Should not create index for unique foreign key
		const indexOps = migration.operations.filter(op => op.type === "createIndex");
		expect(indexOps).toHaveLength(0);
	});

	test("should convert complete Better Auth schema", () => {
		const betterAuthSchema: BetterAuthDbSchema = {
			user: {
				order: 1,
				fields: {
					email: { type: "string", unique: true, required: true },
					emailVerified: { type: "boolean", defaultValue: false },
					name: { type: "string", required: false },
					createdAt: { type: "number", required: true },
					updatedAt: { type: "number", required: true },
					image: { type: "string", required: false }
				}
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
						references: { model: "user", field: "id", onDelete: "cascade" }
					}
				}
			}
		};

		const migration = convertBetterAuthToOperations(betterAuthSchema);

		expect(migration.operations).toHaveLength(3); // 2 tables + 1 index

		// Verify user table
		const userTableOp = migration.operations.find(
			op => op.type === "createTable" && op.table === "user"
		);
		expect(userTableOp).toBeDefined();

		// Verify session table
		const sessionTableOp = migration.operations.find(
			op => op.type === "createTable" && op.table === "session"
		);
		expect(sessionTableOp).toBeDefined();

		// Verify index creation
		const indexOp = migration.operations.find(op => op.type === "createIndex");
		expect(indexOp).toBeDefined();
		if (indexOp?.type === "createIndex") {
			expect(indexOp.table).toBe("session");
			expect(indexOp.index.name).toBe("idx_session_userId");
		}
	});
});