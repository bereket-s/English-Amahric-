'use client'

import { useEffect, useState } from 'react'
import ScoreRing from '../../components/ui/ScoreRing'
import { Clock, RefreshCw, ChevronRight, Mic2 } from 'lucide-react'

type AttemptItem = {
  id: string
  study_entry_id?: string | null
  spoken_text?: string | null
  correctness_score?: number | null
  feedback_json?: {
    expected_term?: string
    status?: string
    practice_type?: string
    ai_feedback?: string
  } | null
  created_at?: string | null
  study_entries?: {
    english_term?: string | null
    amharic_term?: string | null
    level?: string | null
    topic?: string | null
  } | null
}

function statusBadgeClass(status: string) {
  if (status === 'Exact match' || status === 'Very close') return 'badge badge-success'
  if (status === 'Close match') return 'badge badge-info'
  if (status === 'Partial match') return 'badge badge-warning'
  return 'badge badge-danger'
}

function formatDate(str: string) {
  const d = new Date(str)
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTime(str: string) {
  const d = new Date(str)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function groupByDate(attempts: AttemptItem[]): Record<string, AttemptItem[]> {
  return attempts.reduce((acc, a) => {
    const key = a.created_at ? formatDate(a.created_at) : 'Unknown date'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {} as Record<string, AttemptItem[]>)
}

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<AttemptItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const loadHistory = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/attempts/history')
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Failed to load history.'); setAttempts([]); return }
      setAttempts(result.attempts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error'); setAttempts([])
    } finally { setLoading(false) }
  }

  useEffect(() => { loadHistory() }, [])

  const groups = groupByDate(attempts)

  return (
    <main style={{ maxWidth: '880px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={26} color="var(--brand-500)" /> Practice History
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>All your pronunciation attempts in chronological order</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={loadHistory} className="btn btn-secondary" disabled={loading}>
            <RefreshCw size={15} style={{ ...(loading ? { animation: 'spin-slow 1s linear infinite' } : {}) }} /> Refresh
          </button>
          <a href="/weak-words" className="btn btn-ghost">Weak Words <ChevronRight size={14} /></a>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '90px' }} />)}
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)', padding: '14px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)' }}>{error}</p>}

      {!loading && !error && attempts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <Mic2 size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No attempts yet. Head to the Glossary and start practicing!</p>
          <a href="/glossary" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>Go to Glossary</a>
        </div>
      )}

      {!loading && !error && attempts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              {/* Date group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{date}</span>
                <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
              </div>

              {/* Attempts for this date */}
              <div style={{ display: 'grid', gap: '10px' }}>
                {items.map(attempt => {
                  const score    = attempt.correctness_score ?? 0
                  const status   = attempt.feedback_json?.status || ''
                  const type     = attempt.feedback_json?.practice_type || 'term'
                  const aiFb     = attempt.feedback_json?.ai_feedback || ''
                  const term     = attempt.study_entries?.english_term || attempt.feedback_json?.expected_term || '—'
                  const amharic  = attempt.study_entries?.amharic_term || ''
                  const level    = attempt.study_entries?.level
                  const topic    = attempt.study_entries?.topic
                  const time     = attempt.created_at ? formatTime(attempt.created_at) : ''

                  return (
                    <div key={attempt.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', padding: '14px 18px' }}>
                      <ScoreRing score={score} size={60} strokeWidth={6} />
                      <div style={{ flex: 1, minWidth: '140px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <p style={{ fontWeight: 700, fontSize: '15px' }}>{term}</p>
                          {level && <span className="badge badge-brand">{level}</span>}
                          {topic && <span className="badge badge-muted">{topic}</span>}
                        </div>
                        {amharic && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{amharic}</p>}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {status && <span className={statusBadgeClass(status)}>{status}</span>}
                          <span className={type === 'interpretation' ? 'badge badge-brand' : 'badge badge-muted'}>{type}</span>
                        </div>
                        {attempt.spoken_text && (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                            <span style={{ fontWeight: 600 }}>{type === 'interpretation' ? 'Interpreted:' : 'Said:'}</span> "{attempt.spoken_text}"
                          </p>
                        )}
                        {aiFb && (
                          <div style={{ marginTop: '8px', padding: '10px', background: 'var(--brand-50)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--brand-900)', lineHeight: 1.5, borderLeft: '3px solid var(--brand-400)' }}>
                            <span style={{ fontWeight: 700, fontSize: '10px', color: 'var(--brand-600)', display: 'block', marginBottom: '2px' }}>AI FEEDBACK:</span>
                            {aiFb}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        {time && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{time}</span>}
                        {attempt.study_entries?.english_term && (
                          <a href={`/glossary?term=${encodeURIComponent(attempt.study_entries.english_term)}`} className="btn btn-ghost btn-sm">
                            Practice Again
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
