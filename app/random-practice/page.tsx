'use client'

import { useEffect, useState } from 'react'
import { Shuffle } from 'lucide-react'

export default function RandomPracticePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const loadRandomTerm = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/random-term')
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Failed to load random term.'); setLoading(false); return }
      const term = result.term?.english_term || ''
      if (!term) { setError('No terms found in the glossary yet.'); setLoading(false); return }
      window.location.href = `/glossary?term=${encodeURIComponent(term)}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  useEffect(() => { loadRandomTerm() }, [])

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        {loading ? (
          <>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              animation: 'spin-slow 1.5s linear infinite',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            }}>
              <Shuffle size={36} color="#fff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>🎲 Picking a random term…</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
              You'll be taken to the Glossary in a moment to start practicing.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px' }}>{error}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Try uploading a document first in Study Upload to add terms.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={loadRandomTerm} className="btn btn-primary">
                <Shuffle size={16} /> Try Again
              </button>
              <a href="/study" className="btn btn-secondary">Go to Study Upload</a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
