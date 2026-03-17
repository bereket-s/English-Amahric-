import Link from 'next/link'
import { BookOpen, BarChart2, Clock, AlertTriangle, Upload, Shuffle, ArrowRight, Mic } from 'lucide-react'

const features = [
  {
    href: '/glossary',
    icon: BookOpen,
    title: 'Glossary',
    description: 'Search terms, hear pronunciations, and practice speaking with AI scoring.',
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    href: '/dashboard',
    icon: BarChart2,
    title: 'Dashboard',
    description: 'Track your progress, streaks, and average pronunciation scores at a glance.',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    href: '/history',
    icon: Clock,
    title: 'History',
    description: 'Review every attempt — see your spoken text, expected text, and score.',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    href: '/weak-words',
    icon: AlertTriangle,
    title: 'Weak Words',
    description: 'Automatically surfaces terms you struggle with so you can drill them.',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    href: '/study',
    icon: Upload,
    title: 'Study Upload',
    description: 'Upload PDFs, DOCX, CSV or text files to instantly add new terms.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    href: '/random-practice',
    icon: Shuffle,
    title: 'Random Practice',
    description: 'Surprise yourself — jump straight into a random term for quick drilling.',
    color: '#ec4899',
    bg: '#fdf2f8',
  },
]

export default function HomePage() {
  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>
      {/* Hero */}
      <section style={{ textAlign: 'center', marginBottom: '64px' }} className="animate-up">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🇬🇧 ↔ 🇪🇹</div>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: 800,
          lineHeight: 1.15,
          background: 'linear-gradient(135deg, #0f1023 30%, #4f46e5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '20px',
        }}>
          Master English &amp; Amharic
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          maxWidth: '520px',
          margin: '0 auto 36px',
          lineHeight: 1.7,
        }}>
          Upload your study documents, practice pronunciation with AI feedback, and track your progress — all in one place.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/glossary" className="btn btn-primary btn-lg">
            <BookOpen size={18} /> Start Practicing
          </Link>
          <Link href="/random-practice" className="btn btn-secondary btn-lg">
            <Shuffle size={18} /> Random Term <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* How it works strip */}
      <section style={{ marginBottom: '56px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '0', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { step: '1', label: 'Upload a document' },
            { step: '2', label: 'Browse & find a term' },
            { step: '3', label: 'Record your voice' },
            { step: '4', label: 'Get AI feedback' },
          ].map(({ step, label }, i, arr) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <div style={{ textAlign: 'center', padding: '0 16px' }}>
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
                  color: '#fff', fontWeight: 700, fontSize: '15px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 8px',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                }}>
                  {step}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ width: '32px', height: '2px', background: 'var(--border-strong)', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section>
        <h2 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
          All Features
        </h2>
        <div className="grid-auto">
          {features.map(({ href, icon: Icon, title, description, color, bg }, i) => (
            <Link
              key={href}
              href={href}
              style={{
                textDecoration: 'none',
                display: 'block',
                animationDelay: `${i * 60}ms`,
              }}
              className="animate-up"
            >
              <div className="card" style={{ height: '100%' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                  background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px',
                }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {description}
                </p>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', color, fontSize: '13px', fontWeight: 600 }}>
                  Open <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom mic CTA */}
      <section style={{
        marginTop: '64px',
        background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 32px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <Mic size={36} style={{ marginBottom: '16px', opacity: 0.9 }} />
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '10px' }}>
          Practice your pronunciation
        </h2>
        <p style={{ fontSize: '15px', opacity: 0.85, marginBottom: '24px', lineHeight: 1.6 }}>
          Record yourself saying English terms and sentences. Our AI transcribes your audio and scores how well you matched.
        </p>
        <Link href="/glossary" className="btn" style={{ background: '#fff', color: 'var(--brand-700)', fontWeight: 700, fontSize: '15px', padding: '11px 28px' }}>
          <Mic size={17} /> Open Glossary &amp; Practice
        </Link>
      </section>
    </main>
  )
}
