-- Fix Signup Trigger to include Username
-- Run this in Supabase SQL Editor

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
