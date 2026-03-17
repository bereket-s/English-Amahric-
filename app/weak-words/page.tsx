'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, ChevronRight, Mic2 } from 'lucide-react'

type WeakWordItem = {
  study_entry_id: string
  attempts: number
  averageScore: number
  english_term: string
  amharic_term: string
  level?: string | null
  topic?: string | null
}

function urgencyColor(score: number): { bg: string; border: string; bar: string } {
  if (score < 30) return { bg: '#fef2f2', border: '#fecaca', bar: '#ef4444' }
  if (score < 55) return { bg: '#fff7ed', border: '#fed7aa', bar: '#f97316' }
  if (score < 75) return { bg: '#fffbeb', border: '#fde68a', bar: '#f59e0b' }
  return { bg: '#f0fdf4', border: '#bbf7d0', bar: '#10b981' }
}

export default function WeakWordsPage() {
  const [items, setItems]     = useState<WeakWordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const loadWeakWords = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/weak-words')
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Failed to load weak words.'); setItems([]); return }
      setItems(result.weakWords || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error'); setItems([])
    } finally { setLoading(false) }
  }

  useEffect(() => { loadWeakWords() }, [])

  return (
    <main style={{ maxWidth: '880px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={26} color="var(--warning)" /> Weak Words
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Terms with the lowest average scores — drill these to improve
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={loadWeakWords} className="btn btn-secondary" disabled={loading}>
            <RefreshCw size={15} style={{ ...(loading ? { animation: 'spin-slow 1s linear infinite' } : {}) }} /> Refresh
          </button>
          <a href="/history" className="btn btn-ghost">History <ChevronRight size={14} /></a>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '110px' }} />)}
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)', padding: '14px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)' }}>{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No weak words found!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            Keep practicing and any low-scoring terms will appear here.
          </p>
          <a href="/glossary" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            <Mic2 size={16} /> Go Practice
          </a>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {items.map((item, idx) => {
            const colors = urgencyColor(item.averageScore)
            return (
              <div key={item.study_entry_id} className="card" style={{ background: colors.bg, borderColor: colors.border, transition: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Rank */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: colors.bar, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '13px',
                  }}>
                    {idx + 1}
                  </div>

                  {/* Term info */}
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{item.english_term}</h2>
                      {item.level && <span className="badge badge-brand">{item.level}</span>}
                      {item.topic && <span className="badge badge-muted">{item.topic}</span>}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{item.amharic_term}</p>

                    {/* Score bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.averageScore}%`, background: colors.bar, borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: colors.bar, minWidth: '38px' }}>{item.averageScore}%</span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{item.attempts} attempt{item.attempts !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Action */}
                  <a href={`/glossary?term=${encodeURIComponent(item.english_term)}`} className="btn btn-primary btn-sm">
                    Drill Now <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
