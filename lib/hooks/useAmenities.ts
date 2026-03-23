'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Amenity, AmenityType } from '@/types'

export function useAmenities(
  activeLayers: AmenityType[],
  boundaryGeom?: GeoJSON.Polygon | null
) {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAmenities = useCallback(async () => {
    if (!activeLayers.length) {
      setAmenities([])
      return
    }
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      let data: Amenity[]

      if (boundaryGeom) {
        const { data: rpcData, error: rpcErr } = await supabase.rpc(
          'get_amenities_in_boundary',
          {
            boundary_geom: JSON.stringify(boundaryGeom),
            types: activeLayers,
          }
        )
        if (rpcErr) throw rpcErr
        data = rpcData ?? []
      } else {
        const { data: queryData, error: queryErr } = await supabase
          .from('amenities')
          .select('*')
          .in('amenity_type', activeLayers)
        if (queryErr) throw queryErr
        data = queryData ?? []
      }

      setAmenities(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load amenities')
    } finally {
      setLoading(false)
    }
  }, [activeLayers.join(','), boundaryGeom])

  useEffect(() => {
    fetchAmenities()
  }, [fetchAmenities])

  // Realtime subscription for live updates
  useEffect(() => {
    if (!activeLayers.length) return
    const supabase = createClient()

    const channel = supabase
      .channel('amenities-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'amenities' },
        () => fetchAmenities()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeLayers.join(',')])

  return { amenities, loading, error, refetch: fetchAmenities }
}
