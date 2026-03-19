import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'




export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { subscription } = await request.json()

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 })
    }

    const { endpoint, keys } = subscription

    // Upsert the subscription (endpoint is unique for the browser/device)
    // We'll insert it if it doesn't exist, though without a unique constraint on endpoint
    // we should really delete existing matches first or just insert it.
    // For simplicity, let's delete any existing matching endpoint to avoid duplicates, then insert.
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)

    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })

    if (insertError) {
      console.error('Push sub insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push sub error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
