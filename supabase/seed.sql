-- Clear existing matches and teams
truncate table public.predictions cascade;
truncate table public.matches cascade;
truncate table public.teams cascade;

-- Insert all 30 Teams
insert into public.teams (name, short_name, primary_color, badge_url) values
('Aldosivi', 'ALD', '#007A33', 'https://upload.wikimedia.org/wikipedia/en/a/ac/Club_Atl%C3%A9tico_Aldosivi_logo.svg'),
('Argentinos Juniors', 'ARG', '#DA291C', 'https://upload.wikimedia.org/wikipedia/en/d/d7/Argentinos_Juniors_logo.svg'),
('Atlético Tucumán', 'ATU', '#0096D6', 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Club_Atl%C3%A9tico_Tucum%C3%A1n.svg'),
('Banfield', 'BAN', '#00843D', 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Escudo_del_Club_Atl%C3%A9tico_Banfield.svg'),
('Barracas Central', 'BAR', '#E30613', 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Escudo_del_Club_Atl%C3%A9tico_Barracas_Central.svg'),
('Belgrano', 'BEL', '#00AEEF', 'https://upload.wikimedia.org/wikipedia/en/e/e0/Club_Atl%C3%A9tico_Belgrano_logo.svg'),
('Boca Juniors', 'BOC', '#004A9E', 'https://upload.wikimedia.org/wikipedia/commons/4/41/Boca_Juniors_logo18.svg'),
('Central Córdoba (SdE)', 'CCO', '#000000', 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Escudo_del_Club_Atl%C3%A9tico_Central_C%C3%B3rdoba_de_Santiago_del_Estero.svg'),
('Defensa y Justicia', 'DYJ', '#FEDD00', 'https://upload.wikimedia.org/wikipedia/en/a/a2/Defensa_y_Justicia_logo.svg'),
('Deportivo Riestra', 'RIE', '#000000', 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Escudo_Deportivo_Riestra.svg'),
('Estudiantes de La Plata', 'ELP', '#E31E24', 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Escudo_de_Estudiantes_de_La_Plata.svg'),
('Estudiantes (RC)', 'ERC', '#0070B8', 'https://upload.wikimedia.org/wikipedia/commons/d/de/Escudo_de_Estudiantes_R%C3%ADo_Cuarto.svg'),
('Gimnasia (LP)', 'GLP', '#002B5C', 'https://upload.wikimedia.org/wikipedia/en/9/90/Gimnasia_y_Esgrima_de_La_Plata_logo.svg'),
('Gimnasia (M)', 'GYM', '#000000', 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Escudo_Gimnasia_Esgrima_Mendoza.svg'),
('Huracán', 'HUR', '#E31E24', 'https://upload.wikimedia.org/wikipedia/commons/2/23/Escudo_del_C_A_Hurac%C3%A1n.svg'),
('Independiente', 'IND', '#E2001A', 'https://upload.wikimedia.org/wikipedia/commons/d/db/Escudo_del_Club_Atl%C3%A9tico_Independiente.svg'),
('Independiente Rivadavia', 'IRV', '#002B5C', 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Escudo_Independiente_Rivadavia.svg'),
('Instituto', 'INS', '#E31E24', 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Instituto_ACC_logo.svg'),
('Lanús', 'LAN', '#800000', 'https://upload.wikimedia.org/wikipedia/en/1/14/Club_Atl%C3%A9tico_Lan%C3%BAs_logo.svg'),
('Newell''s Old Boys', 'NOB', '#E30613', 'https://upload.wikimedia.org/wikipedia/commons/1/18/Newell%27s_Old_Boys_logo.svg'),
('Platense', 'PLA', '#4C2719', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Club_Atl%C3%A9tico_Platense.svg'),
('Racing Club', 'RAC', '#6BABDD', 'https://upload.wikimedia.org/wikipedia/commons/5/56/Escudo_de_Racing_Club_%282014%29.svg'),
('River Plate', 'RIV', '#E31C23', 'https://upload.wikimedia.org/wikipedia/en/a/a3/Club_Atl%C3%A9tico_River_Plate_logo.svg'),
('Rosario Central', 'ROS', '#FFCC00', 'https://upload.wikimedia.org/wikipedia/en/d/da/Rosario_Central_logo.svg'),
('San Lorenzo', 'SLO', '#C4161C', 'https://upload.wikimedia.org/wikipedia/commons/7/77/Escudo_del_Club_Atl%C3%A9tico_San_Lorenzo_de_Almagro.svg'),
('Sarmiento (J)', 'SAR', '#00843D', 'https://upload.wikimedia.org/wikipedia/commons/4/41/Club_Atl%C3%A9tico_Sarmiento_logo.svg'),
('Talleres (C)', 'TAL', '#004A9E', 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Escudo_del_Club_Atl%C3%A9tico_Talleres.svg'),
('Tigre', 'TIG', '#003366', 'https://upload.wikimedia.org/wikipedia/en/8/87/Club_Atl%C3%A9tico_Tigre_logo.svg'),
('Unión', 'UNI', '#E31C23', 'https://upload.wikimedia.org/wikipedia/commons/3/36/Club_Atl%C3%A9tico_Uni%C3%B3n_de_Santa_Fe_logo.svg'),
('Vélez Sarsfield', 'VEL', '#004A9E', 'https://upload.wikimedia.org/wikipedia/en/a/a9/V%C3%A9lez_Sarsfield_logo.svg');

-- Fixture Generation (Circle Method for 30 teams over 16 rounds)
DO $$
DECLARE
    team_ids uuid[];
    n integer := 30;
    num_rounds integer := 16;
    r integer;
    i integer;
    home_idx integer;
    away_idx integer;
    start_date timestamp with time zone := '2026-01-22 17:00:00+00';
    round_start timestamp with time zone;
    match_time timestamp with time zone;
BEGIN
    SELECT array_agg(id) INTO team_ids FROM public.teams;

    FOR r IN 1..num_rounds LOOP
        round_start := start_date + ((r - 1) * interval '7 days');
        
        FOR i IN 0..(n / 2 - 1) LOOP
            -- Circle method logic
            IF i = 0 THEN
                home_idx := 1;
                away_idx := ((r + n - 3) % (n - 1)) + 2;
            ELSE
                home_idx := ((r + i - 2) % (n - 1)) + 2;
                away_idx := ((r + n - i - 3) % (n - 1)) + 2;
            END IF;

            -- Spread matches over the weekend (Thursday to Monday)
            -- 15 matches per round: 3 Thu, 3 Fri, 3 Sat, 3 Sun, 3 Mon
            match_time := round_start + (floor(i / 3) * interval '1 day') + ((i % 3) * interval '2 hours 15 minutes');

            INSERT INTO public.matches (home_team_id, away_team_id, start_time, status, round)
            VALUES (team_ids[home_idx], team_ids[away_idx], match_time, 'scheduled', r);
        END LOOP;
    END LOOP;
END $$;
