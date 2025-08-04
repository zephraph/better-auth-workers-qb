import type { 
	SchemaState, 
	MigrationOperation, 
	OperationalMigration,
	TableDefinition,
	ColumnDefinition,
	IndexDefinition 
} from "./schema-types.js";

/**
 * Processes migration operations to compute the final schema state
 */
export class SchemaProcessor {
	private state: SchemaState;

	constructor(initialState: SchemaState = { tables: {} }) {
		this.state = JSON.parse(JSON.stringify(initialState)); // Deep clone
	}

	/**
	 * Apply a single migration to the schema state
	 */
	applyMigration(migration: OperationalMigration): void {
		for (const operation of migration.operations) {
			this.applyOperation(operation);
		}
	}

	/**
	 * Apply multiple migrations in order to compute final schema state
	 */
	applyMigrations(migrations: OperationalMigration[]): void {
		for (const migration of migrations) {
			this.applyMigration(migration);
		}
	}

	/**
	 * Get the current schema state
	 */
	getState(): SchemaState {
		return JSON.parse(JSON.stringify(this.state)); // Return deep clone
	}

	/**
	 * Apply a single operation to the schema state
	 */
	private applyOperation(operation: MigrationOperation): void {
		switch (operation.type) {
			case "createTable":
				this.createTable(operation);
				break;
			case "dropTable":
				this.dropTable(operation);
				break;
			case "addColumn":
				this.addColumn(operation);
				break;
			case "dropColumn":
				this.dropColumn(operation);
				break;
			case "alterColumn":
				this.alterColumn(operation);
				break;
			case "createIndex":
				this.createIndex(operation);
				break;
			case "dropIndex":
				this.dropIndex(operation);
				break;
			default:
				throw new Error(`Unknown operation type: ${(operation as any).type}`);
		}
	}

	private createTable(operation: { table: string; columns: Record<string, ColumnDefinition>; indexes?: IndexDefinition[] }): void {
		if (this.state.tables[operation.table]) {
			throw new Error(`Table ${operation.table} already exists`);
		}

		this.state.tables[operation.table] = {
			name: operation.table,
			columns: { ...operation.columns },
			indexes: operation.indexes ? [...operation.indexes] : []
		};
	}

	private dropTable(operation: { table: string }): void {
		if (!this.state.tables[operation.table]) {
			throw new Error(`Table ${operation.table} does not exist`);
		}
		delete this.state.tables[operation.table];
	}

	private addColumn(operation: { table: string; column: string; definition: ColumnDefinition }): void {
		const table = this.state.tables[operation.table];
		if (!table) {
			throw new Error(`Table ${operation.table} does not exist`);
		}
		if (table.columns[operation.column]) {
			throw new Error(`Column ${operation.column} already exists in table ${operation.table}`);
		}
		table.columns[operation.column] = { ...operation.definition };
	}

	private dropColumn(operation: { table: string; column: string }): void {
		const table = this.state.tables[operation.table];
		if (!table) {
			throw new Error(`Table ${operation.table} does not exist`);
		}
		if (!table.columns[operation.column]) {
			throw new Error(`Column ${operation.column} does not exist in table ${operation.table}`);
		}
		delete table.columns[operation.column];
	}

	private alterColumn(operation: { table: string; column: string; definition: ColumnDefinition }): void {
		const table = this.state.tables[operation.table];
		if (!table) {
			throw new Error(`Table ${operation.table} does not exist`);
		}
		if (!table.columns[operation.column]) {
			throw new Error(`Column ${operation.column} does not exist in table ${operation.table}`);
		}
		table.columns[operation.column] = { ...operation.definition };
	}

	private createIndex(operation: { table: string; index: IndexDefinition }): void {
		const table = this.state.tables[operation.table];
		if (!table) {
			throw new Error(`Table ${operation.table} does not exist`);
		}
		if (!table.indexes) {
			table.indexes = [];
		}
		
		// Check if index already exists
		const existingIndex = table.indexes.find(idx => idx.name === operation.index.name);
		if (existingIndex) {
			throw new Error(`Index ${operation.index.name} already exists on table ${operation.table}`);
		}
		
		table.indexes.push({ ...operation.index });
	}

	private dropIndex(operation: { table: string; indexName: string }): void {
		const table = this.state.tables[operation.table];
		if (!table) {
			throw new Error(`Table ${operation.table} does not exist`);
		}
		if (!table.indexes) {
			return; // No indexes to drop
		}
		
		const indexIndex = table.indexes.findIndex(idx => idx.name === operation.indexName);
		if (indexIndex === -1) {
			throw new Error(`Index ${operation.indexName} does not exist on table ${operation.table}`);
		}
		
		table.indexes.splice(indexIndex, 1);
	}
}