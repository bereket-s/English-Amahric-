'use client'

import { useEffect, useState } from 'react'
import ScoreRing from '../../components/ui/ScoreRing'
import { BarChart2, Target, MessageSquare, Mic, Star, Flame, Trophy, RefreshCw, ChevronRight, AlertTriangle } from 'lucide-react'

type RecentTerm = {
  id: string
  english_term: string
  amharic_term: string
  score: number
  status: string
  practice_type: string
  created_at?: string | null
}

type DashboardData = {
  summary: {
    totalAttempts: number
    termAttempts: number
    sentenceAttempts: number
    averageScore: number
    exactMatches: number
    streak: number
  }
  recentTerms: RecentTerm[]
  smartReviewTerms: Array<{
    id: string
    english_term: string
    amharic_term: string
    score: number
  }>
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: React.ElementType, label: string, value: string | number, color: string, bg: string }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: `3px solid ${color}` }}>
      <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  )
}

function statusBadgeClass(status: string) {
  if (status === 'Exact match' || status === 'Very close') return 'badge badge-success'
  if (status === 'Close match') return 'badge badge-info'
  if (status === 'Partial match') return 'badge badge-warning'
  return 'badge badge-danger'
}

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const loadDashboard = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/dashboard')
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Failed to load dashboard.'); setData(null); return }
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error'); setData(null)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadDashboard() }, [])

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 size={26} color="var(--brand-500)" /> Progress Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Your pronunciation training overview</p>
        </div>
        <button onClick={loadDashboard} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={15} style={{ ...(loading ? { animation: 'spin-slow 1s linear infinite' } : {}) }} />
          Refresh
        </button>
      </div>

      {loading && (
        <div>
          <div className="grid-stats" style={{ marginBottom: '24px' }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '110px' }} />)}
          </div>
          <div className="skeleton" style={{ height: '300px' }} />
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)', padding: '14px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)' }}>{error}</p>}

      {!loading && !error && data && (
        <>
          {/* Stat grid */}
          <div className="grid-stats" style={{ marginBottom: '32px' }}>
            <StatCard icon={Target}       label="Total Attempts"    value={data.summary.totalAttempts}    color="#6366f1" bg="#eef2ff" />
            <StatCard icon={MessageSquare} label="Term Attempts"    value={data.summary.termAttempts}     color="#3b82f6" bg="#eff6ff" />
            <StatCard icon={Mic}          label="Sentence Attempts" value={data.summary.sentenceAttempts} color="#8b5cf6" bg="#f5f3ff" />
            <StatCard icon={Star}         label="Avg Score"         value={`${data.summary.averageScore}%`} color="#10b981" bg="#ecfdf5" />
            <StatCard icon={Trophy}       label="Exact Matches"     value={data.summary.exactMatches}     color="#f59e0b" bg="#fffbeb" />
            <StatCard icon={Flame}        label="Day Streak 🔥"     value={data.summary.streak}           color="#ef4444" bg="#fef2f2" />
          </div>

          {/* Average score progress bar */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Overall Pronunciation Score</span>
              <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--brand-600)' }}>{data.summary.averageScore}%</span>
            </div>
            <div style={{ height: '10px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${data.summary.averageScore}%`,
                background: 'linear-gradient(90deg, var(--brand-500), var(--brand-700))',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>

          {/* Smart Review */}
          {data.smartReviewTerms && data.smartReviewTerms.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <AlertTriangle size={20} color="var(--warning)" />
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Smart Review Due Today</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {data.smartReviewTerms.map(term => (
                  <div key={term.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderLeft: '4px solid var(--warning)' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{term.english_term}</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{term.amharic_term}</p>
                      <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', fontWeight: 600 }}>Last score: {term.score}%</p>
                    </div>
                    <a href={`/glossary?term=${encodeURIComponent(term.english_term)}`} className="btn btn-primary btn-sm">
                      Review
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent practice */}
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>Recent Practice</h2>
          {data.recentTerms.length === 0
            ? <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No attempts yet. Go to Glossary and start practicing!</div>
            : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {data.recentTerms.map(item => (
                  <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '14px 18px' }}>
                    <ScoreRing score={item.score} size={64} strokeWidth={6} />
                    <div style={{ flex: 1, minWidth: '140px' }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>{item.english_term}</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{item.amharic_term}</p>
                      <span className={statusBadgeClass(item.status)}>{item.status}</span>
                      <span className="badge badge-muted" style={{ marginLeft: '6px' }}>{item.practice_type}</span>
                    </div>
                    {item.created_at && (
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'right' }}>
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    <a href={`/glossary?term=${encodeURIComponent(item.english_term)}`} className="btn btn-ghost btn-sm">
                      Practice <ChevronRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
        </>
      )}
    </main>
  )
}
