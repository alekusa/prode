-- REAL FIXTURES LIGA PROFESIONAL ARGENTINA 2026 (TORNEO APERTURA)
-- Data actual al 27 de Enero de 2026.
-- Incluye Fecha 1 (Finalizada) y Fecha 2 (En curso).

-- 1. Limpiar datos previos
TRUNCATE TABLE public.predictions CASCADE;
TRUNCATE TABLE public.matches CASCADE;
TRUNCATE TABLE public.teams CASCADE;

-- 2. Insertar Equipos 2026 (Incluyendo ascendidos como Gimnasia Mza y Estudiantes RC)
INSERT INTO public.teams (name, short_name, primary_color, badge_url) VALUES
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
('Estudiantes (LP)', 'ELP', '#E31E24', 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Escudo_de_Estudiantes_de_La_Plata.svg'),
('Estudiantes (RC)', 'ERC', '#0070B8', 'https://upload.wikimedia.org/wikipedia/commons/d/de/Escudo_de_Estudiantes_R%C3%ADo_Cuarto.svg'),
('Gimnasia (LP)', 'GLP', '#002B5C', 'https://upload.wikimedia.org/wikipedia/en/9/90/Gimnasia_y_Esgrima_de_La_Plata_logo.svg'),
('Gimnasia (M)', 'GYM', '#000000', 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Escudo_Gimnasia_Esgrima_Mendoza.svg'),
('Godoy Cruz', 'GCR', '#0055A4', 'https://upload.wikimedia.org/wikipedia/en/c/c5/Godoy_Cruz_logo.svg'),
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

-- 3. Inserción de Partidos
DO $$
DECLARE
    -- IDs de Equipos
    ALD uuid; ARG uuid; ATU uuid; BAN uuid; BAR uuid; BEL uuid; BOC uuid; CCO uuid;
    DYJ uuid; RIE uuid; ELP uuid; ERC uuid; GLP uuid; GYM uuid; GCR uuid; HUR uuid;
    IND uuid; IRV uuid; INS uuid; LAN uuid; NOB uuid; PLA uuid; RAC uuid; RIV uuid;
    ROS uuid; SLO uuid; SAR uuid; TAL uuid; TIG uuid; UNI uuid; VEL uuid;
BEGIN
    SELECT id INTO ALD FROM teams WHERE name = 'Aldosivi';
    SELECT id INTO ARG FROM teams WHERE name = 'Argentinos Juniors';
    SELECT id INTO ATU FROM teams WHERE name = 'Atlético Tucumán';
    SELECT id INTO BAN FROM teams WHERE name = 'Banfield';
    SELECT id INTO BAR FROM teams WHERE name = 'Barracas Central';
    SELECT id INTO BEL FROM teams WHERE name = 'Belgrano';
    SELECT id INTO BOC FROM teams WHERE name = 'Boca Juniors';
    SELECT id INTO CCO FROM teams WHERE name = 'Central Córdoba (SdE)';
    SELECT id INTO DYJ FROM teams WHERE name = 'Defensa y Justicia';
    SELECT id INTO RIE FROM teams WHERE name = 'Deportivo Riestra';
    SELECT id INTO ELP FROM teams WHERE name = 'Estudiantes (LP)';
    SELECT id INTO ERC FROM teams WHERE name = 'Estudiantes (RC)';
    SELECT id INTO GLP FROM teams WHERE name = 'Gimnasia (LP)';
    SELECT id INTO GYM FROM teams WHERE name = 'Gimnasia (M)';
    SELECT id INTO GCR FROM teams WHERE name = 'Godoy Cruz';
    SELECT id INTO HUR FROM teams WHERE name = 'Huracán';
    SELECT id INTO IND FROM teams WHERE name = 'Independiente';
    SELECT id INTO IRV FROM teams WHERE name = 'Independiente Rivadavia';
    SELECT id INTO INS FROM teams WHERE name = 'Instituto';
    SELECT id INTO LAN FROM teams WHERE name = 'Lanús';
    SELECT id INTO NOB FROM teams WHERE name = 'Newell''s Old Boys';
    SELECT id INTO PLA FROM teams WHERE name = 'Platense';
    SELECT id INTO RAC FROM teams WHERE name = 'Racing Club';
    SELECT id INTO RIV FROM teams WHERE name = 'River Plate';
    SELECT id INTO ROS FROM teams WHERE name = 'Rosario Central';
    SELECT id INTO SLO FROM teams WHERE name = 'San Lorenzo';
    SELECT id INTO SAR FROM teams WHERE name = 'Sarmiento (J)';
    SELECT id INTO TAL FROM teams WHERE name = 'Talleres (C)';
    SELECT id INTO TIG FROM teams WHERE name = 'Tigre';
    SELECT id INTO UNI FROM teams WHERE name = 'Unión';
    SELECT id INTO VEL FROM teams WHERE name = 'Vélez Sarsfield';

    -- FECHA 1 (Resultados Reales)
    INSERT INTO public.matches (home_team_id, away_team_id, start_time, status, round, home_score, away_score) VALUES
    (ALD, DYJ, '2026-01-22 17:00:00+00', 'finished', 1, 0, 2),
    (BAN, HUR, '2026-01-22 20:00:00+00', 'finished', 1, 1, 1),
    (UNI, PLA, '2026-01-22 20:00:00+00', 'finished', 1, 0, 0),
    (INS, VEL, '2026-01-22 22:15:00+00', 'finished', 1, 1, 2),
    (CCO, GYM, '2026-01-22 22:15:00+00', 'finished', 1, 2, 0),
    (SLO, LAN, '2026-01-23 19:00:00+00', 'finished', 1, 0, 1),
    (IND, ELP, '2026-01-23 20:00:00+00', 'finished', 1, 2, 0),
    (IRV, ATU, '2026-01-23 22:15:00+00', 'finished', 1, 1, 1),
    (TAL, NOB, '2026-01-23 22:15:00+00', 'finished', 1, 0, 0),
    (BAR, RIV, '2026-01-24 17:00:00+00', 'finished', 1, 0, 3),
    (GLP, RAC, '2026-01-24 19:30:00+00', 'finished', 1, 1, 2),
    (ROS, BEL, '2026-01-24 22:00:00+00', 'finished', 1, 2, 1),
    (BOC, RIE, '2026-01-25 18:30:00+00', 'finished', 1, 1, 0),
    (ARG, SAR, '2026-01-25 21:00:00+00', 'finished', 1, 2, 1),
    (TIG, ERC, '2026-01-25 21:00:00+00', 'finished', 1, 1, 1);

    -- FECHA 2 (En curso - Hoy es 27 de Enero 2026)
    INSERT INTO public.matches (home_team_id, away_team_id, start_time, status, round, home_score, away_score) VALUES
    (PLA, INS, '2026-01-26 17:00:00+00', 'finished', 2, 2, 1),
    (VEL, TAL, '2026-01-27 17:45:00+00', 'live', 2, 0, 0),
    (GYM, SLO, '2026-01-27 20:00:00+00', 'scheduled', 2, null, null),
    (HUR, IRV, '2026-01-27 20:00:00+00', 'scheduled', 2, null, null),
    (NOB, IND, '2026-01-27 22:15:00+00', 'scheduled', 2, null, null),
    (ATU, CCO, '2026-01-27 22:15:00+00', 'scheduled', 2, null, null),
    (ALD, BAR, '2026-01-28 17:00:00+00', 'scheduled', 2, null, null),
    (RAC, ROS, '2026-01-28 18:00:00+00', 'scheduled', 2, null, null),
    (RIV, GLP, '2026-01-28 20:00:00+00', 'scheduled', 2, null, null),
    (ELP, BOC, '2026-01-28 22:15:00+00', 'scheduled', 2, null, null),
    (RIE, DYJ, '2026-01-29 17:00:00+00', 'scheduled', 2, null, null),
    (LAN, UNI, '2026-01-29 19:15:00+00', 'scheduled', 2, null, null),
    (BEL, TIG, '2026-01-29 19:15:00+00', 'scheduled', 2, null, null),
    (ERC, ARG, '2026-01-29 21:30:00+00', 'scheduled', 2, null, null),
    (SAR, BAN, '2026-01-29 21:30:00+00', 'scheduled', 2, null, null);

    -- PRÓXIMAS FECHAS (Estimado basado en emparejamientos)
    INSERT INTO public.matches (home_team_id, away_team_id, start_time, status, round) VALUES
    (CCO, UNI, '2026-02-06 16:00:00+00', 'scheduled', 3),
    (ALD, ROS, '2026-02-07 12:00:00+00', 'scheduled', 3),
    (RAC, ARG, '2026-02-07 13:00:00+00', 'scheduled', 3),
    (BOC, IND, '2026-02-08 20:00:00+00', 'scheduled', 3),
    (RIV, BEL, '2026-02-08 18:00:00+00', 'scheduled', 3);
    
    -- Superclásico 2026 Estimado (Fecha 15)
    INSERT INTO public.matches (home_team_id, away_team_id, start_time, status, round) VALUES
    (BOC, RIV, '2026-05-10 15:30:00+00', 'scheduled', 15);

END $$;
