-- POPULATE ALL 16 ROUNDS (INCLUDING ROUND 2)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  r INTEGER;
BEGIN
  -- Create matches for rounds 2 to 16 based on Round 1 match-ups
  -- We offset the start_time by 7 days per round
  FOR r IN 2..16 LOOP
    -- Only insert if we don't have matches for this round yet
    IF NOT EXISTS (SELECT 1 FROM public.matches WHERE round = r) THEN
      INSERT INTO public.matches (home_team_id, away_team_id, start_time, status, round)
      SELECT 
        home_team_id, 
        away_team_id, 
        start_time + (interval '7 days' * (r - 1)), 
        'scheduled', 
        r
      FROM public.matches 
      WHERE round = 1;
    END IF;
  END LOOP;
END $$;
