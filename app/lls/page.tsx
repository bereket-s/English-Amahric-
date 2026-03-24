'use client'

import Link from 'next/link'
import { Shield, Brain, Eye, ChevronRight, Activity } from 'lucide-react'

export default function LLSTrainingHub() {
  const cards = [
    {
      title: 'Protocol & Handbook',
      desc: 'Master the mandatory LLS intro script, first-person interpreting rules, and the 4 pillars.',
      icon: Shield,
      href: '/lls/handbook',
      color: '#8b5cf6',
      bg: '#f5f3ff'
    },
    {
      title: 'Memory & Chunking',
      desc: 'Listen to rapid bursts of names, dates, and account numbers, and type them exactly from memory.',
      icon: Brain,
      href: '/lls/memory',
      color: '#ec4899',
      bg: '#fdf2f8'
    },
    {
      title: 'Sight Translation',
      desc: 'Translate formal English medical and legal documents out loud into Amharic on the spot.',
      icon: Eye,
      href: '/lls/sight',
      color: '#10b981',
      bg: '#ecfdf5'
    },
    {
      title: 'Interpreter Simulator',
      desc: 'Full audio dialogues. Translating dual-speaker scenarios consecutively.',
      icon: Activity,
      href: '/interpreter', // points back to our previously built simulator
      color: '#0ea5e9',
      bg: '#e0f2fe'
    }
  ]

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }} className="animate-up">
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, marginBottom: 16 }}>
          LLS Training Suite
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Specialized drills and protocols designed to prepare you for remote interpretation agencies like Language Line Solutions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <Link key={c.href} href={c.href} className="animate-up" style={{ textDecoration: 'none', animationDelay: `${i * 50}ms` }}>
              <div className="card" style={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', padding: 28 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={24} color={c.color} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {c.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>
                  {c.desc}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.color, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Start Training <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
