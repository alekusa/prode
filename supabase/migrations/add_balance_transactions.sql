-- Add balance to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    mp_payment_id VARCHAR(255) UNIQUE,
    mp_preference_id VARCHAR(255),
    amount NUMERIC NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);
