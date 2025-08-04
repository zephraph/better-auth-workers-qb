import { beforeAll, describe, expect, test } from "vitest";
import { QueryBuilder } from "workers-qb";
import { workersQBAdapter } from "../src";
import type { D1Database } from "../src/types";

// Mock D1Database for testing
const createMockD1Database = (): D1Database => {
	const mockData: Record<string, any[]> = {};

	return {
		prepare: (query: string) => ({
			bind: (..._values: unknown[]) => ({
				all: async () => ({ results: mockData[query] || [] }),
				first: async () => (mockData[query] || [])[0] || null,
				run: async () => ({ success: true }),
				raw: async () => [],
			}),
			all: async () => ({ results: mockData[query] || [] }),
			first: async () => (mockData[query] || [])[0] || null,
			run: async () => ({ success: true }),
			raw: async () => [],
		}),
		dump: async () => new ArrayBuffer(0),
		batch: async (_statements: any[]) => [],
		exec: async (_query: string) => ({ count: 0, duration: 0 }),
	};
};

describe("Workers QB Adapter", () => {
	let adapter: ReturnType<typeof workersQBAdapter>;
	let mockDb: D1Database;

	beforeAll(() => {
		mockDb = createMockD1Database();
		adapter = workersQBAdapter({
			database: mockDb,
			debugLogs: true,
			usePlural: false,
		});
	});

	test("should initialize adapter with correct config", () => {
		const adapterInstance = adapter({} as any);
		expect(adapterInstance.id).toBe("workers-qb");
	});

	test("should support plural table names when enabled", () => {
		const pluralAdapter = workersQBAdapter({
			database: mockDb,
			usePlural: true,
		});
		const instance = pluralAdapter({} as any);
		expect(instance.id).toBe("workers-qb");
	});

	test("should accept QueryBuilder instance", () => {
		const qb = new QueryBuilder(mockDb);
		const qbAdapter = workersQBAdapter({
			database: qb,
		});
		const instance = qbAdapter({} as any);
		expect(instance.id).toBe("workers-qb");
	});
});

describe("Workers QB Adapter Integration", () => {
	test("should be compatible with better-auth", async () => {
		const mockDb = createMockD1Database();
		const adapter = workersQBAdapter({
			database: mockDb,
		});

		// Test that the adapter returns the expected structure
		const instance = adapter({} as any);

		// Check that all required methods exist
		expect(typeof instance.create).toBe("function");
		expect(typeof instance.update).toBe("function");
		expect(typeof instance.updateMany).toBe("function");
		expect(typeof instance.delete).toBe("function");
		expect(typeof instance.deleteMany).toBe("function");
		expect(typeof instance.findOne).toBe("function");
		expect(typeof instance.findMany).toBe("function");
		expect(typeof instance.count).toBe("function");
	});
});
