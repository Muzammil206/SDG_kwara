'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AmenityStatusLog } from '@/types'

interface AlertWithMeta extends AmenityStatusLog {
  amenity_name: string
  amenity_type: string
}

export function useAlerts(limit = 5) {
  const [alerts, setAlerts] = useState<AlertWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('amenity_status_log')
      .select(`
        *,
        amenities ( name, amenity_type )
      `)
      .order('changed_at', { ascending: false })
      .limit(limit)

    const mapped = (data ?? []).map((row: any) => ({
      ...row,
      amenity_name: row.amenities?.name ?? 'Unknown',
      amenity_type: row.amenities?.amenity_type ?? 'unknown',
    }))
    setAlerts(mapped)
    setLoading(false)
  }

  useEffect(() => {
    fetchAlerts()
    const supabase = createClient()
    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'amenity_status_log' },
        () => fetchAlerts()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return { alerts, loading }
}
