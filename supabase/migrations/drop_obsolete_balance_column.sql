-- Drop the obsolete balance column from profiles
-- WARNING: Ensure you have run the latest code that calculates balance from transactions!
ALTER TABLE profiles DROP COLUMN IF EXISTS balance;

-- Verify transactions table has the necessary columns (from previous migration)
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS round INTEGER;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'real';
