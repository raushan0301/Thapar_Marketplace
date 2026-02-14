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

async function cleanup() {
    console.log('Starting cleanup of duplicate/unwanted categories...');

    // 1. Find "Lost Items" and "Found Items" IDs
    const { data: categoriesToRemove, error: findError } = await supabase
        .from('categories')
        .select('id, name')
        .in('name', ['Lost Items', 'Found Items']);

    if (findError) {
        console.error('Error finding categories:', findError);
        return;
    }

    if (!categoriesToRemove || categoriesToRemove.length === 0) {
        console.log('✅ "Lost Items" and "Found Items" categories not found. Already clean.');
        return;
    }

    const idsToRemove = categoriesToRemove.map(c => c.id);
    console.log(`Found ${idsToRemove.length} categories to remove:`, categoriesToRemove.map(c => c.name));

    // 2. Find "Other" category ID (for migration of listings)
    const { data: otherCategory, error: otherError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Other')
        .single();

    if (otherError || !otherCategory) {
        console.warn('⚠️ "Other" category not found. Associated listings will be DELETED.');

        // Delete listings directly
        const { error: delListingsError, count: deletedCount } = await supabase
            .from('listings')
            .delete({ count: 'exact' })
            .in('category_id', idsToRemove);

        if (delListingsError) {
            console.error('Error deleting listings:', delListingsError);
        } else {
            console.log(`✅ Deleted listings associated with removed categories.`);
        }
    } else {
        // 3. Move listings to "Other"
        const { error: updateError, count: updatedCount } = await supabase
            .from('listings')
            .update({ category_id: otherCategory.id }, { count: 'exact' })
            .in('category_id', idsToRemove);

        if (updateError) {
            console.error('Error moving listings to "Other":', updateError);
        } else {
            console.log(`✅ Moved listings to "Other" category (ID: ${otherCategory.id}).`);
        }
    }

    // 4. Delete the categories
    const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .in('id', idsToRemove);

    if (deleteError) {
        console.error('Error deleting categories:', deleteError);
    } else {
        console.log('✅ Successfully removed categories from database.');
    }
}

cleanup().catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
});
