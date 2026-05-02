'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import MaplibreDraw from 'maplibre-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'

 
import { useAmenities } from '@/lib/hooks/useAmenities'
import { LAYER_COLORS, LAYER_LABELS } from '@/types'
import type { AmenityType, Amenity } from '@/types'

// Custom icon SVGs for each amenity type (larger for better visibility)
const AMENITY_ICONS: Record<AmenityType, string> = {
  health: `<svg width="48" height="56" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="12" rx="12" ry="8" fill="#E63946"/>
    <path d="M12 15C8 18 5 22 5 27C5 38 24 52 24 52C24 52 43 38 43 27C43 22 40 18 36 15L24 30L12 15Z" fill="#E63946"/>
    <path d="M24 22L24 30M20 26L28 26" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  
  power: `<svg width="48" height="56" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="12" rx="12" ry="8" fill="#F4A261"/>
    <path d="M12 15C8 18 5 22 5 27C5 38 24 52 24 52C24 52 43 38 43 27C43 22 40 18 36 15L24 30L12 15Z" fill="#F4A261"/>
    <path d="M24 18L27 25L34 25L28 30L31 38L24 33L17 38L20 30L14 25L21 25L24 18Z" fill="white"/>
  </svg>`,
  
  water: `<svg width="48" height="56" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="12" rx="12" ry="8" fill="#2196F3"/>
    <path d="M12 15C8 18 5 22 5 27C5 38 24 52 24 52C24 52 43 38 43 27C43 22 40 18 36 15L24 30L12 15Z" fill="#2196F3"/>
    <circle cx="24" cy="25" r="4" fill="white"/>
    <path d="M24 29V34" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  
  road: `<svg width="48" height="56" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="12" rx="12" ry="8" fill="#6D4C41"/>
    <path d="M12 15C8 18 5 22 5 27C5 38 24 52 24 52C24 52 43 38 43 27C43 22 40 18 36 15L24 30L12 15Z" fill="#6D4C41"/>
    <rect x="20" y="18" width="8" height="14" fill="white"/>
    <circle cx="24" cy="35" r="1.5" fill="white"/>
  </svg>`,
}

// ─── Tile styles (all free, no token) ────────────────────────────────────────
export const TILE_STYLES = {
  streets:   'https://tiles.openfreemap.org/styles/liberty',
  positron:  'https://tiles.openfreemap.org/styles/positron',
  fiord:     'https://tiles.openfreemap.org/styles/fiord-color',
} as const

export type BasemapKey = keyof typeof TILE_STYLES

// Get data URL for icon
function getIconDataUrl(svgString: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
}

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
    map.current.on('load', () => {
      // Add custom icons for each amenity type using canvas
      const loadIcon = (type: AmenityType): Promise<void> => {
        return new Promise((resolve) => {
          if (map.current?.hasImage(type)) {
            resolve()
            return
          }
          
          const canvas = document.createElement('canvas')
          canvas.width = 48
          canvas.height = 56
          
          const img = new Image()
          img.onload = () => {
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0, 48, 56)
              const imageData = ctx.getImageData(0, 0, 48, 56)
              
              if (map.current && !map.current.hasImage(type)) {
                map.current.addImage(type, imageData, { pixelRatio: 1 })
              }
            }
            resolve()
          }
          img.onerror = () => {
            console.error(`Failed to load ${type} icon`)
            resolve()
          }
          img.src = getIconDataUrl(AMENITY_ICONS[type])
        })
      }

      // Load all icons in parallel
      Promise.all([
        loadIcon('health'),
        loadIcon('power'),
        loadIcon('water'),
        loadIcon('road'),
      ]).then(() => {
        console.log('All icons loaded')
        setMapReady(true)
      })
    })

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

  // ── Zoom to first amenity when data loads ──────────────────────────────────────
  useEffect(() => {
    if (!map.current || !mapReady || amenities.length === 0) return
    
    // Delay zoom to ensure layers are rendered
    const timer = setTimeout(() => {
      const firstAmenity = amenities[0]
      if (!firstAmenity.location?.coordinates) return
      
      const [lng, lat] = firstAmenity.location.coordinates
      console.log('Zooming to first amenity:', { lng, lat, name: firstAmenity.name })
      map.current?.easeTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1000,
      })
    }, 500)
    
    return () => clearTimeout(timer)
  }, [amenities, mapReady]) // eslint-disable-line

  const updateLayers = useCallback(() => {
    const m = map.current
    if (!m || !m.isStyleLoaded()) return

    console.log('Updating layers with', amenities.length, 'amenities')

    // Build features with better coordinate handling
    const features = amenities
      .map((a: Amenity) => {
        let coords: [number, number] | null = null

        // Try to get coordinates from location.coordinates first
        if (a.location && typeof a.location === 'object' && 'coordinates' in a.location) {
          const coord = (a.location as any).coordinates
          if (Array.isArray(coord) && coord.length === 2) {
            coords = [coord[0], coord[1]] as [number, number]
          }
        }
        
        // Fallback to longitude/latitude if available
        if (!coords && a.longitude !== undefined && a.latitude !== undefined) {
          coords = [a.longitude, a.latitude] as [number, number]
        }

        if (!coords) {
          console.warn('No coordinates for amenity:', a.name)
          return null
        }

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coords,
          },
          properties: {
            id: a.id,
            name: a.name,
            amenity_type: a.amenity_type,
            sub_type: a.sub_type ?? a.amenity_type,
            status: a.status,
            color: LAYER_COLORS[a.amenity_type],
          },
        } as any
      })
      .filter((f) => f !== null) as any[]

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: features,
    }

    console.log('GeoJSON features created:', geojson.features.length)

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
      type: 'symbol',
      source: 'amenities',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': ['get', 'amenity_type'],
        'icon-size': 0.8,
        'icon-allow-overlap': true,
        'icon-anchor': 'bottom',
        'text-field': '',
      },
      paint: {
        'icon-opacity': [
          'case', ['==', ['get', 'status'], 'functional'], 1, 0.55,
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
