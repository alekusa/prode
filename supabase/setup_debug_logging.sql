-- DEBUG SCRIPT V2: Capture Signup Errors (Don't rollback)
-- Run this in Supabase SQL Editor

-- 1. Ensure table exists
create table if not exists public.debug_logs (
    id serial primary key,
    created_at timestamp with time zone default now(),
    message text,
    details text
);

alter table public.debug_logs enable row level security;

-- Drop policies if they exist to avoid "already exists" error
drop policy if exists "Public read logs" on public.debug_logs;
drop policy if exists "Public insert logs" on public.debug_logs;
drop policy if exists "Service write logs" on public.debug_logs;

create policy "Public read logs" on public.debug_logs for select using (true);
create policy "Public insert logs" on public.debug_logs for insert with check (true);

-- 2. Update the trigger function to capture errors AND NOT RAISE THEM
-- This ensures the 'debug_logs' insert is committed.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  begin
    insert into public.profiles (id, full_name, avatar_url, email, username)
    values (
      new.id, 
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'avatar_url', 
      new.email,
      new.raw_user_meta_data->>'username'
    );
  exception when others then
    -- Log the error
    insert into public.debug_logs (message, details)
    values ('Error in handle_new_user', SQLERRM);
    
    -- IMPORTANT: We do NOT raise exception here, so the auth user is created 
    -- and this log is saved.
  end;
  return new;
end;
$$ language plpgsql security definer;
