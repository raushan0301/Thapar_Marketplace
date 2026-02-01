import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false, // Temporarily disabled to test connection
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased to 10 seconds
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to Supabase PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

export default pool;
