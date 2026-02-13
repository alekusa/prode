-- Enable read access for all authenticated users to profiles and predictions
-- This allows the leaderboard to display everyone's points

-- 1. Profiles: allow everyone to read usernames/avatars
drop policy if exists "Profiles are viewable by everyone" on profiles;
create policy "Profiles are viewable by everyone" 
on profiles for select 
using (true);

-- 2. Predictions: allow everyone to read predictions (needed for leaderboard calculation)
-- Note: You might want to restrict this to only finished matches in the future to prevent copying,
-- but for the leaderboard aggregation we need access. 
-- Since the frontend filters by points_awarded IS NOT NULL, we are ensuring we only count finished games anyway.
drop policy if exists "Predictions are viewable by everyone" on predictions;
create policy "Predictions are viewable by everyone" 
on predictions for select 
using (true);

-- Ensure RLS is enabled
alter table profiles enable row level security;
alter table predictions enable row level security;
