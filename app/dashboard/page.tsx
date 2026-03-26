'use client'

import { useEffect, useState } from 'react'
import ScoreRing from '../../components/ui/ScoreRing'
import { BarChart2, Target, MessageSquare, Mic, Star, Flame, Trophy, RefreshCw, ChevronRight, AlertTriangle, Zap, Award } from 'lucide-react'
import PushSubscriptionToggle from '../../components/ui/PushSubscriptionToggle'
import Link from 'next/link'

type RecentTerm = {
  id: string; english_term: string; amharic_term: string
  score: number; status: string; practice_type: string; created_at?: string | null
}

type DashboardData = {
  summary: {
    totalAttempts: number; termAttempts: number; sentenceAttempts: number
    averageScore: number; exactMatches: number; streak: number
  }
  recentTerms: RecentTerm[]
  smartReviewTerms: Array<{ id: string; english_term: string; amharic_term: string; score: number }>
}

const ACHIEVEMENTS = [
  { id: 'first10',    label: 'First 10 Practices',    emoji: '🌱', threshold: (d: DashboardData) => d.summary.totalAttempts >= 10 },
  { id: 'streak5',    label: '5-Day Streak',           emoji: '🔥', threshold: (d: DashboardData) => d.summary.streak >= 5 },
  { id: 'score90',    label: 'Scored 90%+',            emoji: '🎯', threshold: (d: DashboardData) => d.summary.averageScore >= 90 },
  { id: 'exact10',    label: '10 Exact Matches',       emoji: '✅', threshold: (d: DashboardData) => d.summary.exactMatches >= 10 },
  { id: 'attempts50', label: '50 Total Practices',     emoji: '⭐', threshold: (d: DashboardData) => d.summary.totalAttempts >= 50 },
  { id: 'streak14',   label: '2-Week Streak 🏆',       emoji: '🏆', threshold: (d: DashboardData) => d.summary.streak >= 14 },
]

function StatCard({ icon: Icon, label, value, color, bg }: { icon: React.ElementType; label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: `3px solid ${color}` }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{label}</p>
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

// Mock weekly heatmap — days relative to today
function buildWeeklyActivity(recentTerms: RecentTerm[]) {
  const now = new Date()
  const days: { label: string; count: number; dateStr: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const count = recentTerms.filter(t => t.created_at && t.created_at.startsWith(dateStr)).length
    days.push({ label: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()], count, dateStr })
  }
  return days
}

function heatColor(count: number) {
  if (count === 0) return 'var(--surface-alt)'
  if (count <= 2)  return '#c7d2fe'
  if (count <= 5)  return '#818cf8'
  if (count <= 10) return '#4f46e5'
  return '#312e81'
}

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const loadDashboard = async () => {
    setLoading(true); setError('')
    try {
      const res    = await fetch('/api/dashboard')
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Failed to load.'); setData(null); return }
      setData(result)
      try {
        if ('setAppBadge' in navigator) {
          const v = result.summary.streak > 0 ? result.summary.streak : result.summary.totalAttempts
          if (v > 0) (navigator as any).setAppBadge(v).catch(console.error)
          else       (navigator as any).clearAppBadge().catch(console.error)
        }
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error'); setData(null)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadDashboard() }, [])

  const weekDays = data ? buildWeeklyActivity(data.recentTerms) : []
  const maxCount = Math.max(...weekDays.map(d => d.count), 1)

  const unlockedAchievements = data ? ACHIEVEMENTS.filter(a => a.threshold(data)) : []
  const lockedAchievements   = data ? ACHIEVEMENTS.filter(a => !a.threshold(data)) : []

  // Skill breakdown estimates
  const totalXP   = (data?.summary.totalAttempts ?? 0) * 10
  const pronScore = data?.summary.averageScore ?? 0
  const vocabScore = Math.min(100, (data?.summary.termAttempts ?? 0) > 0 ? 40 + Math.min(55, (data?.summary.termAttempts ?? 0) * 2) : 0)
  const interpScore = Math.min(100, (data?.summary.exactMatches ?? 0) > 0 ? 20 + (data?.summary.exactMatches ?? 0) * 4 : 0)

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart2 size={26} color="var(--brand-500)" /> Progress Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Your full interpreter training overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/" className="btn btn-ghost btn-sm">← Home</Link>
          <button onClick={loadDashboard} className="btn btn-secondary" disabled={loading}>
            <RefreshCw size={15} style={{ ...(loading ? { animation: 'spin-slow 1s linear infinite' } : {}) }} /> Refresh
          </button>
        </div>
      </div>

      <PushSubscriptionToggle />

      {loading && (
        <div>
          <div className="grid-stats" style={{ marginBottom: 24 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}
          </div>
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)', padding: 14, background: 'var(--danger-bg)', borderRadius: 12 }}>{error}</p>}

      {!loading && !error && data && (
        <>
          {/* ── Stat grid ── */}
          <div className="grid-stats" style={{ marginBottom: 28 }}>
            <StatCard icon={Target}       label="Total Attempts"    value={data.summary.totalAttempts}    color="#6366f1" bg="#eef2ff" />
            <StatCard icon={MessageSquare} label="Term Attempts"    value={data.summary.termAttempts}     color="#3b82f6" bg="#eff6ff" />
            <StatCard icon={Mic}          label="Sentence Attempts" value={data.summary.sentenceAttempts} color="#8b5cf6" bg="#f5f3ff" />
            <StatCard icon={Star}         label="Avg Score"         value={`${data.summary.averageScore}%`} color="#10b981" bg="#ecfdf5" />
            <StatCard icon={Trophy}       label="Exact Matches"     value={data.summary.exactMatches}     color="#f59e0b" bg="#fffbeb" />
            <StatCard icon={Flame}        label="Day Streak 🔥"     value={data.summary.streak}           color="#ef4444" bg="#fef2f2" />
          </div>

          {/* ── Weekly heatmap ── */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              📅 This Week's Activity
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {weekDays.map(day => (
                <div key={day.dateStr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%', aspectRatio: '1',
                    maxWidth: 52,
                    background: heatColor(day.count),
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700,
                    color: day.count > 2 ? '#fff' : 'var(--text-secondary)',
                    border: '1.5px solid var(--border)',
                    transition: 'background 0.3s',
                  }}>
                    {day.count > 0 ? day.count : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{day.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              Less {['var(--surface-alt)', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81'].map(c => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: '1px solid var(--border)' }} />
              ))} More
            </div>
          </div>

          {/* ── Skill breakdown ── */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🎯 Skill Breakdown</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-600)' }}>
                <Zap size={13} style={{ verticalAlign: 'middle' }} /> {totalXP.toLocaleString()} XP
              </span>
            </h2>
            {[
              { label: '🎤 Pronunciation', value: pronScore, color: '#6366f1', desc: 'Based on average score' },
              { label: '📚 Vocabulary', value: vocabScore, color: '#10b981', desc: 'Based on term attempts' },
              { label: '🌐 Interpretation', value: interpScore, color: '#ec4899', desc: 'Based on exact matches' },
            ].map(({ label, value, color, desc }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span style={{ fontWeight: 700, color }}>{value}%</span>
                </div>
                <div title={desc} style={{ height: 8, background: 'var(--surface-alt)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 99, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Achievements ── */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={20} color="#f59e0b" /> Achievements
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {ACHIEVEMENTS.map(a => {
                const unlocked = data && a.threshold(data)
                return (
                  <div key={a.id} style={{
                    padding: '14px 16px',
                    background: unlocked ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : 'var(--surface-alt)',
                    border: `1.5px solid ${unlocked ? '#fde68a' : 'var(--border)'}`,
                    borderRadius: 14,
                    display: 'flex', alignItems: 'center', gap: 10,
                    opacity: unlocked ? 1 : 0.55,
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{unlocked ? a.emoji : '🔒'}</div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: unlocked ? '#92400e' : 'var(--text-muted)' }}>{a.label}</div>
                      {unlocked && <div style={{ fontSize: 10, color: '#d97706', fontWeight: 600, marginTop: 2 }}>✅ Unlocked!</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Smart Review ── */}
          {data.smartReviewTerms?.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={20} color="var(--warning)" />
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Smart Review Due Today</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {data.smartReviewTerms.map(term => (
                  <div key={term.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderLeft: '4px solid var(--warning)' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{term.english_term}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{term.amharic_term}</p>
                      <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, fontWeight: 600 }}>Last: {term.score}%</p>
                    </div>
                    <a href={`/glossary?term=${encodeURIComponent(term.english_term)}`} className="btn btn-primary btn-sm">Review</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recent practice ── */}
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Recent Practice</h2>
          {data.recentTerms.length === 0
            ? <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No attempts yet — go to Glossary and start practicing!</div>
            : (
              <div style={{ display: 'grid', gap: 10 }}>
                {data.recentTerms.map(item => (
                  <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 18px' }}>
                    <ScoreRing score={item.score} size={60} strokeWidth={5} />
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{item.english_term}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{item.amharic_term}</p>
                      <span className={statusBadgeClass(item.status)}>{item.status}</span>
                      <span className="badge badge-muted" style={{ marginLeft: 6 }}>{item.practice_type}</span>
                    </div>
                    {item.created_at && (
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'right' }}>
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
