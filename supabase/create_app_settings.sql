-- Create a simple key-value store for application settings
create table if not exists app_settings (
  key text primary key,
  value text
);

-- Turn on RLS
alter table app_settings enable row level security;

-- Allow public read access (so we can show the "total_players" on the leaderboard)
create policy "Allow public read of app_settings"
  on app_settings for select
  using (true);

-- Allow only admins to update (assuming you have an 'admin' role check or similar)
-- For now, we'll allow authenticated users with a specific email or metadata role to update,
-- OR just use the service key in the admin panel if we implement it that way.
-- Here is a policy for admin users based on metadata (adjust as needed for your auth setup):
create policy "Allow admins to update app_settings"
  on app_settings for all
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Insert initial value for fictional player count
insert into app_settings (key, value)
values ('total_players_fictional', '1250')
on conflict (key) do nothing;
