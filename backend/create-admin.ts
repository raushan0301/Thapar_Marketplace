import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
    try {
        console.log('🚀 Creating admin user...');

        const email = 'admin@thapar.edu';
        const password = 'admin123';
        const name = 'System Admin';

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            // Update existing user to be admin
            const { error } = await supabase
                .from('users')
                .update({
                    is_admin: true,
                    is_verified: true,
                    password_hash: passwordHash,
                    name: name,
                    trust_score: 5.0
                })
                .eq('email', email);

            if (error) throw error;
            console.log('✅ Updated existing admin user to have admin privileges and reset password.');
        } else {
            // Create new admin user
            const { error } = await supabase
                .from('users')
                .insert({
                    email,
                    password_hash: passwordHash,
                    name,
                    is_verified: true,
                    is_admin: true,
                    trust_score: 5.0
                });

            if (error) throw error;
            console.log('✅ Created new admin user.');
        }

        console.log('\n🎉 Admin Access Ready!');
        console.log('----------------------------------------');
        console.log(`📧 Email:    ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('----------------------------------------');

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    }
}

createAdmin();
