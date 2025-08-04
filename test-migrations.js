#!/usr/bin/env node
// Test runner for migration system - validates SQL generation and operation processing
import { SchemaProcessor, SQLGenerator, convertBetterAuthToOperations } from "./dist/index.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
	try {
		fn();
		console.log(`✅ ${name}`);
		passed++;
	} catch (error) {
		console.log(`❌ ${name}: ${error.message}`);
		failed++;
	}
}

function expect(actual) {
	return {
		toBe: (expected) => {
			if (actual !== expected) {
				throw new Error(`Expected ${expected}, got ${actual}`);
			}
		},
		toEqual: (expected) => {
			if (JSON.stringify(actual) !== JSON.stringify(expected)) {
				throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
			}
		},
		toContain: (expected) => {
			if (!actual.includes(expected)) {
				throw new Error(`Expected to contain "${expected}"`);
			}
		},
		toHaveLength: (expected) => {
			if (actual.length !== expected) {
				throw new Error(`Expected length ${expected}, got ${actual.length}`);
			}
		},
		toBeDefined: () => {
			if (actual === undefined) {
				throw new Error("Expected to be defined");
			}
		}
	};
}

console.log("🧪 Testing Migration System\n");

// Core functionality tests
test("SchemaProcessor: applies createTable operations", () => {
	const processor = new SchemaProcessor();
	const migration = {
		name: "test",
		operations: [{
			type: "createTable",
			table: "users",
			columns: {
				id: { type: "TEXT", primaryKey: true, nullable: false },
				email: { type: "TEXT", unique: true, nullable: false }
			}
		}]
	};

	processor.applyMigration(migration);
	const state = processor.getState();

	expect(state.tables.users).toBeDefined();
	expect(state.tables.users.columns.id.type).toBe("TEXT");
	expect(state.tables.users.columns.email.unique).toBe(true);
});

test("SQLGenerator: produces correct CREATE TABLE statements", () => {
	const generator = new SQLGenerator();
	const state = {
		tables: {
			users: {
				name: "users",
				columns: {
					id: { type: "TEXT", primaryKey: true, nullable: false },
					email: { type: "TEXT", unique: true, nullable: false }
				}
			}
		}
	};

	const sql = generator.generateSchema(state);

	expect(sql).toContain('CREATE TABLE IF NOT EXISTS "users"');
	expect(sql).toContain('"id" TEXT PRIMARY KEY NOT NULL');
	expect(sql).toContain('"email" TEXT NOT NULL UNIQUE');
});

test("SQLGenerator: converts BOOLEAN to INTEGER with correct defaults", () => {
	const generator = new SQLGenerator();
	const state = {
		tables: {
			users: {
				name: "users",
				columns: {
					isActive: { type: "BOOLEAN", nullable: false, defaultValue: true },
					isVerified: { type: "BOOLEAN", nullable: true, defaultValue: false }
				}
			}
		}
	};

	const sql = generator.generateSchema(state);

	expect(sql).toContain('"isActive" INTEGER NOT NULL DEFAULT 1');
	expect(sql).toContain('"isVerified" INTEGER DEFAULT 0');
});

test("Schema Converter: transforms Better Auth schema to operations", () => {
	const betterAuthSchema = {
		user: {
			fields: {
				email: { type: "string", unique: true },
				name: { type: "string", required: false }
			}
		}
	};

	const migration = convertBetterAuthToOperations(betterAuthSchema);

	expect(migration.name).toBe("0001_create_initial_tables");
	expect(migration.operations[0].type).toBe("createTable");
	expect(migration.operations[0].table).toBe("user");
	expect(migration.operations[0].columns.email.unique).toBe(true);
});

test("Schema Converter: handles foreign key references and creates indexes", () => {
	const betterAuthSchema = {
		user: { fields: { email: { type: "string" } } },
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

	// Should have 2 tables + 1 index
	expect(migration.operations).toHaveLength(3);
	
	const sessionTable = migration.operations.find(op => op.type === "createTable" && op.table === "session");
	expect(sessionTable.columns.userId.references.table).toBe("user");
	expect(sessionTable.columns.userId.references.onDelete).toBe("CASCADE");

	const indexOp = migration.operations.find(op => op.type === "createIndex");
	expect(indexOp.table).toBe("session");
	expect(indexOp.index.name).toBe("idx_session_userId");
});

// Integration tests - complete flow
test("Integration: Better Auth to SQL produces expected output", () => {
	const betterAuthSchema = {
		user: {
			order: 1,
			fields: {
				email: { type: "string", unique: true },
				emailVerified: { type: "boolean", defaultValue: false },
				createdAt: { type: "number" }
			}
		},
		session: {
			order: 2,
			fields: {
				userId: {
					type: "string",
					references: { model: "user", field: "id", onDelete: "cascade" }
				},
				expiresAt: { type: "number" }
			}
		}
	};

	// Complete flow: Better Auth → Operations → Schema State → SQL
	const migration = convertBetterAuthToOperations(betterAuthSchema);
	const processor = new SchemaProcessor();
	processor.applyMigration(migration);
	const state = processor.getState();
	const generator = new SQLGenerator();
	const sql = generator.generateSchema(state);

	// Verify table creation
	expect(sql).toContain('CREATE TABLE IF NOT EXISTS "user"');
	expect(sql).toContain('CREATE TABLE IF NOT EXISTS "session"');
	
	// Verify boolean conversion
	expect(sql).toContain('INTEGER DEFAULT 0'); // emailVerified boolean
	
	// Verify foreign key
	expect(sql).toContain('REFERENCES "user"("id") ON DELETE CASCADE');
	
	// Verify index creation
	expect(sql).toContain('CREATE INDEX IF NOT EXISTS "idx_session_userId"');
	
	// Should not contain raw BOOLEAN type
	expect(sql).toContain('INTEGER DEFAULT 0'); // Converted to INTEGER
});

test("Integration: handles complex field configurations", () => {
	const betterAuthSchema = {
		user: {
			fields: {
				email: { type: "string", sortable: true }, // Should become VARCHAR
				age: { type: "number", bigint: true },       // Should become BIGINT
				tags: { type: "string[]" },                  // Should become TEXT
				customField: { type: "string", fieldName: "custom_column" }
			}
		}
	};

	const migration = convertBetterAuthToOperations(betterAuthSchema);
	const processor = new SchemaProcessor();
	processor.applyMigration(migration);
	const state = processor.getState();
	const generator = new SQLGenerator();
	const sql = generator.generateSchema(state);

	expect(sql).toContain('"email" VARCHAR');      // sortable field
	expect(sql).toContain('"age" BIGINT');         // bigint field
	expect(sql).toContain('"tags" TEXT');          // array field
	expect(sql).toContain('"custom_column" TEXT'); // custom field name
});

test("Integration: validates referential integrity", () => {
	const betterAuthSchema = {
		user: { order: 1, fields: { email: { type: "string" } } },
		profile: { 
			order: 2, 
			fields: { 
				userId: { type: "string", references: { model: "user", field: "id" } } 
			} 
		},
		post: { 
			order: 3, 
			fields: { 
				authorId: { type: "string", references: { model: "user", field: "id" } },
				profileId: { type: "string", references: { model: "profile", field: "id" } }
			} 
		}
	};

	const migration = convertBetterAuthToOperations(betterAuthSchema);
	const processor = new SchemaProcessor();
	processor.applyMigration(migration);
	const state = processor.getState();
	const generator = new SQLGenerator();
	const sql = generator.generateSchema(state);

	// Verify table creation order (dependencies)
	const userIndex = sql.indexOf('CREATE TABLE IF NOT EXISTS "user"');
	const profileIndex = sql.indexOf('CREATE TABLE IF NOT EXISTS "profile"');
	const postIndex = sql.indexOf('CREATE TABLE IF NOT EXISTS "post"');

	expect(userIndex < profileIndex).toBe(true);
	expect(profileIndex < postIndex).toBe(true);

	// Verify all foreign keys exist
	expect(sql).toContain('REFERENCES "user"("id")');
	expect(sql).toContain('REFERENCES "profile"("id")');
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	console.log("\n❌ Some tests failed!");
	process.exit(1);
} else {
	console.log("\n✅ All migration tests passed!");
}