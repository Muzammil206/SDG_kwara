'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import MaplibreDraw from 'maplibre-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'

 
import { useAmenities } from '@/lib/hooks/useAmenities'
import { LAYER_COLORS } from '@/types'
import type { AmenityType } from '@/types'

// ─── Tile styles (all free, no token) ────────────────────────────────────────
export const TILE_STYLES = {
  streets:   'https://tiles.openfreemap.org/styles/liberty',
  positron:  'https://tiles.openfreemap.org/styles/positron',
  fiord:     'https://tiles.openfreemap.org/styles/fiord-color',
} as const

export type BasemapKey = keyof typeof TILE_STYLES

// Kwara State center [lng, lat]
const KWARA_CENTER: [number, number] = [4.5291, 8.9669]
const KWARA_ZOOM = 8

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  activeLayers: AmenityType[]
  vizMode: 'markers' | 'heatmap' | 'choropleth'
  basemap: BasemapKey
  onAmenityClick?: (amenity: Record<string, unknown>) => void
  onBoundaryChange?: (geom: GeoJSON.Polygon | null) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SDMMap({
  activeLayers,
  vizMode,
  basemap,
  onAmenityClick,
  onBoundaryChange,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const draw = useRef<MaplibreDraw | null>(null)
  const popup = useRef<maplibregl.Popup | null>(null)
  const [boundaryGeom, setBoundaryGeom] = useState<GeoJSON.Polygon | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const { amenities, loading } = useAmenities(activeLayers, boundaryGeom)

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: TILE_STYLES[basemap],
      center: KWARA_CENTER,
      zoom: KWARA_ZOOM,
      attributionControl: { compact: true },
    })

    // Draw control
    draw.current = new MaplibreDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      styles: drawStyles,
    }) as unknown as MaplibreDraw

    map.current.addControl(draw.current as any, 'top-left')
    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right'
    )
    map.current.addControl(
      new maplibregl.ScaleControl({ unit: 'metric' }),
      'bottom-right'
    )

    map.current.on('draw.create', (e: any) => {
      const geom = e.features[0]?.geometry as GeoJSON.Polygon ?? null
      setBoundaryGeom(geom)
      onBoundaryChange?.(geom)
    })
    map.current.on('draw.delete', () => {
      setBoundaryGeom(null)
      onBoundaryChange?.(null)
    })
    map.current.on('load', () => setMapReady(true))

    return () => {
      map.current?.remove()
      map.current = null
      setMapReady(false)
    }
  }, []) // eslint-disable-line

  // ── Basemap swap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map.current) return
    map.current.setStyle(TILE_STYLES[basemap])
    map.current.once('styledata', () => {
      if (map.current?.isStyleLoaded()) updateLayers()
    })
  }, [basemap]) // eslint-disable-line

  // ── Update layers ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    updateLayers()
  }, [amenities, vizMode, mapReady]) // eslint-disable-line

  const updateLayers = useCallback(() => {
    const m = map.current
    if (!m || !m.isStyleLoaded()) return

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: amenities.map(a => ({
        type: 'Feature',
        geometry: a.location,
        properties: {
          id: a.id,
          name: a.name,
          amenity_type: a.amenity_type,
          sub_type: a.sub_type ?? a.amenity_type,
          status: a.status,
          color: LAYER_COLORS[a.amenity_type],
        },
      })),
    }

    // Remove existing layers & source
    const layerIds = [
      'sdm-heatmap',
      'sdm-clusters',
      'sdm-cluster-count',
      'sdm-markers',
    ]
    layerIds.forEach(id => { if (m.getLayer(id)) m.removeLayer(id) })
    if (m.getSource('amenities')) m.removeSource('amenities')

    m.addSource('amenities', {
      type: 'geojson',
      data: geojson,
      cluster: vizMode === 'markers',
      clusterMaxZoom: 13,
      clusterRadius: 45,
    })

    if (vizMode === 'heatmap') {
      m.addLayer({
        id: 'sdm-heatmap',
        type: 'heatmap',
        source: 'amenities',
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 6, 1, 14, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,    'rgba(0,0,0,0)',
            0.2,  'rgba(33,150,243,0.4)',
            0.5,  'rgba(244,162,97,0.6)',
            0.8,  'rgba(230,57,70,0.85)',
            1,    'rgb(178,24,43)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 6, 20, 14, 50],
          'heatmap-opacity': 0.9,
        },
      })
      return
    }

    // ── Marker / cluster view ──
    m.addLayer({
      id: 'sdm-clusters',
      type: 'circle',
      source: 'amenities',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#1A5F3F',
        'circle-radius': ['step', ['get', 'point_count'], 14, 10, 20, 50, 26],
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 2.5,
        'circle-opacity': 0.88,
      },
    })

    m.addLayer({
      id: 'sdm-cluster-count',
      type: 'symbol',
      source: 'amenities',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 12,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      },
      paint: { 'text-color': '#fff' },
    })

    m.addLayer({
      id: 'sdm-markers',
      type: 'circle',
      source: 'amenities',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 14, 11],
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 2,
        'circle-opacity': [
          'case', ['==', ['get', 'status'], 'functional'], 1, 0.45,
        ],
      },
    })

    // Popup
    m.off('click', 'sdm-markers', handleClick)
    m.on('click', 'sdm-markers', handleClick)
    m.on('mouseenter', 'sdm-markers', () => { m.getCanvas().style.cursor = 'pointer' })
    m.on('mouseleave', 'sdm-markers', () => { m.getCanvas().style.cursor = '' })

    // Expand cluster on click
    m.on('click', 'sdm-clusters', (e) => {
      const features = m.queryRenderedFeatures(e.point, { layers: ['sdm-clusters'] })
      const clusterId = features[0]?.properties?.cluster_id
      if (!clusterId) return
      const source = m.getSource('amenities') as maplibregl.GeoJSONSource
      source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
        const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number]
        m.easeTo({ center: coords, zoom })
      }).catch(() => {
        // Handle error silently
      })
    })
  }, [amenities, vizMode])

  const handleClick = useCallback((
    e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }
  ) => {
    const m = map.current
    if (!m || !e.features?.length) return
    const props = e.features[0].properties ?? {}
    const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number]

    popup.current?.remove()
    popup.current = new maplibregl.Popup({ maxWidth: '260px', offset: 12 })
      .setLngLat(coords)
      .setHTML(`
        <div style="font-size:13px;font-family:system-ui,sans-serif;padding:2px 0">
          <div style="font-weight:600;margin-bottom:3px;color:#111">${props['name'] ?? ''}</div>
          <div style="color:#777;font-size:11px;margin-bottom:8px;text-transform:capitalize">
            ${(props['sub_type'] ?? props['amenity_type'] ?? '').replace(/_/g,' ')}
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
            <span style="color:#999">Status</span>
            <span style="font-weight:500;color:${props['status'] === 'functional' ? '#1A5F3F' : props['status'] === 'non_functional' ? '#E63946' : '#F4A261'}">
              ${String(props['status'] ?? '').replace(/_/g,' ')}
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px">
            <span style="color:#999">Layer</span>
            <span style="text-transform:capitalize">${props['amenity_type'] ?? ''}</span>
          </div>
        </div>
      `)
      .addTo(m)

    onAmenityClick?.(props)
  }, [onAmenityClick])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '6px 14px',
          fontSize: 11, color: '#555', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
        }}>
          Loading features…
        </div>
      )}
    </div>
  )
}

// ─── Custom draw styles ───────────────────────────────────────────────────────
const drawStyles = [
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: { 'fill-color': '#1A5F3F', 'fill-opacity': 0.1 },
  },
  {
    id: 'gl-draw-polygon-stroke',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: { 'line-color': '#1A5F3F', 'line-width': 2, 'line-dasharray': [4, 2] },
  },
  {
    id: 'gl-draw-point',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point']],
    paint: {
      'circle-radius': 5,
      'circle-color': '#1A5F3F',
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 2,
    },
  },
]
