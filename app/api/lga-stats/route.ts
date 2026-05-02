import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AmenityType, AmenityStatus } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch all amenities
    const { data: amenities, error } = await supabase
      .from('tanke_oke_odo_survey')
      .select('id, lga, amenity_type, status')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate stats grouped by LGA and amenity type
    const statsMap = new Map<string, any>()

    amenities?.forEach((amenity: any) => {
      const lga = amenity.lga || 'Unknown'
      const amenity_type = amenity.amenity_type as AmenityType
      const status = amenity.status as AmenityStatus
      const key = `${lga}|${amenity_type}`

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          lga_id: lga,
          lga_name: lga,
          amenity_type,
          count: 0,
          functional_count: 0,
        })
      }

      const stat = statsMap.get(key)
      stat.count += 1
      if (status === 'functional') {
        stat.functional_count += 1
      }
    })

    const stats = Array.from(statsMap.values())

    return NextResponse.json({ 
      data: stats, 
      count: stats.length 
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    }, { status: 500 })
  }
}
