// ─── Enums ────────────────────────────────────────────────────────────────────
export type AmenityType = 'health' | 'power' | 'water' | 'road'
export type AmenityStatus =
  | 'functional'
  | 'non_functional'
  | 'under_construction'
  | 'unknown'

// ─── DB Row Types ─────────────────────────────────────────────────────────────
export interface Amenity {
  id: string
  name: string
  amenity_type: AmenityType
  sub_type: string | null
  /** GeoJSON Point {type:'Point', coordinates:[lng,lat]} */
  location: { type: 'Point'; coordinates: [number, number] }
  geometry: GeoJSON.Geometry | null
  lga_id: string | null
  status: AmenityStatus
  attributes: Record<string, unknown>
  verified_at: string | null
  created_at: string
  created_by: string | null
}

export interface LGA {
  id: string
  name: string
  boundary: GeoJSON.MultiPolygon | null
  population: number | null
  area_km2: number | null
}

export interface StudyBoundary {
  id: string
  name: string | null
  geom: GeoJSON.Polygon
  created_by: string | null
  created_at: string
}

export interface AmenityStatusLog {
  id: string
  amenity_id: string
  old_status: AmenityStatus | null
  new_status: AmenityStatus
  notes: string | null
  changed_by: string | null
  changed_at: string
}

// ─── RPC return types ─────────────────────────────────────────────────────────
export interface LGAStat {
  lga_id: string
  lga_name: string
  amenity_type: AmenityType
  count: number
  functional_count: number
}

// ─── UI constants ─────────────────────────────────────────────────────────────
export const LAYER_COLORS: Record<AmenityType, string> = {
  health: '#E63946',
  power:  '#F4A261',
  water:  '#2196F3',
  road:   '#6D4C41',
}

export const LAYER_LABELS: Record<AmenityType, string> = {
  health: 'Health',
  power:  'Power',
  water:  'Water',
  road:   'Road',
}

export const STATUS_COLORS: Record<AmenityStatus, string> = {
  functional:         '#1A5F3F',
  non_functional:     '#E63946',
  under_construction: '#F4A261',
  unknown:            '#9E9E9E',
}

export const ALL_LAYERS: AmenityType[] = ['health', 'power', 'water', 'road']
