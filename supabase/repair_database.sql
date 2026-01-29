-- DATA INTEGRITY & REPAIR SCRIPT
-- Run this in Supabase SQL Editor to fix Signup issues

-- 1. Ensure Profiles Table & Columns Exist
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  points integer default 0,
  role text default 'user' check (role in ('user', 'admin')),
  constraint username_length check (char_length(username) >= 3)
);

-- Safely add username if it was missing (for existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'username') then
    alter table public.profiles add column username text unique;
    alter table public.profiles add constraint username_length check (char_length(username) >= 3);
  end if;
end $$;

-- 2. Fix the Signup Trigger
-- Dropping first ensures we replace it cleanly
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, username)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    new.email,
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Ensure RLS Policies are enabled (Idempotent-ish check)
alter table public.profiles enable row level security;

-- Re-apply Insert Policy just in case
drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);
