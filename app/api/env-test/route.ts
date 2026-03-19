import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    HAS_NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    HAS_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    HAS_CRON_SECRET: !!process.env.CRON_SECRET,
    HAS_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    HAS_VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
    // Return the actual URL string if it exists to verify it didn't get compiled as undefined literal
    URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
    ENV_NODE_ENV: process.env.NODE_ENV,
    ENV_KEYS: Object.keys(process.env).filter(k => k.includes('SUPA') || k.includes('VAPID') || k.includes('CRON'))
  })
}
