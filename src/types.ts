import type { AdapterDebugLogs } from "better-auth/adapters";
import type { D1QB, QueryBuilder } from "workers-qb";

export interface D1Database {
	prepare(query: string): D1PreparedStatement;
	dump(): Promise<ArrayBuffer>;
	batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
	exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	first<T = unknown>(colName?: string): Promise<T | null>;
	run<T = unknown>(): Promise<D1Result<T>>;
	all<T = unknown>(): Promise<D1Result<T>>;
	raw<T = unknown[]>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
	results?: T[];
	success: boolean;
	error?: string;
	meta: {
		duration: number;
		size_after: number;
		rows_read: number;
		rows_written: number;
	};
}

export interface D1ExecResult {
	count: number;
	duration: number;
}

export interface WorkersQBAdapterConfig {
	database: D1Database | D1QB | QueryBuilder<any>;
	debugLogs?: AdapterDebugLogs;
	usePlural?: boolean;
	createSchema?: "sql" | "migrations";
}

export interface WhereCondition {
	[key: string]: unknown;
}

export interface CreateOptions {
	model: string;
	data: Record<string, unknown>;
	select?: string[];
}

export interface UpdateOptions {
	model: string;
	data: Record<string, unknown>;
	where: WhereCondition;
	select?: string[];
}

export interface UpdateManyOptions {
	model: string;
	data: Record<string, unknown>;
	where?: WhereCondition;
}

export interface DeleteOptions {
	model: string;
	where: WhereCondition;
}

export interface DeleteManyOptions {
	model: string;
	where?: WhereCondition;
}

export interface FindOneOptions {
	model: string;
	where: WhereCondition;
	select?: string[];
}

export interface FindManyOptions {
	model: string;
	where?: WhereCondition;
	select?: string[];
	limit?: number;
	offset?: number;
	orderBy?: { field: string; direction: "asc" | "desc" }[];
}

export interface CountOptions {
	model: string;
	where?: WhereCondition;
}
