-- ─────────────────────────────────────────────────────────────────────────────
-- Naviss SDM — Kwara State
-- Migration 001: Initial schema
-- Run: bunx supabase db push  (or paste into Supabase SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE amenity_type_enum AS ENUM (
  'health', 'power', 'water', 'road'
);

CREATE TYPE status_enum AS ENUM (
  'functional', 'non_functional', 'under_construction', 'unknown'
);

-- ─── LGAs ────────────────────────────────────────────────────────────────────
CREATE TABLE lgas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  boundary   geometry(MultiPolygon, 4326),
  population integer,
  area_km2   numeric GENERATED ALWAYS AS (
               ROUND((ST_Area(boundary::geography) / 1e6)::numeric, 2)
             ) STORED
);

CREATE INDEX lgas_boundary_gist ON lgas USING GIST (boundary);

-- ─── Amenities ───────────────────────────────────────────────────────────────
CREATE TABLE amenities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  amenity_type  amenity_type_enum NOT NULL,
  sub_type      text,
  -- Point geometry (required)
  location      geometry(Point, 4326) NOT NULL,
  -- Optional polygon/linestring (e.g. road segment, facility plot)
  geometry      geometry(Geometry, 4326),
  lga_id        uuid REFERENCES lgas(id) ON DELETE SET NULL,
  status        status_enum NOT NULL DEFAULT 'unknown',
  -- Flexible per-type attributes stored as JSON
  -- Health:  { beds, level, ownership }
  -- Power:   { capacity_kva, voltage }
  -- Water:   { source_type, depth_m, yield_lph }
  -- Road:    { surface, lanes, length_km }
  attributes    jsonb NOT NULL DEFAULT '{}',
  verified_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Spatial index
CREATE INDEX amenities_location_gist ON amenities USING GIST (location);
CREATE INDEX amenities_geometry_gist ON amenities USING GIST (geometry) WHERE geometry IS NOT NULL;
-- Filtering indexes
CREATE INDEX amenities_type_status  ON amenities (amenity_type, status);
CREATE INDEX amenities_lga_id       ON amenities (lga_id);
CREATE INDEX amenities_created_at   ON amenities (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER amenities_updated_at
  BEFORE UPDATE ON amenities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Study boundaries ─────────────────────────────────────────────────────────
CREATE TABLE study_boundaries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text,
  geom       geometry(Polygon, 4326) NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX study_boundaries_geom_gist ON study_boundaries USING GIST (geom);

-- ─── Status audit log ─────────────────────────────────────────────────────────
CREATE TABLE amenity_status_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amenity_id   uuid NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  old_status   status_enum,
  new_status   status_enum NOT NULL,
  notes        text,
  changed_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX amenity_status_log_amenity ON amenity_status_log (amenity_id);
CREATE INDEX amenity_status_log_changed ON amenity_status_log (changed_at DESC);

-- Auto-log status changes
CREATE OR REPLACE FUNCTION log_amenity_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO amenity_status_log (amenity_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER amenity_status_change_log
  AFTER UPDATE ON amenities
  FOR EACH ROW EXECUTE FUNCTION log_amenity_status_change();

-- ─── RPC: amenities within a drawn/uploaded boundary ─────────────────────────
CREATE OR REPLACE FUNCTION get_amenities_in_boundary(
  boundary_geom  geometry,
  types          amenity_type_enum[] DEFAULT NULL,
  statuses       status_enum[]       DEFAULT NULL
)
RETURNS SETOF amenities
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM amenities
  WHERE ST_Within(location, boundary_geom)
    AND (types    IS NULL OR amenity_type = ANY(types))
    AND (statuses IS NULL OR status       = ANY(statuses));
$$;

-- ─── RPC: aggregated stats per LGA ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_lga_stats()
RETURNS TABLE (
  lga_id          uuid,
  lga_name        text,
  amenity_type    amenity_type_enum,
  count           bigint,
  functional_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    l.id,
    l.name,
    a.amenity_type,
    COUNT(*)                                               AS count,
    COUNT(*) FILTER (WHERE a.status = 'functional')        AS functional_count
  FROM amenities a
  JOIN lgas l ON a.lga_id = l.id
  GROUP BY l.id, l.name, a.amenity_type
  ORDER BY l.name, a.amenity_type;
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE amenities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_boundaries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenity_status_log ENABLE ROW LEVEL SECURITY;

-- Public read on amenities and LGAs
CREATE POLICY "amenities_public_read"
  ON amenities FOR SELECT USING (true);

CREATE POLICY "lgas_public_read"
  ON lgas FOR SELECT USING (true);

-- Authenticated write on amenities
CREATE POLICY "amenities_auth_insert"
  ON amenities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "amenities_auth_update"
  ON amenities FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Study boundaries — owner only
CREATE POLICY "boundaries_owner_all"
  ON study_boundaries FOR ALL
  USING (created_by = auth.uid());

-- Status log — public read
CREATE POLICY "status_log_public_read"
  ON amenity_status_log FOR SELECT USING (true);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime on these tables in Supabase dashboard:
-- Supabase > Database > Replication > amenities, amenity_status_log
