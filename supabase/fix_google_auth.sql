-- GOOGLE AUTH & SCHEMA FIX
-- Run this in Supabase SQL Editor

-- 1. Add email column to profiles if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'email') then
    alter table public.profiles add column email text;
  end if;
end $$;

-- 2. Fix the signup trigger to handle Google Auth metadata safely
create or replace function public.handle_new_user()
returns trigger as $$
declare
  candidate_username text;
begin
  -- Try to get username from metadata, or fallback to email prefix if not present (Google users)
  candidate_username := coalesce(
    new.raw_user_meta_data->>'username', 
    split_part(new.email, '@', 1)
  );

  -- Ensure candidate_username is at least 3 chars (for the constraint)
  if length(candidate_username) < 3 then
    candidate_username := candidate_username || '_user';
  end if;

  insert into public.profiles (id, full_name, avatar_url, email, username)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    new.email,
    candidate_username
  );
  return new;
exception when others then
  -- Log error or just return new to not block signup (though profile won't be created)
  return new;
end;
$$ language plpgsql security definer;

-- 3. Re-enable the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
