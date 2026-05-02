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
      // Build query params
      const params = new URLSearchParams()
      activeLayers.forEach(type => params.append('type', type))
      
      const response = await fetch(`/api/amenities?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
      
      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      
      const data = result.data ?? []
      setAmenities(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load amenities')
      console.error('Error fetching amenities:', err)
    } finally {
      setLoading(false)
    }
  }, [activeLayers.join(',')])

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
        { event: '*', schema: 'public', table: 'tanke_oke_odo_survey' },
        () => fetchAmenities()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeLayers.join(','), fetchAmenities])

  return { amenities, loading, error, refetch: fetchAmenities }
}
