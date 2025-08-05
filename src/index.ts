import { createAdapter } from "better-auth/adapters";
import dedent from "dedent";
import { D1QB, type QueryBuilder } from "workers-qb";
import type { WorkersQBAdapterConfig } from "./types.js";
import { generateSQLSchema } from "./utils.js";

export const workersQBAdapter = (
	config: WorkersQBAdapterConfig,
): ReturnType<typeof createAdapter> =>
	createAdapter({
		config: {
			adapterId: "workers-qb",
			adapterName: "Workers QB",
			usePlural: config.usePlural ?? false,
			debugLogs: config.debugLogs ?? false,
		},
		adapter: ({ options: _options, schema: _schema }) => {
			const getQueryBuilder = (): D1QB | QueryBuilder<any> => {
				if ("prepare" in config.database) {
					// It's a D1Database
					return new D1QB(config.database);
				}
				// It's already a QueryBuilder instance
				return config.database as QueryBuilder<any>;
			};

			const qb = getQueryBuilder();

			return {
				async create({ model, data }) {
					const tableName = config.usePlural ? `${model}s` : model;

					const query = qb.insert({
						tableName,
						data,
						returning: "*",
					});

					const result = await query.execute();
					return result.results?.[0] || null;
				},

				async update({ model, where, update }) {
					const tableName = config.usePlural ? `${model}s` : model;

					const conditions = where.map(
						(w) => `${w.field} ${w.operator || "="} ?`,
					);
					const params = where.map((w) => w.value);

					const query = qb.update({
						tableName,
						data: update,
						where: {
							conditions,
							params,
						},
						returning: "*",
					});

					const result = await query.execute();
					return result.results?.[0] || null;
				},

				async updateMany({ model, where, update }) {
					const tableName = config.usePlural ? `${model}s` : model;

					const queryParams: Record<string, unknown> = {
						tableName,
						data: update,
					};

					if (where && where.length > 0) {
						const conditions = where.map(
							(w) => `${w.field} ${w.operator || "="} ?`,
						);
						const params = where.map((w) => w.value);
						queryParams.where = {
							conditions,
							params,
						};
					}

					const query = qb.update(queryParams);
					const result = await query.execute();

					return result.changes || 0;
				},

				async delete({ model, where }) {
					const tableName = config.usePlural ? `${model}s` : model;

					const conditions = where.map(
						(w) => `${w.field} ${w.operator || "="} ?`,
					);
					const params = where.map((w) => w.value);

					const query = qb.delete({
						tableName,
						where: {
							conditions,
							params,
						},
					});

					await query.execute();
					return;
				},

				async deleteMany({ model, where }) {
					const tableName = config.usePlural ? `${model}s` : model;

					const queryParams: Record<string, unknown> = {
						tableName,
						where: {
							conditions: ["1 = 1"],
							params: [],
						},
					};

					if (where && where.length > 0) {
						const conditions = where.map(
							(w) => `${w.field} ${w.operator || "="} ?`,
						);
						const params = where.map((w) => w.value);
						queryParams.where = {
							conditions,
							params,
						};
					}

					const query = qb.delete(queryParams);
					const result = await query.execute();

					return result.changes || 0;
				},

				async findOne({ model, where, select }) {
					const tableName = config.usePlural ? `${model}s` : model;

					const conditions = where.map(
						(w) => `${w.field} ${w.operator || "="} ?`,
					);
					const params = where.map((w) => w.value);

					const query = qb.fetchOne({
						tableName,
						fields: select || "*",
						where: {
							conditions,
							params,
						},
					});

					const result = await query.execute();
					return result.results || null;
				},

				async findMany({ model, where, limit, sortBy, offset }) {
					const tableName = config.usePlural ? `${model}s` : model;

					const queryParams: Record<string, unknown> = {
						tableName,
						fields: "*",
					};

					if (where && where.length > 0) {
						const conditions = where.map(
							(w) => `${w.field} ${w.operator || "="} ?`,
						);
						const params = where.map((w) => w.value);
						queryParams.where = {
							conditions,
							params,
						};
					}

					if (limit) {
						queryParams.limit = limit;
					}

					if (offset) {
						queryParams.offset = offset;
					}

					if (sortBy) {
						queryParams.orderBy = {
							[sortBy.field]: sortBy.direction.toUpperCase(),
						};
					}

					const query = qb.fetchAll(queryParams);
					const result = await query.execute();

					return result.results || [];
				},

				async count({ model, where }) {
					const tableName = config.usePlural ? `${model}s` : model;

					const queryParams: Record<string, unknown> = {
						tableName,
						fields: "COUNT(*) as count",
					};

					if (where && where.length > 0) {
						const conditions = where.map(
							(w) => `${w.field} ${w.operator || "="} ?`,
						);
						const params = where.map((w) => w.value);
						queryParams.where = {
							conditions,
							params,
						};
					}

					const query = qb.fetchOne(queryParams);
					const result = await query.execute();

					return result.results?.count || 0;
				},

				async createSchema({ file, tables }) {
					if (config.createSchema === "migrations") {
						// Generate operation-based migration file
						const { convertBetterAuthToOperations } = await import(
							"./schema-converter.js"
						);

						const operationalMigration = convertBetterAuthToOperations(
							tables,
							config.usePlural,
						);

						const migrationCode = dedent`
							// This file was automatically generated by better-auth-workers-qb
							// Do not edit this file manually

							import type { OperationalMigration } from './schema-types.js';

							export const createInitialTables: OperationalMigration = {
								name: '${operationalMigration.name}',
								operations: ${JSON.stringify(operationalMigration.operations, null, 2)}
							};

							export const migrations: OperationalMigration[] = [
								createInitialTables,
							];
						`;

						return {
							code: migrationCode,
							path: file || "migrations.ts",
							overwrite: true,
						};
					}

					// Default behavior - generate SQL file
					const schema = generateSQLSchema(tables, config.usePlural);
					return {
						code: schema,
						path: file || "schema.sql",
						overwrite: true,
					};
				},
			};
		},
	});

export default workersQBAdapter;
export { convertBetterAuthToOperations } from "./schema-converter.js";
export { SchemaProcessor } from "./schema-processor.js";
export * from "./schema-types.js";
export { SQLGenerator } from "./sql-generator.js";
export * from "./types.js";
export * from "./utils.js";
