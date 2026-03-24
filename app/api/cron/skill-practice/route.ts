import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export const dynamic = 'force-dynamic'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:noreply@eng-amh-trainer.vercel.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Get all push subscriptions
    const { data: subs, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (subError || !subs || subs.length === 0) {
      return NextResponse.json({ message: 'No subscribers yet' })
    }

    // 2. We don't need to dynamically fetch weak words per user because this is a broadcast ping
    // We can just send a generic motivational ping to drill weak words or play the match game
    const MESSAGES = [
      { t: "⚡ Time for a quick drill!", b: "Clear out your Weak Words list to maintain your streak.", u: "/weak-words" },
      { t: "🧠 Memory fading?", b: "Spend 2 minutes reviewing your flashcards today.", u: "/flashcards" },
      { t: "⌚ Speed challenge", b: "Can you beat your record in the matching game?", u: "/match" }
    ]
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]

    // 3. Send notification to all subscribers
    const payload = JSON.stringify({
      title: msg.t,
      body: msg.b,
      tag: 'skill-practice',
      url: msg.u,
    })

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    // Clean up expired endpoints
    const expiredEndpoints: string[] = []
    subs.forEach((sub, i) => {
      const result = results[i]
      if (result.status === 'rejected') {
        const err = result.reason
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint)
        }
      }
    })

    if (expiredEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
    }

    const sent = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ success: true, sent, expired: expiredEndpoints.length })
  } catch (error) {
    console.error('Cron skill-practice error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
