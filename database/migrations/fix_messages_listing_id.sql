-- Fix messages table to allow NULL listing_id for direct messages
-- Run this in your Supabase SQL Editor

ALTER TABLE messages 
ALTER COLUMN listing_id DROP NOT NULL;
