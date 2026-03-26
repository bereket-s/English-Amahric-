'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PhoneCall, BookOpen, Activity, CreditCard, HelpCircle, Phone, Headphones, MessageCircle, GraduationCap, BarChart2, AlertTriangle, Zap, ChevronRight, Star } from 'lucide-react'

type DashData = {
  totalAttempts: number
  streak: number
  avgScore: number
  termAttempts?: number
  weakTerms?: { english_term: string; topic?: string }[]
}

const LEVEL_THRESHOLDS = [
  { label: 'Beginner 🌱', xpNeeded: 0, next: 200, color: '#10b981' },
  { label: 'L2 Foundation 📘', xpNeeded: 200, next: 600, color: '#6366f1' },
  { label: 'L3 Professional 🎯', xpNeeded: 600, next: 1200, color: '#8b5cf6' },
  { label: 'L4 Expert 🏆', xpNeeded: 1200, next: 9999, color: '#f59e0b' },
]

const TRAINING_PATH = [
  { label: 'Glossary', sub: 'Learn terms by domain', href: '/glossary', icon: BookOpen, color: '#6366f1' },
  { label: 'Pronunciation', sub: 'Hear & repeat phrases', href: '/pronunciation', icon: MessageCircle, color: '#8b5cf6' },
  { label: 'Flashcards', sub: 'Speak & score yourself', href: '/flashcards', icon: CreditCard, color: '#3b82f6' },
  { label: 'Quiz', sub: 'Voice, MC, Type-in, T/F', href: '/quiz', icon: HelpCircle, color: '#10b981' },
  { label: 'Interpreter', sub: 'AI-scored consecutive mode', href: '/interpreter', icon: Activity, color: '#ec4899' },
  { label: 'Mock Call', sub: 'Timed realistic call sim', href: '/mock-call', icon: PhoneCall, color: '#ef4444' },
]

export default function HomePage() {
  const [dash, setDash] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showXpPop, setShowXpPop] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setDash(d); setLoading(false) })
      .catch(() => setLoading(false))
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const xp = dash ? (dash.termAttempts ?? 0) * 10 + (dash.totalAttempts ?? 0) * 5 : 0
  const level = LEVEL_THRESHOLDS.reduce((best, l) => xp >= l.xpNeeded ? l : best, LEVEL_THRESHOLDS[0])
  const xpIntoLevel = xp - level.xpNeeded
  const xpNeededForLevel = level.next - level.xpNeeded
  const levelPct = Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100))
  const dailyGoal = 10
  const dailyDone = Math.min(dailyGoal, (dash?.totalAttempts ?? 0) % dailyGoal)
  const dailyPct = (dailyDone / dailyGoal) * 100
  const streak = dash?.streak ?? 0
  const avgScore = dash?.avgScore ?? 0
  const weakDomain = dash?.weakTerms?.[0]?.topic ?? null

  const hour = time.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const CIRCUMFERENCE = 2 * Math.PI * 28
  const dashOffset = CIRCUMFERENCE - (dailyPct / 100) * CIRCUMFERENCE

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 100px' }}>

      {/* ── Advanced Gamification Widget ──────────────────────────── */}
      <div style={{
        background: 'linear-gradient(140deg, #1a1c3a 0%, #2d2f62 60%, #1a3050 100%)',
        borderRadius: 28, padding: '24px 22px 20px', marginBottom: 24,
        boxShadow: '0 16px 48px rgba(99,102,241,0.25), 0 4px 16px rgba(0,0,0,0.2)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(16,185,129,0.06)', pointerEvents: 'none' }} />

        {/* Greeting */}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 4 }}>{greeting} 👋</div>

        {/* Top row: Streak, XP, Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          {/* Streak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 26, animation: streak > 0 ? 'flame 2s ease-in-out infinite' : 'none' }}>🔥</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: streak > 0 ? '#fb923c' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>day streak</div>
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />

          {/* XP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={18} color="#facc15" />
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#facc15', lineHeight: 1 }}>{xp.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>total XP</div>
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />

          {/* Avg Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={16} color="#34d399" />
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{avgScore}%</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>avg score</div>
            </div>
          </div>

          {/* Daily ring — pushed right */}
          <div style={{ marginLeft: 'auto', position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none"
                stroke={dailyDone >= dailyGoal ? '#34d399' : '#6366f1'}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${CIRCUMFERENCE}`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 32 32)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{dailyDone}/{dailyGoal}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>today</div>
            </div>
          </div>
        </div>

        {/* Level badge + XP bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: level.color }}>{level.label}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {xpIntoLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP to next level
            </span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${levelPct}%`,
              background: `linear-gradient(90deg, ${level.color}, ${level.color}cc)`,
              borderRadius: 99, transition: 'width 1s ease',
            }} />
          </div>
        </div>

        {/* Focus suggestion */}
        {weakDomain && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#fca5a5', fontWeight: 600 }}>
            📍 Weak area: <strong style={{ color: '#fff' }}>{weakDomain}</strong> — study this first today
          </div>
        )}

        {/* Two CTA buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link href="/glossary" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: 16,
              padding: '14px 16px', textAlign: 'center', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>📚</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>Start Training</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Learn → Practice → Score</div>
            </div>
          </Link>
          <Link href="/live-assist" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: 16, padding: '14px 16px', textAlign: 'center', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>📞</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>Live Call</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Notes + word lookup</div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Training Path ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          🎯 Training Path
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-alt)', padding: '2px 10px', borderRadius: 99 }}>
            Beginner → Expert
          </span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TRAINING_PATH.map((step, i) => {
            const Icon = step.icon
            return (
              <Link key={step.href} href={step.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  borderRadius: 16, padding: '14px 16px',
                  transition: 'all 0.18s', cursor: 'pointer',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = step.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${step.color}14` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                    background: step.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color={step.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{step.sub}</div>
                  </div>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: step.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: step.color,
                  }}>
                    {i + 1}
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Live Call Tools ───────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          📞 Live Call Tools
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Live Assist', sub: 'Notes + instant word lookup', href: '/live-assist', icon: Phone, color: '#6366f1', emoji: '📝' },
            { label: 'Dev Hub', sub: 'Career roadmap & ethics', href: '/hub', icon: GraduationCap, color: '#8b5cf6', emoji: '🎓' },
            { label: 'Dashboard', sub: 'Progress & achievements', href: '/dashboard', icon: BarChart2, color: '#10b981', emoji: '📊' },
            { label: 'Weak Words', sub: 'Review your hard terms', href: '/weak-words', icon: AlertTriangle, color: '#f59e0b', emoji: '⚠️' },
          ].map(t => {
            const Icon = t.icon
            return (
              <Link key={t.href} href={t.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 18,
                  padding: '16px 14px', transition: 'all 0.18s', height: '100%',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{t.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.sub}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        @keyframes flame {
          0%,100% { transform: scale(1) rotate(-3deg); }
          50%      { transform: scale(1.1) rotate(3deg); }
        }
      `}} />
    </main>
  )
}
