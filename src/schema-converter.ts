import type { BetterAuthDbSchema } from "better-auth/db";
import type {
	ColumnDefinition,
	MigrationOperation,
	OperationalMigration,
} from "./schema-types.js";

/**
 * Converts Better Auth table schema to migration operations
 */
export function convertBetterAuthToOperations(
	tables: BetterAuthDbSchema,
	usePlural = false,
): OperationalMigration {
	const operations: MigrationOperation[] = [];

	// Sort tables by order if specified, to handle dependencies
	const sortedTables = Object.entries(tables).sort(([, a], [, b]) => {
		return (a.order || 0) - (b.order || 0);
	});

	for (const [tableName, table] of sortedTables) {
		const actualTableName = usePlural ? `${tableName}s` : tableName;
		const columns: Record<string, ColumnDefinition> = {};

		// Always add primary key id field first
		columns.id = {
			type: "TEXT",
			primaryKey: true,
			nullable: false,
		};

		// Process each field
		for (const [fieldName, field] of Object.entries(table.fields)) {
			const columnName = field.fieldName || fieldName;
			columns[columnName] = convertFieldToColumn(field, usePlural);
		}

		// Create the table
		operations.push({
			type: "createTable",
			table: actualTableName,
			columns,
		});

		// Add indexes for foreign key references
		const indexes = [];
		for (const [fieldName, field] of Object.entries(table.fields)) {
			const columnName = field.fieldName || fieldName;
			if (field.references && !field.unique) {
				indexes.push({
					name: `idx_${actualTableName}_${columnName}`,
					columns: [columnName],
				});
			}
		}

		// Create indexes if any
		for (const index of indexes) {
			operations.push({
				type: "createIndex",
				table: actualTableName,
				index,
			});
		}
	}

	return {
		name: "0001_create_initial_tables",
		operations,
	};
}

/**
 * Convert Better Auth field definition to column definition
 */
function convertFieldToColumn(
	field: Record<string, unknown>,
	usePlural = false,
): ColumnDefinition {
	const column: ColumnDefinition = {
		type: mapBetterAuthType(field.type, field),
		nullable: field.required === false,
	};

	// Handle unique constraint
	if (field.unique) {
		column.unique = true;
	}

	// Handle default values
	if (field.defaultValue !== undefined) {
		if (typeof field.defaultValue === "function") {
			// Handle function defaults - some common SQL defaults
		} else if (typeof field.defaultValue === "string") {
			if (
				field.defaultValue === "now()" ||
				field.defaultValue === "CURRENT_TIMESTAMP"
			) {
				column.defaultValue = "CURRENT_TIMESTAMP";
			} else if (
				field.defaultValue !== "uuid()" &&
				field.defaultValue !== "cuid()"
			) {
				// For ID generation functions, we don't set a default in SQL
				column.defaultValue = field.defaultValue;
			}
		} else {
			column.defaultValue = field.defaultValue;
		}
	}

	// Handle foreign key references
	if (field.references) {
		const refTableName = usePlural
			? `${field.references.model}s`
			: field.references.model;
		column.references = {
			table: refTableName,
			column: field.references.field,
			onDelete: field.references.onDelete?.toUpperCase() as
				| "CASCADE"
				| "SET NULL"
				| "RESTRICT"
				| "NO ACTION",
		};
	}

	return column;
}

/**
 * Map Better Auth field types to SQLite types
 */
function mapBetterAuthType(
	fieldType: unknown,
	field?: Record<string, unknown>,
): ColumnDefinition["type"] {
	const typeStr = typeof fieldType === "string" ? fieldType : String(fieldType);

	// Handle array types
	if (typeStr.endsWith("[]")) {
		return "TEXT"; // Store arrays as JSON text in SQLite
	}

	switch (typeStr) {
		case "string":
			// Use VARCHAR if sortable is specified, otherwise TEXT
			return field?.sortable ? "VARCHAR" : "TEXT";
		case "number":
			// Use BIGINT if bigint is specified, otherwise INTEGER
			return field?.bigint ? "BIGINT" : "INTEGER";
		case "boolean":
			return "BOOLEAN"; // We'll convert this to INTEGER in SQL generation
		case "date":
			return "TEXT"; // SQLite stores dates as ISO strings
		default:
			// Handle literal string arrays and other complex types
			if (Array.isArray(fieldType)) {
				return "TEXT"; // Store as JSON
			}
			return "TEXT"; // Default fallback
	}
}
