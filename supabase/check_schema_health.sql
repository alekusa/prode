-- DIAGNOSTIC: Check Schema Health
-- Run this in Supabase SQL Editor.
-- This bypasses the Auth Rate Limit by checking the DB structure directly.

-- 1. Clean previous logs
delete from public.debug_logs;

-- 2. Inspect 'profiles' table columns and log them
insert into public.debug_logs (message, details)
select 
  'Schema Check: profiles', 
  (
    select json_agg(json_build_object('col', column_name, 'type', data_type)) 
    from information_schema.columns 
    where table_name = 'profiles'
  )::text;

-- 3. Check if the trigger exists
insert into public.debug_logs (message, details)
select 
  'Trigger Check',
  (
    select string_agg(trigger_name, ', ')
    from information_schema.triggers
    where event_object_table = 'users' 
    and event_object_schema = 'auth'
  );
