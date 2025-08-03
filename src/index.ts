import { createAdapter } from "better-auth/adapters";
import { D1QB, QueryBuilder } from "workers-qb";
import type { 
  WorkersQBAdapterConfig,
  D1Database 
} from "./types";

export const workersQBAdapter = (config: WorkersQBAdapterConfig): ReturnType<typeof createAdapter> =>
  createAdapter({
    config: {
      adapterId: "workers-qb",
      adapterName: "Workers QB",
      usePlural: config.usePlural ?? false,
      debugLogs: config.debugLogs ?? false,
    },
    adapter: ({ options, schema }) => {
      const getQueryBuilder = (): any => {
        if ("prepare" in config.database) {
          // It's a D1Database
          return new D1QB(config.database);
        }
        // It's already a QueryBuilder instance
        return config.database as QueryBuilder<any>;
      };

      const qb = getQueryBuilder();

      return {
        create: async ({ 
          model, 
          data, 
          select 
        }: { 
          model: string; 
          data: any; 
          select?: string[] 
        }) => {
          const tableName = config.usePlural ? `${model}s` : model;
          
          const query = qb.insert({
            tableName,
            data,
            returning: "*"
          });

          const result = await query.execute();
          return result.results?.[0] || null;
        },

        update: async ({ 
          model, 
          where, 
          update 
        }: { 
          model: string; 
          where: any[]; 
          update: any 
        }) => {
          const tableName = config.usePlural ? `${model}s` : model;
          
          const conditions = where.map(w => `${w.field} ${w.operator || "="} ?`);
          const params = where.map(w => w.value);
          
          const query = qb.update({
            tableName,
            data: update,
            where: {
              conditions,
              params
            },
            returning: "*"
          });
          
          const result = await query.execute();
          return result.results?.[0] || null;
        },

        updateMany: async ({ 
          model, 
          where, 
          update 
        }: { 
          model: string; 
          where: any[]; 
          update: Record<string, any> 
        }) => {
          const tableName = config.usePlural ? `${model}s` : model;
          
          let queryParams: any = {
            tableName,
            data: update
          };
          
          if (where && where.length > 0) {
            const conditions = where.map(w => `${w.field} ${w.operator || "="} ?`);
            const params = where.map(w => w.value);
            queryParams.where = {
              conditions,
              params
            };
          }
          
          const query = qb.update(queryParams);
          const result = await query.execute();
          
          return result.changes || 0;
        },

        delete: async ({ 
          model, 
          where 
        }: { 
          model: string; 
          where: any[] 
        }) => {
          const tableName = config.usePlural ? `${model}s` : model;
          
          const conditions = where.map(w => `${w.field} ${w.operator || "="} ?`);
          const params = where.map(w => w.value);
          
          const query = qb.delete({
            tableName,
            where: {
              conditions,
              params
            }
          });
          
          await query.execute();
          return;
        },

        deleteMany: async ({ 
          model, 
          where 
        }: { 
          model: string; 
          where: any[] 
        }) => {
          const tableName = config.usePlural ? `${model}s` : model;
          
          let queryParams: any = {
            tableName,
            where: {
              conditions: ["1 = 1"],
              params: []
            }
          };
          
          if (where && where.length > 0) {
            const conditions = where.map(w => `${w.field} ${w.operator || "="} ?`);
            const params = where.map(w => w.value);
            queryParams.where = {
              conditions,
              params
            };
          }
          
          const query = qb.delete(queryParams);
          const result = await query.execute();
          
          return result.changes || 0;
        },

        findOne: async ({ 
          model, 
          where, 
          select 
        }: { 
          model: string; 
          where: any[]; 
          select?: string[] 
        }) => {
          const tableName = config.usePlural ? `${model}s` : model;
          
          const conditions = where.map(w => `${w.field} ${w.operator || "="} ?`);
          const params = where.map(w => w.value);
          
          const query = qb.fetchOne({
            tableName,
            fields: select || "*",
            where: {
              conditions,
              params
            }
          });
          
          const result = await query.execute();
          return result.results || null;
        },

        findMany: async ({ 
          model, 
          where, 
          limit, 
          sortBy, 
          offset 
        }: { 
          model: string; 
          where?: any[]; 
          limit: number; 
          sortBy?: { 
            field: string; 
            direction: "asc" | "desc" 
          }; 
          offset?: number 
        }) => {
          const tableName = config.usePlural ? `${model}s` : model;
          
          let queryParams: any = {
            tableName,
            fields: "*"
          };
          
          if (where && where.length > 0) {
            const conditions = where.map(w => `${w.field} ${w.operator || "="} ?`);
            const params = where.map(w => w.value);
            queryParams.where = {
              conditions,
              params
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
              [sortBy.field]: sortBy.direction.toUpperCase()
            };
          }
          
          const query = qb.fetchAll(queryParams);
          const result = await query.execute();
          
          return result.results || [];
        },

        count: async ({ 
          model, 
          where 
        }: { 
          model: string; 
          where?: any[] 
        }) => {
          const tableName = config.usePlural ? `${model}s` : model;
          
          let queryParams: any = {
            tableName,
            fields: "COUNT(*) as count"
          };
          
          if (where && where.length > 0) {
            const conditions = where.map(w => `${w.field} ${w.operator || "="} ?`);
            const params = where.map(w => w.value);
            queryParams.where = {
              conditions,
              params
            };
          }
          
          const query = qb.fetchOne(queryParams);
          const result = await query.execute();
          
          return result.results?.count || 0;
        },
      };
    },
  });

export default workersQBAdapter;
export * from "./types";