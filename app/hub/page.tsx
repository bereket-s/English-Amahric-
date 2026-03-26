'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, Star, BookOpen, ChevronDown, ChevronUp, Zap, Shield, Target, Trophy, Flame, BarChart2, ExternalLink } from 'lucide-react'

const CURRICULUM = [
  {
    level: 'L2',
    title: 'Foundation Interpreter',
    color: '#3b82f6',
    bg: '#eff6ff',
    skills: [
      'Sequential interpretation of 30–50 word segments',
      'Basic medical terminology (appointments, vitals, medications)',
      'Social services vocabulary (benefits, housing, food assistance)',
      'Note-taking system foundations (symbols & abbreviations)',
      'Professional code of ethics: confidentiality & impartiality',
    ],
    badge: '🎓',
  },
  {
    level: 'L3',
    title: 'Professional Interpreter',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    skills: [
      'Sequential interpretation of 80–120 word passages',
      'Advanced medical (hospital procedures, diagnoses, specialist referrals)',
      'Legal & court (immigration hearings, custody, criminal proceedings)',
      'Banking & financial terms (loans, fraud disputes, wire transfers)',
      'Memory chunking: numbers, names, dates without notes',
      'Sight translation of standard forms and letters',
    ],
    badge: '⭐',
  },
  {
    level: 'L4',
    title: 'Expert Interpreter',
    color: '#ec4899',
    bg: '#fdf2f8',
    skills: [
      'Simultaneous interpretation at natural speech rate',
      'Complex legal proceedings (jury instructions, appeals)',
      'Mental health & trauma-sensitive language',
      'Academic and educational assessments (IEP, 504 plans)',
      'Sight translation of official government documents',
      'Training and mentoring Level 2 & 3 interpreters',
    ],
    badge: '🏆',
  },
]

const ETHICS = [
  {
    title: 'Accuracy',
    icon: '🎯',
    content: 'Interpret everything said accurately, completely, and without adding, omitting, or altering the meaning. Do not summarize or paraphrase unless explicitly authorized.',
  },
  {
    title: 'Confidentiality',
    icon: '🔒',
    content: 'Keep all information disclosed during interpreting sessions strictly confidential. This obligation continues after the session ends.',
  },
  {
    title: 'Impartiality',
    icon: '⚖️',
    content: 'Remain neutral and avoid personal involvement. Do not allow personal biases, values, or relationships to influence your interpretation.',
  },
  {
    title: 'Cultural Mediation',
    icon: '🌍',
    content: 'Alert parties to potential cross-cultural misunderstandings that may impede communication. Clarify cultural references when clinically necessary.',
  },
  {
    title: 'Role Boundaries',
    icon: '🚧',
    content: 'Stay within your role as interpreter. Do not give advice, counsel, or personal opinions. Refer to the appropriate professional for non-language needs.',
  },
  {
    title: 'Professional Development',
    icon: '📈',
    content: 'Pursue continuous learning. Attend trainings, expand terminology knowledge, and seek feedback to improve your skills and service quality.',
  },
]

const DAILY_CHALLENGES = [
  { emoji: '🏥', domain: 'Medical', phrase: 'The patient has a history of hypertension and was prescribed a beta-blocker.' },
  { emoji: '⚖️', domain: 'Legal', phrase: 'The defendant has the right to remain silent and to have an attorney present during questioning.' },
  { emoji: '🏦', domain: 'Banking', phrase: 'We have identified an unauthorized transaction of $248 on your account and will open a dispute.' },
  { emoji: '🏠', domain: 'Social Services', phrase: 'Your application for rental assistance has been approved and the funds will be disbursed within 5 business days.' },
  { emoji: '🎓', domain: 'Education', phrase: 'The IEP team recommends additional speech-language therapy twice per week starting next semester.' },
  { emoji: '🌐', domain: 'Immigration', phrase: 'Your visa petition was denied due to insufficient evidence of your financial ability to support your family.' },
]

const RESOURCES = [
  { title: 'NCIHC Code of Ethics', url: 'https://www.ncihc.org/ethics-and-standards-of-practice', desc: 'National Council on Interpreting in Health Care standards' },
  { title: 'IMIA Standards of Practice', url: 'https://www.imiaweb.org/standards/', desc: 'International Medical Interpreters Association guidelines' },
  { title: 'UNHCR Amharic Glossary', url: 'https://www.unhcr.org/', desc: 'Refugee & asylum terminology in Amharic' },
  { title: 'Medical Terminology (MedlinePlus)', url: 'https://medlineplus.gov/', desc: 'US government health dictionary & terminology' },
]

export default function HubPage() {
  const [openEthics, setOpenEthics] = useState<number | null>(null)
  const [todaysChallenge, setTodaysChallenge] = useState(DAILY_CHALLENGES[0])
  const [practiceStep, setPracticeStep] = useState<'listen' | 'record' | 'done'>('listen')
  const [currentLevel, setCurrentLevel] = useState('L2')
  const [dashData, setDashData] = useState<any>(null)

  useEffect(() => {
    // Pick today's challenge based on day of month
    const dayIdx = new Date().getDate() % DAILY_CHALLENGES.length
    setTodaysChallenge(DAILY_CHALLENGES[dayIdx])
    // Fetch user dashboard for skill data
    fetch('/api/dashboard').then(r => r.json()).then(d => setDashData(d)).catch(() => {})
  }, [])

  const speak = (text: string) => {
    if (!window.speechSynthesis) return
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-US'
    utt.rate = 0.85
    window.speechSynthesis.speak(utt)
    setPracticeStep('record')
  }

  const totalAttempts = dashData?.summary?.totalAttempts || 0
  const avgScore = dashData?.summary?.averageScore || 0
  const streak = dashData?.summary?.streak || 0

  // Compute skill estimates from dashboard
  const pronounciation = Math.min(100, avgScore)
  const vocabulary = Math.min(100, totalAttempts > 0 ? 40 + Math.min(50, totalAttempts * 2) : 0)
  const interpretation = Math.min(100, dashData?.summary?.exactMatches > 0 ? 30 + dashData.summary.exactMatches * 5 : 0)

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <GraduationCap size={28} color="var(--brand-500)" /> Linguist Development Hub
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Your interpreter career roadmap · ethics · daily challenge · resources
        </p>
      </div>

      {/* Skill Radar */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #0f1023, #1e1f3e)', border: 'none', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={18} color="#818cf8" /> Your Skills
          </h2>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>🔥 {streak}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Day Streak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#818cf8' }}>{totalAttempts}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Attempts</div>
            </div>
          </div>
        </div>
        {[
          { label: '🎤 Pronunciation', value: pronounciation, color: '#6366f1' },
          { label: '📚 Vocabulary', value: vocabulary, color: '#10b981' },
          { label: '🌐 Interpretation', value: interpretation, color: '#ec4899' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</span>
              <span style={{ color }}>{value}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${value}%`,
                background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                borderRadius: 99,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textDecoration: 'none' }}>
            Full dashboard →
          </Link>
        </div>
      </div>

      {/* Curriculum Roadmap */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={20} color="var(--brand-500)" /> Career Roadmap
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {CURRICULUM.map((level, i) => (
            <div key={level.level} style={{ display: 'flex', gap: 0 }}>
              {/* Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
                <div style={{
                  width: 36, height: 36,
                  background: `linear-gradient(135deg, ${level.color}, ${level.color}aa)`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: '#fff', fontWeight: 800, flexShrink: 0,
                  boxShadow: `0 4px 12px ${level.color}60`,
                  zIndex: 1,
                }}>
                  {level.badge}
                </div>
                {i < CURRICULUM.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: `linear-gradient(180deg, ${level.color}40, ${CURRICULUM[i+1].color}40)`, minHeight: 24, marginTop: 4 }} />
                )}
              </div>
              {/* Content */}
              <div className="card" style={{
                flex: 1,
                marginLeft: 12,
                marginBottom: i < CURRICULUM.length - 1 ? 12 : 0,
                borderLeft: `3px solid ${level.color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: level.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{level.level}</span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{level.title}</h3>
                  </div>
                  <button
                    onClick={() => setCurrentLevel(currentLevel === level.level ? '' : level.level)}
                    style={{ background: level.bg, border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: level.color, fontWeight: 700, fontSize: 12 }}
                  >
                    {currentLevel === level.level ? 'Hide' : 'View Skills'}
                  </button>
                </div>
                {currentLevel === level.level && (
                  <ul style={{ marginTop: 12, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {level.skills.map((skill, j) => (
                      <li key={j} style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {skill}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Challenge */}
      <section className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1.5px solid #fde68a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Flame size={22} color="#d97706" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#92400e' }}>Today's Challenge</h2>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px', background: '#fde68a', color: '#92400e', borderRadius: 99 }}>
            {todaysChallenge.emoji} {todaysChallenge.domain}
          </span>
        </div>
        <div style={{ background: '#fff', border: '1.5px solid #fde68a', borderRadius: 16, padding: '16px 18px', marginBottom: 14 }}>
          <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, color: '#1f2937' }}>
            "{todaysChallenge.phrase}"
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setPracticeStep('listen'); speak(todaysChallenge.phrase) }}
            style={{ padding: '10px 18px', background: '#d97706', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🔊 Listen & Practice
          </button>
          <Link
            href={`/glossary?term=${encodeURIComponent(todaysChallenge.domain)}`}
            style={{ padding: '10px 18px', background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: 10, color: '#92400e', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <BookOpen size={15} /> Find in Glossary
          </Link>
        </div>
        {practiceStep === 'record' && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#ecfdf5', borderRadius: 12, fontSize: 13, color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎤 Now interpret into Amharic out loud — then go to <Link href="/glossary" style={{ color: 'var(--brand-600)' }}>Glossary</Link> to record & score.
          </div>
        )}
      </section>

      {/* Code of Ethics */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={20} color="var(--brand-500)" /> Interpreter Code of Ethics
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ETHICS.map((item, i) => (
            <div key={i} className="card" style={{ padding: '14px 18px', cursor: 'pointer' }} onClick={() => setOpenEthics(openEthics === i ? null : i)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</span>
                </div>
                {openEthics === i ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
              </div>
              {openEthics === i && (
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.65, paddingLeft: 30 }} className="animate-in">
                  {item.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Resource Library */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={20} color="var(--brand-500)" /> Reference Library
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {RESOURCES.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ height: '100%', borderLeft: '3px solid var(--brand-400)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{r.title}</h3>
                  <ExternalLink size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
