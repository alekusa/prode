-- FIX SCRIPT: Add missing email column
-- Run this in Supabase SQL Editor

-- 1. Add email column if it's missing
alter table public.profiles 
add column if not exists email text;

-- 2. Log that we fixed it (optional, just for verification if you check logs later)
insert into public.debug_logs (message, details)
values ('Fix Applied', 'Added email column to profiles table');
