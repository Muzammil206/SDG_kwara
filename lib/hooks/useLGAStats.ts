'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LGAStat } from '@/types'

export function useLGAStats() {
  const [stats, setStats] = useState<LGAStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .rpc('get_lga_stats')
      .then(({ data }) => {
        setStats(data ?? [])
        setLoading(false)
      })
  }, [])

  // Totals per type
  const totals = stats.reduce(
    (acc, s) => {
      acc[s.amenity_type] = (acc[s.amenity_type] ?? 0) + Number(s.count)
      return acc
    },
    {} as Record<string, number>
  )

  return { stats, totals, loading }
}
