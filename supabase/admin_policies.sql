-- Admin Policies Source
-- Run this in your Supabase SQL Editor to enable Admin capabilities

-- 1. Helper function to check if user is admin (Optional optimization, but strictly inlining for now to match constraints)
-- We will use subqueries in policies for simplicity.

-- TEAMS
create policy "Admins can insert teams" on teams for insert with check (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

create policy "Admins can update teams" on teams for update using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

create policy "Admins can delete teams" on teams for delete using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- MATCHES
create policy "Admins can insert matches" on matches for insert with check (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

create policy "Admins can update matches" on matches for update using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

create policy "Admins can delete matches" on matches for delete using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- PROFILES
-- Allow admins to update user points
create policy "Admins can update any profile" on profiles for update using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- PREDICTIONS
-- Allow admins to view ALL predictions (needed for scoring calculation)
create policy "Admins can view all predictions" on predictions for select using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Allow admins to update points_awarded on predictions
create policy "Admins can update predictions" on predictions for update using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
