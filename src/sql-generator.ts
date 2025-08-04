import type { SchemaState, ColumnDefinition, IndexDefinition } from "./schema-types.js";

/**
 * Generates SQL DDL statements from a schema state
 */
export class SQLGenerator {
	/**
	 * Generate complete SQL schema from schema state
	 */
	generateSchema(state: SchemaState): string {
		const statements: string[] = [];
		
		// Add header comment
		statements.push("-- Better Auth SQLite Schema");
		statements.push("-- Generated automatically - do not edit manually");
		statements.push("");

		// Generate CREATE TABLE statements
		for (const [tableName, table] of Object.entries(state.tables)) {
			statements.push(this.generateCreateTable(table));
			statements.push("");
		}

		// Generate CREATE INDEX statements
		for (const [tableName, table] of Object.entries(state.tables)) {
			if (table.indexes && table.indexes.length > 0) {
				for (const index of table.indexes) {
					statements.push(this.generateCreateIndex(tableName, index));
				}
				statements.push("");
			}
		}

		return statements.join("\n").trim();
	}

	/**
	 * Generate CREATE TABLE statement for a single table
	 */
	private generateCreateTable(table: { name: string; columns: Record<string, ColumnDefinition> }): string {
		const lines: string[] = [];
		lines.push(`CREATE TABLE IF NOT EXISTS "${table.name}" (`);

		const columnDefs: string[] = [];
		
		// Add columns
		for (const [columnName, column] of Object.entries(table.columns)) {
			columnDefs.push(this.generateColumnDefinition(columnName, column));
		}

		lines.push(columnDefs.map(def => `    ${def}`).join(",\n"));
		lines.push(");");

		return lines.join("\n");
	}

	/**
	 * Generate column definition SQL
	 */
	private generateColumnDefinition(columnName: string, column: ColumnDefinition): string {
		let definition = `"${columnName}"`;

		// Add type
		if (column.type === "VARCHAR" && column.length) {
			definition += ` VARCHAR(${column.length})`;
		} else if (column.type === "BOOLEAN") {
			// SQLite uses INTEGER for boolean
			definition += " INTEGER";
		} else {
			definition += ` ${column.type}`;
		}

		// Add constraints
		if (column.primaryKey) {
			definition += " PRIMARY KEY";
		}

		if (column.nullable === false || (column.nullable === undefined && !column.primaryKey)) {
			definition += " NOT NULL";
		}

		if (column.unique && !column.primaryKey) {
			definition += " UNIQUE";
		}

		// Add default value
		if (column.defaultValue !== undefined) {
			if (typeof column.defaultValue === "string") {
				if (column.defaultValue === "CURRENT_TIMESTAMP") {
					definition += " DEFAULT CURRENT_TIMESTAMP";
				} else {
					definition += ` DEFAULT '${column.defaultValue}'`;
				}
			} else if (typeof column.defaultValue === "number") {
				definition += ` DEFAULT ${column.defaultValue}`;
			} else if (typeof column.defaultValue === "boolean") {
				definition += ` DEFAULT ${column.defaultValue ? 1 : 0}`;
			} else if (column.defaultValue === null) {
				definition += " DEFAULT NULL";
			}
		}

		// Add foreign key reference
		if (column.references) {
			const { table, column: refColumn, onDelete, onUpdate } = column.references;
			definition += ` REFERENCES "${table}"("${refColumn}")`;
			
			if (onDelete) {
				definition += ` ON DELETE ${onDelete}`;
			}
			if (onUpdate) {
				definition += ` ON UPDATE ${onUpdate}`;
			}
		}

		return definition;
	}

	/**
	 * Generate CREATE INDEX statement
	 */
	private generateCreateIndex(tableName: string, index: IndexDefinition): string {
		const uniqueKeyword = index.unique ? "UNIQUE " : "";
		const columns = index.columns.map(col => `"${col}"`).join(", ");
		
		return `CREATE ${uniqueKeyword}INDEX IF NOT EXISTS "${index.name}" ON "${tableName}"(${columns});`;
	}
}