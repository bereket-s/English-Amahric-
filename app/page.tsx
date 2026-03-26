'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  BookOpen, BarChart2, Clock, AlertTriangle, Upload, Shuffle, ArrowRight,
  Mic, CreditCard, HelpCircle, Puzzle, NotebookPen, Headphones, Activity,
  Shield, Phone, GraduationCap, Zap, Flame,
} from 'lucide-react'

const features = [
  { href: '/live-assist', icon: Phone,          title: 'Live Assistant',     description: 'Real-time call helper: instant glossary lookup + timed note-taking. Replaces paper & pen.',    color: '#059669', bg: '#ecfdf5' },
  { href: '/hub',          icon: GraduationCap,  title: 'Development Hub',    description: 'Career roadmap L2→L4, daily challenge, interpreter ethics, and skill radar.',                    color: '#d97706', bg: '#fffbeb' },
  { href: '/lls',          icon: Shield,         title: 'LLS Training',       description: 'Specialized interpreter prep: protocols, short-term memory chunking, and sight translations.',   color: '#8b5cf6', bg: '#f5f3ff' },
  { href: '/glossary',     icon: BookOpen,       title: 'Glossary',           description: 'Search 500+ terms, hear pronunciations, and practice speaking with AI scoring.',                  color: '#6366f1', bg: '#eef2ff' },
  { href: '/interpreter',  icon: Activity,       title: 'Interpreter Sim',    description: 'Consecutive & shadowing drills — AI records & scores your Amharic interpretation per turn.',     color: '#ec4899', bg: '#fdf2f8' },
  { href: '/flashcards',   icon: CreditCard,     title: 'Flashcards',         description: 'Swipe-to-learn with streak combos. Earn XP for every card you know.',                            color: '#8b5cf6', bg: '#f5f3ff' },
  { href: '/quiz',         icon: HelpCircle,     title: 'Quiz',               description: 'Multiple choice, type-in, and true/false modes with XP scoring.',                                color: '#ec4899', bg: '#fdf2f8' },
  { href: '/match',        icon: Puzzle,         title: 'Match Game',         description: 'Tap-to-match English and Amharic words against the clock.',                                       color: '#f59e0b', bg: '#fffbeb' },
  { href: '/notes',        icon: NotebookPen,    title: 'Notes',              description: 'Keyboard note-taking with abbreviation expander, tags, and auto-summary.',                        color: '#10b981', bg: '#ecfdf5' },
  { href: '/listening-drill', icon: Headphones,  title: 'Listening Drill',    description: 'Listen to phrases and type what you heard — speed control & shadowing mode.',                    color: '#3b82f6', bg: '#eff6ff' },
  { href: '/dashboard',    icon: BarChart2,      title: 'Dashboard',          description: 'Track streaks, XP, heatmap, skill breakdown, and achievement badges.',                           color: '#10b981', bg: '#ecfdf5' },
  { href: '/weak-words',   icon: AlertTriangle,  title: 'Weak Words',         description: 'Automatically surfaces terms you struggle with so you can drill them.',                           color: '#ef4444', bg: '#fef2f2' },
  { href: '/study',        icon: Upload,         title: 'Study Upload',       description: 'Upload PDFs, DOCX, CSV or text files to instantly add new terms.',                               color: '#8b5cf6', bg: '#f5f3ff' },
  { href: '/history',      icon: Clock,          title: 'History',            description: 'Review every attempt — see your spoken text, expected text, and score.',                         color: '#3b82f6', bg: '#eff6ff' },
  { href: '/random-practice', icon: Shuffle,     title: 'Random Practice',    description: 'Surprise yourself — jump straight into a random term for quick drilling.',                       color: '#ec4899', bg: '#fdf2f8' },
]

function getLevelInfo(attempts: number) {
  if (attempts >= 200) return { label: 'Expert L4', emoji: '🏆', color: '#ec4899', next: 999, xpToNext: 0 }
  if (attempts >= 100) return { label: 'Professional L3', emoji: '⭐', color: '#8b5cf6', next: 200, xpToNext: 200 - attempts }
  if (attempts >= 40)  return { label: 'Foundation L2', emoji: '🎓', color: '#3b82f6', next: 100, xpToNext: 100 - attempts }
  return { label: 'Beginner', emoji: '🌱', color: '#10b981', next: 40, xpToNext: 40 - attempts }
}

function getLevelPct(attempts: number) {
  if (attempts >= 200) return 100
  if (attempts >= 100) return ((attempts - 100) / 100) * 100
  if (attempts >= 40)  return ((attempts - 40) / 60) * 100
  return (attempts / 40) * 100
}

export default function HomePage() {
  const [dash, setDash] = useState<any>(null)
  const [animIn, setAnimIn] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setDash(d)
      setTimeout(() => setAnimIn(true), 100)
    }).catch(() => setAnimIn(true))
  }, [])

  const streak    = dash?.summary?.streak        ?? 0
  const totalXP   = (dash?.summary?.totalAttempts ?? 0) * 10
  const avgScore  = dash?.summary?.averageScore   ?? 0
  const attempts  = dash?.summary?.totalAttempts  ?? 0
  const levelInfo = getLevelInfo(attempts)
  const levelPct  = getLevelPct(attempts)
  const dailyGoal = 5
  const todayAttempts = Math.min(dailyGoal, dash?.summary?.termAttempts ?? 0)

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* ── DUOLINGO-STYLE GAMIFICATION HERO ── */}
      <section style={{ marginBottom: 48 }} className={animIn ? 'animate-up' : ''}>
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)',
          borderRadius: 28,
          padding: '32px 28px',
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(99,102,241,0.4)',
        }}>
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -60, right: -40, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: -40, left: 40, pointerEvents: 'none' }} />

          {/* Title */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                  🇬🇧 ↔ 🇪🇹 Interpreter Trainer
                </div>
                <h1 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 8 }}>
                  Keep Your Streak Going!
                </h1>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, maxWidth: 460 }}>
                  Practice interpretation, build your glossary, and track your journey to Expert Level L4.
                </p>
              </div>

              {/* Level badge */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                borderRadius: 20,
                padding: '14px 18px',
                textAlign: 'center',
                minWidth: 110,
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 32, marginBottom: 4 }}>{levelInfo.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{levelInfo.label}</div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              {/* Streak */}
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 28 }}>🔥</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{streak}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Day Streak</div>
                </div>
              </div>

              {/* XP total */}
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 28 }}>⚡</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{totalXP.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Total XP</div>
                </div>
              </div>

              {/* Avg score */}
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 28 }}>🎯</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{avgScore}%</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Avg Score</div>
                </div>
              </div>

              {/* Daily goal ring */}
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 120 }}>
                <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                  <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#fff" strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - todayAttempts / dailyGoal)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                    {todayAttempts}/{dailyGoal}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>Daily Goal</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    {todayAttempts >= dailyGoal ? '✅ Done!' : `${dailyGoal - todayAttempts} left`}
                  </div>
                </div>
              </div>
            </div>

            {/* Level XP bar */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontWeight: 600 }}>
                <span>{levelInfo.label}</span>
                {levelInfo.xpToNext > 0 && <span>{levelInfo.xpToNext} attempts to next level</span>}
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${levelPct}%`,
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: 99,
                  transition: 'width 1s ease',
                  boxShadow: '0 0 8px rgba(255,255,255,0.5)',
                }} />
              </div>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <Link href="/glossary" style={{ padding: '12px 24px', background: '#fff', color: '#4f46e5', borderRadius: 99, fontWeight: 800, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                <Mic size={17} /> Practice Now
              </Link>
              <Link href="/live-assist" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 99, fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid rgba(255,255,255,0.4)' }}>
                <Phone size={17} /> Live Call Tool
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ marginBottom: 48, padding: '28px 24px', background: 'var(--surface-alt)', borderRadius: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>How it works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '24px 16px', textAlign: 'center' }}>
          {[
            { step: '1', label: 'Upload a document', icon: '📄' },
            { step: '2', label: 'Browse & find a term', icon: '🔍' },
            { step: '3', label: 'Record your voice', icon: '🎤' },
            { step: '4', label: 'Get AI feedback', icon: '✨' },
            { step: '5', label: 'Track your progress', icon: '📊' },
          ].map(({ step, label, icon }) => (
            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))', color: '#fff', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, boxShadow: '0 6px 16px rgba(99,102,241,0.35)' }}>
                {step}
              </div>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.3 }}>{label}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE CARDS ── */}
      <section>
        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>All Features</h2>
        <div className="grid-auto">
          {features.map(({ href, icon: Icon, title, description, color, bg }, i) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', display: 'block', animationDelay: `${i * 40}ms` }} className="animate-up">
              <div className="card" style={{ height: '100%' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 4, color, fontSize: 12.5, fontWeight: 600 }}>
                  Open <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
