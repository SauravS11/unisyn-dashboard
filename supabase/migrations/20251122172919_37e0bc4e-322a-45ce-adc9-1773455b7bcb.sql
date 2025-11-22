-- Add status column to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Add check constraint to ensure valid status values
ALTER TABLE deals ADD CONSTRAINT deals_status_check CHECK (status IN ('active', 'completed'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);