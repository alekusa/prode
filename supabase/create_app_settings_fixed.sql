-- 1. Visibilidad Global Leaderboard
drop policy if exists "Profiles are viewable by everyone" on profiles;
create policy "Profiles are viewable by everyone" on profiles for select using (true);

drop policy if exists "Predictions are viewable by everyone" on predictions;
create policy "Predictions are viewable by everyone" on predictions for select using (true);

-- 2. Configuración Global (Contador de Jugadores)
create table if not exists app_settings (
  key text primary key,
  value text
);
alter table app_settings enable row level security;

drop policy if exists "Allow public read of app_settings" on app_settings;
create policy "Allow public read of app_settings"
  on app_settings for select using (true);

drop policy if exists "Allow admins to update app_settings" on app_settings;
create policy "Allow admins to update app_settings"
  on app_settings for all
  using (true) with check (true);

insert into app_settings (key, value)
values ('total_players_fictional', '1250')
on conflict (key) do nothing;
