import type { BetterAuthDbSchema } from "better-auth/db";

export type TableSchema = BetterAuthDbSchema;

/**
 * Maps Better Auth field types to SQLite types
 */
const getSQLiteType = (
	fieldType: unknown,
	field?: Record<string, unknown>,
): string => {
	// Convert the field type to string for processing
	const typeStr = typeof fieldType === "string" ? fieldType : String(fieldType);

	// Handle array types
	if (typeStr.endsWith("[]")) {
		return "TEXT"; // Store arrays as JSON text in SQLite
	}

	switch (typeStr) {
		case "string":
			// Use VARCHAR if sortable is specified, otherwise TEXT
			return field?.sortable ? "VARCHAR(255)" : "TEXT";
		case "number":
			// Use BIGINT if bigint is specified, otherwise INTEGER
			return field?.bigint ? "BIGINT" : "INTEGER";
		case "boolean":
			return "INTEGER"; // SQLite uses INTEGER for boolean (0/1)
		case "date":
			return "TEXT"; // SQLite stores dates as ISO strings
		default:
			// Handle literal string arrays and other complex types
			if (Array.isArray(fieldType)) {
				return "TEXT"; // Store as JSON
			}
			return "TEXT"; // Default fallback
	}
};

/**
 * Generates a SQLite schema from Better Auth table definitions
 */
export const generateSQLSchema = (
	tables: TableSchema,
	usePlural = false,
): string => {
	let schema = "-- Better Auth SQLite Schema\n";
	schema += "-- Generated automatically - do not edit manually\n\n";

	// Sort tables by order if specified, to handle dependencies
	const sortedTables = Object.entries(tables).sort(([, a], [, b]) => {
		return (a.order || 0) - (b.order || 0);
	});

	for (const [tableName, table] of sortedTables) {
		const actualTableName = usePlural ? `${tableName}s` : tableName;
		schema += `CREATE TABLE IF NOT EXISTS "${actualTableName}" (\n`;

		const columns: string[] = [];
		const indexes: string[] = [];

		// Add primary key id field first
		columns.push('  "id" TEXT PRIMARY KEY');

		// Process each field
		for (const [fieldName, field] of Object.entries(table.fields)) {
			// Use custom field name if specified, otherwise use the field name
			const columnName = field.fieldName || fieldName;
			let columnDef = `  "${columnName}"`;

			// Add type
			columnDef += ` ${getSQLiteType(field.type, field)}`;

			// Handle NOT NULL constraint
			if (field.required !== false && !field.defaultValue) {
				columnDef += " NOT NULL";
			}

			// Handle UNIQUE constraint
			if (field.unique) {
				columnDef += " UNIQUE";
			}

			// Handle default values
			if (field.defaultValue !== undefined) {
				if (typeof field.defaultValue === "function") {
					// Handle function defaults - these would be handled at application level
					// but we can add some common SQL defaults
				} else if (typeof field.defaultValue === "string") {
					// Handle special functions
					if (
						field.defaultValue === "now()" ||
						field.defaultValue === "CURRENT_TIMESTAMP"
					) {
						columnDef += " DEFAULT CURRENT_TIMESTAMP";
					} else if (
						field.defaultValue === "uuid()" ||
						field.defaultValue === "cuid()"
					) {
						// For ID generation functions, we'll handle this in the application layer
						// but we can set a default value if needed
					} else {
						columnDef += ` DEFAULT '${field.defaultValue}'`;
					}
				} else if (typeof field.defaultValue === "number") {
					columnDef += ` DEFAULT ${field.defaultValue}`;
				} else if (typeof field.defaultValue === "boolean") {
					columnDef += ` DEFAULT ${field.defaultValue ? 1 : 0}`;
				}
			}

			// Handle foreign key references
			if (field.references) {
				const refTableName = usePlural
					? `${field.references.model}s`
					: field.references.model;
				const onDelete = field.references.onDelete
					? ` ON DELETE ${field.references.onDelete.toUpperCase()}`
					: "";
				columnDef += ` REFERENCES "${refTableName}"("${field.references.field}")${onDelete}`;
			}

			columns.push(columnDef);

			// Collect indexes for fields that should be indexed (references are typically indexed)
			if (field.references && !field.unique) {
				indexes.push(
					`CREATE INDEX IF NOT EXISTS "idx_${actualTableName}_${columnName}" ON "${actualTableName}"("${columnName}");`,
				);
			}
		}

		schema += columns.join(",\n");
		schema += "\n);\n\n";

		// Add indexes
		if (indexes.length > 0) {
			schema += `${indexes.join("\n")}\n\n`;
		}
	}

	return schema.trim();
};
