'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushSubscriptionToggle() {
  const [mounted, setMounted] = useState(false)
  const [supported, setSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    setMounted(true)
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(isSupported)

    if (!isSupported) {
      setIsLoading(false)
      return
    }

    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        setRegistration(reg)
        return reg.pushManager.getSubscription()
      })
      .then((sub) => {
        if (sub) {
          setSubscription(sub)
          setIsSubscribed(true)
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err)
        setIsLoading(false)
      })
  }, [])

  // Don't render anything until mounted on the client
  if (!mounted) return null

  // Show nothing if unsupported (shouldn't usually happen)
  if (!supported) {
    return (
      <div className="card" style={{ padding: '14px 16px', marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
        🔔 Push notifications are not supported in this browser.
      </div>
    )
  }

  const handleSubscribe = async () => {
    setIsLoading(true)
    setStatusMsg('')
    try {
      if (!registration) throw new Error('Service worker not ready')

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('Missing VAPID key')

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      setSubscription(sub)
      setIsSubscribed(true)

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      })

      if (!res.ok) throw new Error('Server failed to save subscription')
      setStatusMsg('✅ Notifications enabled!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to subscribe:', msg)
      setStatusMsg('❌ ' + msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setIsLoading(true)
    setStatusMsg('')
    try {
      if (subscription) {
        await subscription.unsubscribe()
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {})
        setSubscription(null)
        setIsSubscribed(false)
        setStatusMsg('Notifications disabled.')
      }
    } catch (err) {
      console.error('Failed to unsubscribe', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        marginBottom: '24px',
        borderLeft: isSubscribed ? '4px solid var(--success)' : '4px solid var(--brand-300)',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isSubscribed ? 'var(--success-bg, #ecfdf5)' : 'var(--surface-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isSubscribed
            ? <Bell size={20} color="var(--success, #10b981)" />
            : <BellOff size={20} color="var(--text-muted)" />}
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Practice Reminders
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            {isSubscribed
              ? 'Reminders enabled — word every 30 min, reminder every 3 hrs.'
              : 'Get a random word every 30 min & practice reminders every 3 hrs.'}
          </p>
          {statusMsg && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{statusMsg}</p>
          )}
        </div>
      </div>

      <button
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={isLoading}
        className={`btn btn-sm ${isSubscribed ? 'btn-ghost' : 'btn-primary'}`}
        style={{ minWidth: '100px', justifyContent: 'center' }}
      >
        {isLoading
          ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          : isSubscribed ? 'Disable' : '🔔 Enable'}
      </button>
    </div>
  )
}
