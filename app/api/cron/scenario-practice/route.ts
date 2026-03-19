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

const SCENARIO_MESSAGES = [
  { title: '\u{1F3AC} Scenario Time!', body: 'Take 5 minutes to practice a medical interpretation scenario.' },
  { title: '\u{1F5E3}\u{FE0F} Ready to speak?', body: 'Try the new exact recall practice mode in scenarios.' },
  { title: '\u{1F4C8} Boost your skills', body: 'A quick scenario practice can improve your fluency significantly.' },
  { title: '\u{1F3AE} New scenarios waiting!', body: 'Jump into a scenario and test your interpretation accuracy.' },
]

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Get a random scenario
    const { data: scenarios, error: scenarioError } = await supabase
      .from('scenarios')
      .select('id, title')
      .limit(50)

    if (scenarioError || !scenarios || scenarios.length === 0) {
      return NextResponse.json({ error: 'No scenarios found' }, { status: 500 })
    }

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]

    // 2. Get all push subscriptions
    const { data: subs, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (subError || !subs || subs.length === 0) {
      return NextResponse.json({ message: 'No subscribers yet' })
    }

    // Pick a random introductory message
    const msg = SCENARIO_MESSAGES[Math.floor(Math.random() * SCENARIO_MESSAGES.length)]

    const payload = JSON.stringify({
      title: msg.title,
      body: `Practice "${scenario.title}" now! - ${msg.body}`,
      tag: 'scenario-practice',
      url: `/scenarios/${scenario.id}`,
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

    // Clean up expired/invalid subscriptions
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
    console.error('Cron scenario-practice error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
