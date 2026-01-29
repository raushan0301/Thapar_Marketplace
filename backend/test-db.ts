// Quick database connection test
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        console.log('Testing database connection...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

        const client = await pool.connect();
        console.log('✅ Successfully connected to database!');

        const result = await client.query('SELECT NOW()');
        console.log('✅ Query successful! Server time:', result.rows[0].now);

        client.release();
        await pool.end();

        console.log('\n✅ Database connection test PASSED!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection test FAILED!');
        console.error('Error:', error);
        process.exit(1);
    }
}

testConnection();
