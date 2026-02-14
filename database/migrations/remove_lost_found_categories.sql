-- Remove "Lost Items" and "Found Items" categories
-- First migrate any listings using these categories to "Other", or delete if "Other" doesn't exist
DO $$
DECLARE
    other_id INTEGER;
BEGIN
    -- Try to find the 'Other' category
    SELECT id INTO other_id FROM categories WHERE name = 'Other' LIMIT 1;
    
    IF other_id IS NOT NULL THEN
        -- Move listings to 'Other'
        UPDATE listings 
        SET category_id = other_id 
        WHERE category_id IN (SELECT id FROM categories WHERE name IN ('Lost Items', 'Found Items'));
    ELSE
        -- If 'Other' doesn't exist, delete listings to allow category deletion
        DELETE FROM listings 
        WHERE category_id IN (SELECT id FROM categories WHERE name IN ('Lost Items', 'Found Items'));
    END IF;

    -- Delete the categories
    DELETE FROM categories WHERE name IN ('Lost Items', 'Found Items');
END $$;
