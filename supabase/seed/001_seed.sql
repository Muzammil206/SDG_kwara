-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Kwara State LGAs (16 local government areas)
-- Seed: Sample amenities for development/testing
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── LGAs (approximate centroids — replace boundary geometries with real GADM data) ──
INSERT INTO lgas (name, population) VALUES
  ('Asa',          203896),
  ('Baruten',      262336),
  ('Edu',          216069),
  ('Ekiti',        108925),
  ('Ifelodun',     249104),
  ('Ilorin East',  376583),
  ('Ilorin South', 293657),
  ('Ilorin West',  502477),
  ('Irepodun',     232028),
  ('Isin',         106711),
  ('Kaiama',       181834),
  ('Moro',         203476),
  ('Offa',         159512),
  ('Oke Ero',      119990),
  ('Oyun',         159416),
  ('Patigi',       143532)
ON CONFLICT (name) DO NOTHING;

-- ─── Sample amenities (Ilorin area — approx coordinates) ─────────────────────
DO $$
DECLARE
  ilorin_west_id uuid;
  ilorin_east_id uuid;
  offa_id        uuid;
  edu_id         uuid;
BEGIN
  SELECT id INTO ilorin_west_id FROM lgas WHERE name = 'Ilorin West';
  SELECT id INTO ilorin_east_id FROM lgas WHERE name = 'Ilorin East';
  SELECT id INTO offa_id        FROM lgas WHERE name = 'Offa';
  SELECT id INTO edu_id         FROM lgas WHERE name = 'Edu';

  -- HEALTH
  INSERT INTO amenities (name, amenity_type, sub_type, location, lga_id, status, attributes) VALUES
    ('University of Ilorin Teaching Hospital', 'health', 'tertiary_hospital',
     ST_SetSRID(ST_MakePoint(4.6417, 8.4866), 4326), ilorin_west_id, 'functional',
     '{"beds": 500, "level": "tertiary", "ownership": "federal"}'::jsonb),

    ('General Hospital Ilorin', 'health', 'secondary_hospital',
     ST_SetSRID(ST_MakePoint(4.5533, 8.4966), 4326), ilorin_west_id, 'functional',
     '{"beds": 240, "level": "secondary", "ownership": "state"}'::jsonb),

    ('PHC Oke-Ose', 'health', 'primary_health_centre',
     ST_SetSRID(ST_MakePoint(4.5812, 8.5103), 4326), ilorin_west_id, 'functional',
     '{"beds": 20, "level": "primary", "ownership": "local"}'::jsonb),

    ('Ilorin East General Clinic', 'health', 'clinic',
     ST_SetSRID(ST_MakePoint(4.6023, 8.5234), 4326), ilorin_east_id, 'non_functional',
     '{"beds": 15, "level": "primary", "ownership": "local"}'::jsonb),

    ('Offa General Hospital', 'health', 'secondary_hospital',
     ST_SetSRID(ST_MakePoint(4.7196, 8.1503), 4326), offa_id, 'functional',
     '{"beds": 120, "level": "secondary", "ownership": "state"}'::jsonb),

    ('Edu PHC Lafiagi', 'health', 'primary_health_centre',
     ST_SetSRID(ST_MakePoint(5.4238, 8.8703), 4326), edu_id, 'under_construction',
     '{"beds": 10, "level": "primary", "ownership": "local"}'::jsonb);

  -- POWER
  INSERT INTO amenities (name, amenity_type, sub_type, location, lga_id, status, attributes) VALUES
    ('Ilorin Transmission Substation', 'power', 'transmission_substation',
     ST_SetSRID(ST_MakePoint(4.5751, 8.5042), 4326), ilorin_west_id, 'functional',
     '{"capacity_kva": 60000, "voltage": "132/33kV"}'::jsonb),

    ('Substation A — Tanke', 'power', 'distribution_substation',
     ST_SetSRID(ST_MakePoint(4.6134, 8.5167), 4326), ilorin_west_id, 'functional',
     '{"capacity_kva": 2000, "voltage": "33/11kV"}'::jsonb),

    ('Transformer 7 — GRA', 'power', 'distribution_transformer',
     ST_SetSRID(ST_MakePoint(4.6301, 8.4921), 4326), ilorin_east_id, 'functional',
     '{"capacity_kva": 500, "voltage": "11/0.415kV"}'::jsonb),

    ('Offa Injection Substation', 'power', 'injection_substation',
     ST_SetSRID(ST_MakePoint(4.7215, 8.1489), 4326), offa_id, 'non_functional',
     '{"capacity_kva": 15000, "voltage": "33/11kV"}'::jsonb);

  -- WATER
  INSERT INTO amenities (name, amenity_type, sub_type, location, lga_id, status, attributes) VALUES
    ('Ilorin Waterworks — Agba Dam', 'water', 'water_treatment_plant',
     ST_SetSRID(ST_MakePoint(4.5123, 8.5312), 4326), ilorin_west_id, 'functional',
     '{"source_type": "surface", "capacity_m3_day": 120000}'::jsonb),

    ('Borehole #12 — Fate Road', 'water', 'borehole',
     ST_SetSRID(ST_MakePoint(4.5934, 8.5178), 4326), ilorin_west_id, 'functional',
     '{"depth_m": 120, "yield_lph": 5000, "pump_type": "submersible"}'::jsonb),

    ('Borehole #7 — Amilegbe', 'water', 'borehole',
     ST_SetSRID(ST_MakePoint(4.5677, 8.4934), 4326), ilorin_west_id, 'non_functional',
     '{"depth_m": 90, "yield_lph": 3200, "pump_type": "submersible"}'::jsonb),

    ('Edu Pipe-borne Water Scheme', 'water', 'pipe_scheme',
     ST_SetSRID(ST_MakePoint(5.4301, 8.8812), 4326), edu_id, 'under_construction',
     '{"source_type": "groundwater", "capacity_m3_day": 5000}'::jsonb),

    ('Offa Water Supply — Storage Tank', 'water', 'storage_tank',
     ST_SetSRID(ST_MakePoint(4.7145, 8.1601), 4326), offa_id, 'functional',
     '{"capacity_m3": 500}'::jsonb);

  -- ROAD
  INSERT INTO amenities (name, amenity_type, sub_type, location, lga_id, status, attributes) VALUES
    ('Ilorin–Ogbomosho Road (A123)', 'road', 'federal_highway',
     ST_SetSRID(ST_MakePoint(4.6501, 8.4401), 4326), ilorin_east_id, 'functional',
     '{"surface": "asphalt", "lanes": 2, "length_km": 48}'::jsonb),

    ('Ilorin–Offa Road (S201)', 'road', 'state_road',
     ST_SetSRID(ST_MakePoint(4.6012, 8.3201), 4326), ilorin_west_id, 'non_functional',
     '{"surface": "asphalt", "lanes": 2, "length_km": 62, "condition": "poor"}'::jsonb),

    ('Tanke–Airport Link Road', 'road', 'urban_road',
     ST_SetSRID(ST_MakePoint(4.6201, 8.5012), 4326), ilorin_west_id, 'functional',
     '{"surface": "asphalt", "lanes": 4, "length_km": 8}'::jsonb);

END $$;
