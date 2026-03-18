'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushSubscriptionToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      // Register Service Worker
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => {
          setRegistration(reg)
          // Check if already subscribed
          reg.pushManager.getSubscription().then((sub) => {
            if (sub) {
              setSubscription(sub)
              setIsSubscribed(true)
            }
            setIsLoading(false)
          })
        },
        (err) => {
          console.error('Service Worker registration failed: ', err)
          setIsLoading(false)
        }
      )
    } else {
      setIsLoading(false)
    }
  }, [])

  const subscribeButtonOnClick = async () => {
    setIsLoading(true)
    try {
      if (!registration) {
        throw new Error('No service worker registered yet.')
      }
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      })
      
      setSubscription(sub)
      setIsSubscribed(true)

      // Send to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: sub }),
      })

      if (!response.ok) {
        throw new Error('Server failed to save subscription')
      }

    } catch (err: any) {
      console.error('Failed to subscribe: ', err)
      if (err.message && err.message.includes('permission')) {
        alert('Please allow notification permissions in your browser settings.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeButtonOnClick = async () => {
    setIsLoading(true)
    try {
      if (subscription) {
        await subscription.unsubscribe()
        // Optionally tell API to delete endpoint, but cron will drop it locally if it 410s
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        }).catch(() => {})
        
        setSubscription(null)
        setIsSubscribed(false)
      }
    } catch (err) {
      console.error('Failed to unsubscribe', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (typeof window !== 'undefined' && !('serviceWorker' in navigator)) {
    return null // Not supported
  }

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', marginBottom: '24px', borderLeft: isSubscribed ? '4px solid var(--success)' : '4px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isSubscribed ? 'var(--success-bg)' : 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isSubscribed ? <Bell size={20} color="var(--success)" /> : <BellOff size={20} color="var(--text-muted)" />}
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Practice Reminders
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            {isSubscribed ? 'You will receive reminders to practice.' : 'Get notifications to stay on track.'}
          </p>
        </div>
      </div>
      
      <button 
        onClick={isSubscribed ? unsubscribeButtonOnClick : subscribeButtonOnClick}
        disabled={isLoading}
        className={`btn btn-sm ${isSubscribed ? 'btn-ghost' : 'btn-primary'}`}
        style={{ width: '100px', justifyContent: 'center' }}
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : isSubscribed ? 'Disable' : 'Enable'}
      </button>
    </div>
  )
}
