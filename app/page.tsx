import Link from 'next/link'
import {
  BookOpen,
  BarChart2,
  Clock,
  AlertTriangle,
  Upload,
  Shuffle,
  ArrowRight,
  Mic,
  CreditCard,
  HelpCircle,
  Puzzle,
  NotebookPen,
  Headphones,
  Activity,
  Shield,
} from 'lucide-react'

const features = [
  {
    href: '/lls',
    icon: Shield,
    title: 'LLS Training Suite',
    description: 'Specialized interpreter prep: protocols, short-term memory chunking, and sight translations.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    href: '/glossary',
    icon: BookOpen,
    title: 'Glossary',
    description: 'Search terms, hear pronunciations, and practice speaking with AI scoring.',
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    href: '/flashcards',
    icon: CreditCard,
    title: 'Flashcards',
    description: 'Flip cards to practice English ↔ Amharic. Earn XP and track combo streaks.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    href: '/quiz',
    icon: HelpCircle,
    title: 'Quiz',
    description: 'Multiple choice, type-in, and true/false modes with XP scoring.',
    color: '#ec4899',
    bg: '#fdf2f8',
  },
  {
    href: '/match',
    icon: Puzzle,
    title: 'Match Game',
    description: 'Tap-to-match English and Amharic words against the clock.',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    href: '/notes',
    icon: NotebookPen,
    title: 'Notes',
    description: 'Keyboard note-taking with abbreviation expander, tags, and auto-summary.',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    href: '/listening-drill',
    icon: Headphones,
    title: 'Listening Drill',
    description: 'Listen to phrases and type what you heard. Speed control + shadowing mode.',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    href: '/scenarios',
    icon: BookOpen,
    title: 'Scenarios',
    description: 'Practice real dialogue interpretation scenarios with AI feedback.',
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    href: '/dashboard',
    icon: BarChart2,
    title: 'Dashboard',
    description: 'Track your progress, streaks, and average pronunciation scores.',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    href: '/weak-words',
    icon: AlertTriangle,
    title: 'Weak Words',
    description: 'Automatically surfaces terms you struggle with so you can drill them.',
    color: '#ef4444',
    bg: '#fef2f2',
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
  {
    href: '/history',
    icon: Clock,
    title: 'History',
    description: 'Review every attempt — see your spoken text, expected text, and score.',
    color: '#3b82f6',
    bg: '#eff6ff',
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
      <section style={{ marginBottom: '64px', padding: '32px 24px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '32px 16px', 
          textAlign: 'center' 
        }}>
          {[
            { step: '1', label: 'Upload a document', icon: '📄' },
            { step: '2', label: 'Browse & find a term', icon: '🔍' },
            { step: '3', label: 'Record your voice', icon: '🎤' },
            { step: '4', label: 'Get AI feedback', icon: '✨' },
          ].map(({ step, label, icon }) => (
            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '48px', height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
                color: '#fff', fontWeight: 800, fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 8px 16px -4px rgba(99,102,241,0.4)',
              }}>
                {step}
              </div>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{icon}</div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3 }}>{label}</strong>
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
