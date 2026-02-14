// Script to insert Lost & Found categories
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('SUPABASE_KEY:', supabaseKey ? 'Set' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
    { name: 'Electronics', type: 'lost_found', icon: '📱', description: 'Phones, laptops, chargers, earphones, etc.' },
    { name: 'Documents', type: 'lost_found', icon: '📄', description: 'ID cards, certificates, notebooks, etc.' },
    { name: 'Personal Items', type: 'lost_found', icon: '👜', description: 'Wallets, bags, keys, watches, etc.' },
    { name: 'Clothing', type: 'lost_found', icon: '👕', description: 'Jackets, caps, shoes, etc.' },
    { name: 'Books & Stationery', type: 'lost_found', icon: '📚', description: 'Textbooks, notebooks, pens, etc.' },
    { name: 'Sports Equipment', type: 'lost_found', icon: '⚽', description: 'Balls, rackets, gym equipment, etc.' },
    { name: 'Accessories', type: 'lost_found', icon: '🎒', description: 'Umbrellas, water bottles, lunch boxes, etc.' },
    { name: 'Other', type: 'lost_found', icon: '📦', description: 'Items that don\'t fit other categories' },
];

async function insertCategories() {
    console.log('🔄 Inserting Lost & Found categories...\n');

    for (const category of categories) {
        // Check if category already exists
        const { data: existing } = await supabase
            .from('categories')
            .select('id, name')
            .eq('name', category.name)
            .eq('type', 'lost_found')
            .single();

        if (existing) {
            console.log(`⏭️  Category "${category.name}" already exists (ID: ${existing.id})`);
            continue;
        }

        // Insert new category
        const { data, error } = await supabase
            .from('categories')
            .insert({
                name: category.name,
                type: category.type,
                icon: category.icon,
                description: category.description,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error(`❌ Failed to insert "${category.name}":`, error.message);
        } else {
            console.log(`✅ Inserted "${category.name}" (ID: ${data.id})`);
        }
    }

    console.log('\n🎉 Done!');
}

insertCategories()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
