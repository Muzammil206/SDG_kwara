import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test 1: Check amenities table
    const { data: amenities, error: amenitiesError, count: amenitiesCount } = await supabase
      .from('amenities')
      .select('*', { count: 'exact' })
      .limit(1)

    // Test 2: Check lgas table
    const { data: lgas, error: lgasError, count: lgasCount } = await supabase
      .from('lgas')
      .select('*', { count: 'exact' })
      .limit(1)

    // Test 3: Try querying with filters (common case)
    const { data: filtered, error: filteredError } = await supabase
      .from('amenities')
      .select('id, name, amenity_type, status, lga_id')
      .eq('status', 'functional')
      .limit(5)

    const results = {
      status: 'connected',
      timestamp: new Date().toISOString(),
      environment: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ set' : '✗ missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ set' : '✗ missing',
      },
      tables: {
        amenities: {
          accessible: !amenitiesError,
          count: amenitiesCount,
          error: amenitiesError?.message,
          sample: amenities?.[0] ? {
            id: amenities[0].id,
            name: amenities[0].name,
            amenity_type: amenities[0].amenity_type,
          } : null,
        },
        lgas: {
          accessible: !lgasError,
          count: lgasCount,
          error: lgasError?.message,
          sample: lgas?.[0] ? {
            id: lgas[0].id,
            name: lgas[0].name,
          } : null,
        },
      },
      queries: {
        filtered: {
          successful: !filteredError,
          count: filtered?.length || 0,
          error: filteredError?.message,
        },
      },
    }

    const allGood = !amenitiesError && !lgasError && !filteredError
    
    return NextResponse.json(results, { 
      status: allGood ? 200 : 500 
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to database',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
