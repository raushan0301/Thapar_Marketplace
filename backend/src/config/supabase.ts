import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file');
    process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('✅ Supabase client initialized');

export default supabase;
