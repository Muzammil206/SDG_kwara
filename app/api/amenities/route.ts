import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AmenityType } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const types  = searchParams.getAll('type') as AmenityType[]
  const lga    = searchParams.get('lga')
  const status = searchParams.get('status')
  const limit  = parseInt(searchParams.get('limit') ?? '500')

  const supabase = await createClient()

  let query = supabase
    .from('amenities')
    .select('*')
    .limit(limit)

  if (types.length)  query = query.in('amenity_type', types)
  if (lga)           query = query.eq('lga_id', lga)
  if (status)        query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, count: data?.length ?? 0 })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('amenities')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
