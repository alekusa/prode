-- DIAGNOSTIC: Deep Dive on Function & Trigger
-- Clean logs
delete from public.debug_logs;

-- 1. Get the source code of handle_new_user
insert into public.debug_logs (message, details)
select 
  'Function Source: handle_new_user',
  pg_get_functiondef('public.handle_new_user'::regproc);

-- 2. Validate Trigger Definition details
insert into public.debug_logs (message, details)
select 
  'Trigger Details',
  action_statement
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
