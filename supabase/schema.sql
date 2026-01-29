-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  points integer default 0,
  role text default 'user' check (role in ('user', 'admin')),

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create teams table
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  short_name text not null,
  badge_url text,
  primary_color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table teams enable row level security;

create policy "Teams are viewable by everyone." on teams
  for select using (true);
-- Only admins should be able to insert/update teams (policy to be added later or handled via dashboard)

-- Create matches table
create table matches (
  id uuid default gen_random_uuid() primary key,
  home_team_id uuid references teams(id) not null,
  away_team_id uuid references teams(id) not null,
  start_time timestamp with time zone not null,
  status text default 'scheduled' check (status in ('scheduled', 'live', 'finished', 'postponed')),
  home_score integer,
  away_score integer,
  round integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table matches enable row level security;

create policy "Matches are viewable by everyone." on matches
  for select using (true);

-- Create predictions table
create table predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  match_id uuid references matches(id) not null,
  home_score integer not null,
  away_score integer not null,
  points_awarded integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, match_id)
);

alter table predictions enable row level security;

create policy "Users can view their own predictions." on predictions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own predictions." on predictions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own predictions." on predictions
  for update using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
