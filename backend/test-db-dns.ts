// Test database connection with DNS override
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as dns from 'dns';

dotenv.config();

// Override DNS to use Google's DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
});

async function testConnection() {
    try {
        console.log('Testing database connection with Google DNS...');
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
