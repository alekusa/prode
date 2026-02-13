-- MIGRATE TEAM BADGES TO STABLE GITHUB CDN
-- Updates all 30 teams with high-quality PNG logos

BEGIN;

-- Update based on TEAM NAMES to be as robust as possible
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/aldosivi.png' WHERE name = 'Aldosivi';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/argentinos.png' WHERE name = 'Argentinos Juniors';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/atleticotucuman.png' WHERE name = 'Atlético Tucumán';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/banfield.png' WHERE name = 'Banfield';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/barracas.png' WHERE name = 'Barracas Central';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/belgrano.png' WHERE name = 'Belgrano';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/boca.png' WHERE name = 'Boca Juniors';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/centralcordoba.png' WHERE name = 'Central Córdoba (SdE)';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/defensa.png' WHERE name = 'Defensa y Justicia';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/riestra.png' WHERE name = 'Deportivo Riestra';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/estudiantes.png' WHERE name = 'Estudiantes (LP)';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/hinchadaclub/hinchada_club/main/argentina/266694.png' WHERE name = 'Estudiantes (RC)';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/gimnasia.png' WHERE name = 'Gimnasia (LP)';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/hinchadaclub/hinchada_club/main/argentina/188441.png' WHERE name = 'Gimnasia (M)';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/huracan.png' WHERE name = 'Huracán';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/independiente2.png' WHERE name = 'Independiente';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/independienteriv.png' WHERE name = 'Independiente Rivadavia';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/instituto.png' WHERE name = 'Instituto';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/lanus.png' WHERE name = 'Lanús';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/newells.png' WHERE name = 'Newell''s Old Boys';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/platense.png' WHERE name = 'Platense';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/racing2.png' WHERE name = 'Racing Club';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/river.png' WHERE name = 'River Plate';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/rosariocentral.png' WHERE name = 'Rosario Central';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/sanlorenzo.png' WHERE name = 'San Lorenzo';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/sarmiento.png' WHERE name = 'Sarmiento (J)';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/talleres.png' WHERE name = 'Talleres (C)';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/tigre.png' WHERE name = 'Tigre';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/union.png' WHERE name = 'Unión';
UPDATE public.teams SET badge_url = 'https://raw.githubusercontent.com/Luchetoo08/escudos-argentina/main/velez.png' WHERE name = 'Vélez Sarsfield';

COMMIT;
