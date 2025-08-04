import { describe, expect, test } from "vitest";
import { SchemaProcessor } from "../../src/schema-processor";
import type { OperationalMigration } from "../../src/schema-types";

describe("SchemaProcessor", () => {
	test("should initialize with empty schema", () => {
		const processor = new SchemaProcessor();
		const state = processor.getState();

		expect(state.tables).toEqual({});
	});

	test("should apply createTable operation", () => {
		const processor = new SchemaProcessor();
		const migration: OperationalMigration = {
			name: "test_migration",
			operations: [
				{
					type: "createTable",
					table: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
						email: { type: "TEXT", unique: true, nullable: false },
						name: { type: "TEXT", nullable: true },
					},
				},
			],
		};

		processor.applyMigration(migration);
		const state = processor.getState();

		expect(state.tables.users).toBeDefined();
		expect(state.tables.users.name).toBe("users");
		expect(state.tables.users.columns.id).toEqual({
			type: "TEXT",
			primaryKey: true,
			nullable: false,
		});
		expect(state.tables.users.columns.email).toEqual({
			type: "TEXT",
			unique: true,
			nullable: false,
		});
		expect(state.tables.users.columns.name).toEqual({
			type: "TEXT",
			nullable: true,
		});
	});

	test("should apply createIndex operation", () => {
		const processor = new SchemaProcessor();
		const migration: OperationalMigration = {
			name: "test_migration",
			operations: [
				{
					type: "createTable",
					table: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
						email: { type: "TEXT", nullable: false },
					},
				},
				{
					type: "createIndex",
					table: "users",
					index: { name: "idx_users_email", columns: ["email"] },
				},
			],
		};

		processor.applyMigration(migration);
		const state = processor.getState();

		expect(state.tables.users.indexes).toBeDefined();
		expect(state.tables.users.indexes).toHaveLength(1);
		expect(state.tables.users.indexes?.[0]).toEqual({
			name: "idx_users_email",
			columns: ["email"],
		});
	});

	test("should apply addColumn operation", () => {
		const processor = new SchemaProcessor();

		// First create the table
		const createTableMigration: OperationalMigration = {
			name: "create_table",
			operations: [
				{
					type: "createTable",
					table: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
					},
				},
			],
		};

		// Then add a column
		const addColumnMigration: OperationalMigration = {
			name: "add_column",
			operations: [
				{
					type: "addColumn",
					table: "users",
					column: "email",
					definition: { type: "TEXT", unique: true, nullable: false },
				},
			],
		};

		processor.applyMigration(createTableMigration);
		processor.applyMigration(addColumnMigration);

		const state = processor.getState();

		expect(state.tables.users.columns.email).toEqual({
			type: "TEXT",
			unique: true,
			nullable: false,
		});
	});

	test("should handle foreign key references", () => {
		const processor = new SchemaProcessor();
		const migration: OperationalMigration = {
			name: "test_migration",
			operations: [
				{
					type: "createTable",
					table: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
					},
				},
				{
					type: "createTable",
					table: "posts",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
						userId: {
							type: "TEXT",
							nullable: false,
							references: { table: "users", column: "id", onDelete: "CASCADE" },
						},
					},
				},
			],
		};

		processor.applyMigration(migration);
		const state = processor.getState();

		expect(state.tables.posts.columns.userId.references).toEqual({
			table: "users",
			column: "id",
			onDelete: "CASCADE",
		});
	});

	test("should throw error when creating duplicate table", () => {
		const processor = new SchemaProcessor();
		const migration: OperationalMigration = {
			name: "test_migration",
			operations: [
				{
					type: "createTable",
					table: "users",
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
					},
				},
				{
					type: "createTable",
					table: "users", // Duplicate table name
					columns: {
						id: { type: "TEXT", primaryKey: true, nullable: false },
					},
				},
			],
		};

		expect(() => {
			processor.applyMigration(migration);
		}).toThrow("Table users already exists");
	});

	test("should process multiple migrations in order", () => {
		const processor = new SchemaProcessor();

		const migrations: OperationalMigration[] = [
			{
				name: "create_users",
				operations: [
					{
						type: "createTable",
						table: "users",
						columns: {
							id: { type: "TEXT", primaryKey: true, nullable: false },
						},
					},
				],
			},
			{
				name: "add_email",
				operations: [
					{
						type: "addColumn",
						table: "users",
						column: "email",
						definition: { type: "TEXT", nullable: false },
					},
				],
			},
			{
				name: "create_posts",
				operations: [
					{
						type: "createTable",
						table: "posts",
						columns: {
							id: { type: "TEXT", primaryKey: true, nullable: false },
							userId: {
								type: "TEXT",
								nullable: false,
								references: { table: "users", column: "id" },
							},
						},
					},
				],
			},
		];

		processor.applyMigrations(migrations);
		const state = processor.getState();

		expect(Object.keys(state.tables)).toHaveLength(2);
		expect(state.tables.users.columns.email).toBeDefined();
		expect(state.tables.posts.columns.userId.references?.table).toBe("users");
	});
});
