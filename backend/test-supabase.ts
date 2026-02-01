import { supabase } from './src/config/supabase';

async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('Key (first 20 chars):', process.env.SUPABASE_SERVICE_KEY?.substring(0, 20) + '...');

    try {
        // Test 1: Simple query
        console.log('\n📊 Test 1: Fetching categories...');
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .limit(5);

        if (catError) {
            console.error('❌ Categories error:', catError);
        } else {
            console.log('✅ Categories fetched:', categories?.length || 0, 'items');
            console.log('Categories:', categories);
        }

        // Test 2: Check if tables exist
        console.log('\n📊 Test 2: Checking tables...');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (userError) {
            console.error('❌ Users table error:', userError);
        } else {
            console.log('✅ Users table exists');
        }

        console.log('\n✅ Connection test complete!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }

    process.exit(0);
}

testSupabaseConnection();
