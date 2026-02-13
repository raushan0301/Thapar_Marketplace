-- Migration: Add Lost & Found specific fields
-- Date: 2026-02-13

-- Add reward and incident_date fields to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS reward TEXT,
ADD COLUMN IF NOT EXISTS incident_date TIMESTAMP;

-- Add index for incident_date for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_incident_date ON listings(incident_date DESC);

-- Add comment for documentation
COMMENT ON COLUMN listings.reward IS 'Reward offered for lost items (e.g., "₹500", "Treat at canteen")';
COMMENT ON COLUMN listings.incident_date IS 'Date when item was lost or found';
