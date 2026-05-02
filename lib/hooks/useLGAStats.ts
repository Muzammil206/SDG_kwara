'use client'
import { useEffect, useState } from 'react'
import type { LGAStat } from '@/types'

export function useLGAStats() {
  const [stats, setStats] = useState<LGAStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/lga-stats')
        if (!response.ok) throw new Error('Failed to fetch stats')
        
        const result = await response.json()
        setStats(result.data ?? [])
        console.log('LGA Stats loaded:', result.data?.length, 'rows')
      } catch (err) {
        console.error('Error fetching LGA stats:', err)
        setStats([])
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
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
