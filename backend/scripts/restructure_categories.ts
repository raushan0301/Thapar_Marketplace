import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_CATEGORIES = [
    { name: 'Electronics', icon: '📱', description: 'Phones, laptops, gadgets' },
    { name: 'Books & Study Material', icon: '📚', description: 'Textbooks, novels, notes' },
    { name: 'Furniture', icon: '🪑', description: 'Chairs, tables, beds' },
    { name: 'Clothing', icon: '👕', description: 'Clothes, shoes, fashion' },
    { name: 'Accessories', icon: '🎒', description: 'Bags, watches, jewelry' },
    { name: 'Bikes & Transport', icon: '🚲', description: 'Bicycles, scooters, vehicles' },
    { name: 'Sports Equipment', icon: '⚽', description: 'Sports gear and equipment' },
    { name: 'Musical Instruments', icon: '🎸', description: 'Guitars, keyboards, etc.' },
    { name: 'Personal Items', icon: '👜', description: 'Wallets, keys, ID cards' },
    { name: 'Stationery', icon: '✏️', description: 'Pens, notebooks, supplies' },
    { name: 'Miscellaneous', icon: '📦', description: 'Other items' }
];

const MAPPINGS: Record<string, string> = {
    'Books': 'Books & Study Material',
    'Books & Stationery': 'Books & Study Material',
    'Study Material': 'Books & Study Material',
    'Bikes': 'Bikes & Transport',
    'Electronics Rental': 'Electronics',
    'Sports Gear': 'Sports Equipment',
    'Documents': 'Miscellaneous',
    'Other': 'Miscellaneous',
    'Found Items': 'Miscellaneous',
    'Lost Items': 'Miscellaneous'
};

async function restructure() {
    console.log('Starting category restructuring...');

    // 1. Get existing categories
    const { data: existingCategories, error: fetchError } = await supabase
        .from('categories')
        .select('*');

    if (fetchError) {
        console.error('Error fetching categories:', fetchError);
        return;
    }

    const existingMap = new Map(existingCategories?.map(c => [c.name, c]));
    const targetMap = new Map<string, any>(); // Name -> ID

    // 2. Ensure Target Categories Exist
    for (const cat of TARGET_CATEGORIES) {
        let catId: number;

        if (existingMap.has(cat.name)) {
            // Update existing
            const existing = existingMap.get(cat.name);
            catId = existing.id;

            console.log(`Updating existing category: ${cat.name}`);
            await supabase
                .from('categories')
                .update({
                    icon: cat.icon,
                    description: cat.description,
                    type: 'buy_sell', // Unifying type
                    is_active: true
                })
                .eq('id', catId);

        } else {
            // Create new
            console.log(`Creating new category: ${cat.name}`);
            const { data: newCat, error: insertError } = await supabase
                .from('categories')
                .insert({
                    name: cat.name,
                    type: 'buy_sell',
                    icon: cat.icon,
                    description: cat.description,
                    is_active: true
                })
                .select()
                .single();

            if (insertError) {
                console.error(`Error creating ${cat.name}:`, insertError);
                continue;
            }
            catId = newCat.id;
        }
        targetMap.set(cat.name, catId);
    }

    // 3. Migrate Listings from Old/Mapped Categories
    if (existingCategories) {
        for (const oldCat of existingCategories) {
            if (targetMap.has(oldCat.name)) continue; // Already handled (it's a target category)

            let targetName = MAPPINGS[oldCat.name];
            if (!targetName) {
                // Default fallbacks
                if (oldCat.name.includes('Book')) targetName = 'Books & Study Material';
                else if (oldCat.name.includes('Electronic')) targetName = 'Electronics';
                else targetName = 'Miscellaneous';
            }

            const targetId = targetMap.get(targetName);
            if (targetId) {
                console.log(`Migrating listings from "${oldCat.name}" to "${targetName}"...`);

                const { error: moveError } = await supabase
                    .from('listings')
                    .update({ category_id: targetId })
                    .eq('category_id', oldCat.id);

                if (moveError) {
                    console.error(`Error moving listings from ${oldCat.name}:`, moveError);
                } else {
                    // Delete the old category
                    console.log(`Deleting old category: ${oldCat.name}`);
                    await supabase.from('categories').delete().eq('id', oldCat.id);
                }
            }
        }
    }

    console.log('✅ Restructuring complete.');
}

restructure().catch(console.error);
