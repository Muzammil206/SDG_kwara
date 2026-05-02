import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') ?? '5')

    const supabase = await createClient()

    // Get recent amenities as "alerts" (simulated from created_at)
    const { data, error } = await supabase
      .from('tanke_oke_odo_survey')
      .select('id, name, amenity_type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to alert format
    const alerts = (data ?? []).map((item: any) => ({
      id: item.id,
      amenity_id: item.id,
      amenity_name: item.name,
      amenity_type: item.amenity_type,
      old_status: null,
      new_status: item.status,
      notes: 'Recently added',
      changed_by: null,
      changed_at: item.created_at,
    }))

    return NextResponse.json({ data: alerts, count: alerts.length }, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch alerts',
    }, { status: 500 })
  }
}
