import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:noreply@eng-amh-trainer.vercel.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

// Vercel Cron Security: https://vercel.com/docs/cron-jobs#securing-cron-jobs
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Get a random glossary term
    const { data: terms, error: termError } = await supabase
      .from('study_entries')
      .select('id, english_term, amharic_term')
      .not('amharic_term', 'is', null)
      .not('amharic_term', 'eq', '')
      .limit(50)

    if (termError || !terms || terms.length === 0) {
      return NextResponse.json({ error: 'No terms found' }, { status: 500 })
    }

    const term = terms[Math.floor(Math.random() * terms.length)]

    // 2. Get all push subscriptions
    const { data: subs, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (subError || !subs || subs.length === 0) {
      return NextResponse.json({ message: 'No subscribers yet' })
    }

    // 3. Send notification to all subscribers
    const payload = JSON.stringify({
      title: `📚 Word of the moment`,
      body: `${term.english_term} → ${term.amharic_term}`,
      tag: 'random-word',
      url: `/glossary?term=${encodeURIComponent(term.english_term)}`,
    })

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    )

    // Clean up expired/invalid subscriptions (410 Gone)
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
    console.error('Cron random-word error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
