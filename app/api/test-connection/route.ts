import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return NextResponse.json({
    database_connection: {
      supabase_url: url ? `✅ Configured (${url.substring(0, 20)}...)` : '❌ Missing NEXT_PUBLIC_SUPABASE_URL',
      anon_key: key ? `✅ Configured (${key.substring(0, 20)}...)` : '❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY',
      status: url && key ? 'READY' : 'NOT CONFIGURED',
    },
    next_steps: 
      url && key
        ? 'Environment variables are set. Connection should work.'
        : 'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file',
  })
}
