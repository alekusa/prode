-- Add round and type to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS round INTEGER,
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'real';

-- Update existing approved transactions to have a default round if possible (optional)
-- UPDATE transactions SET round = 1 WHERE round IS NULL AND status = 'approved';
