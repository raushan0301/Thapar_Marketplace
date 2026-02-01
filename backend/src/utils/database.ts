import { supabase } from '../config/supabase';

/**
 * Database helper using Supabase client
 * This replaces the pg Pool queries with Supabase queries
 */

export class Database {
    /**
     * Execute a SELECT query
     */
    static async query(table: string, options: {
        select?: string;
        where?: Record<string, any>;
        orderBy?: { column: string; ascending?: boolean };
        limit?: number;
        offset?: number;
    } = {}) {
        let query = supabase.from(table).select(options.select || '*');

        // Apply filters
        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }

        // Apply ordering
        if (options.orderBy) {
            query = query.order(options.orderBy.column, {
                ascending: options.orderBy.ascending ?? false
            });
        }

        // Apply pagination
        if (options.limit) {
            query = query.limit(options.limit);
        }
        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { rows: data || [], rowCount: data?.length || 0 };
    }

    /**
     * Execute an INSERT query
     */
    static async insert(table: string, data: Record<string, any> | Record<string, any>[]) {
        const { data: result, error } = await supabase
            .from(table)
            .insert(data)
            .select();

        if (error) {
            throw error;
        }

        return { rows: result || [], rowCount: result?.length || 0 };
    }

    /**
     * Execute an UPDATE query
     */
    static async update(table: string, data: Record<string, any>, where: Record<string, any>) {
        let query = supabase.from(table).update(data);

        // Apply filters
        Object.entries(where).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        const { data: result, error } = await query.select();

        if (error) {
            throw error;
        }

        return { rows: result || [], rowCount: result?.length || 0 };
    }

    /**
     * Execute a DELETE query
     */
    static async delete(table: string, where: Record<string, any>) {
        let query = supabase.from(table).delete();

        // Apply filters
        Object.entries(where).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        const { data: result, error } = await query.select();

        if (error) {
            throw error;
        }

        return { rows: result || [], rowCount: result?.length || 0 };
    }

    /**
     * Execute a raw SQL query (for complex queries)
     */
    static async rawQuery(sql: string, params?: any[]) {
        // Note: Supabase doesn't support raw SQL from client
        // For complex queries, use the query builder or create a PostgreSQL function
        throw new Error('Raw SQL queries not supported. Use query builder or create a database function.');
    }

    /**
     * Count rows in a table
     */
    static async count(table: string, where?: Record<string, any>) {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });

        if (where) {
            Object.entries(where).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }

        const { count, error } = await query;

        if (error) {
            throw error;
        }

        return count || 0;
    }
}

export default Database;
