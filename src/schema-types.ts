// Schema representation types
export interface ColumnDefinition {
	type: "TEXT" | "INTEGER" | "REAL" | "BLOB" | "BOOLEAN" | "BIGINT" | "VARCHAR";
	length?: number;
	nullable?: boolean;
	unique?: boolean;
	primaryKey?: boolean;
	defaultValue?: string | number | boolean | null;
	references?: {
		table: string;
		column: string;
		onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
		onUpdate?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
	};
}

export interface IndexDefinition {
	name: string;
	columns: string[];
	unique?: boolean;
}

export interface TableDefinition {
	name: string;
	columns: Record<string, ColumnDefinition>;
	indexes?: IndexDefinition[];
}

export interface SchemaState {
	tables: Record<string, TableDefinition>;
}

// Migration operation types
export type MigrationOperation = 
	| CreateTableOperation
	| DropTableOperation
	| AddColumnOperation
	| DropColumnOperation
	| AlterColumnOperation
	| CreateIndexOperation
	| DropIndexOperation;

export interface CreateTableOperation {
	type: "createTable";
	table: string;
	columns: Record<string, ColumnDefinition>;
	indexes?: IndexDefinition[];
}

export interface DropTableOperation {
	type: "dropTable";
	table: string;
}

export interface AddColumnOperation {
	type: "addColumn";
	table: string;
	column: string;
	definition: ColumnDefinition;
}

export interface DropColumnOperation {
	type: "dropColumn";
	table: string;
	column: string;
}

export interface AlterColumnOperation {
	type: "alterColumn";
	table: string;
	column: string;
	definition: ColumnDefinition;
}

export interface CreateIndexOperation {
	type: "createIndex";
	table: string;
	index: IndexDefinition;
}

export interface DropIndexOperation {
	type: "dropIndex";
	table: string;
	indexName: string;
}

// Migration definition
export interface OperationalMigration {
	name: string;
	operations: MigrationOperation[];
}