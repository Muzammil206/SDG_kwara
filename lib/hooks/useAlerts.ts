'use client'
import { useEffect, useState } from 'react'
import type { AmenityStatusLog } from '@/types'

interface AlertWithMeta extends AmenityStatusLog {
  amenity_name: string
  amenity_type: string
}

export function useAlerts(limit = 5) {
  const [alerts, setAlerts] = useState<AlertWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/alerts?limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch alerts')
      
      const result = await response.json()
      setAlerts(result.data ?? [])
    } catch (err) {
      console.error('Error fetching alerts:', err)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [limit])

  return { alerts, loading }
}
