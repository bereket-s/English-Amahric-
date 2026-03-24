'use client'

import { useState } from 'react'
import { Lightbulb, CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { PRACTICE_EXERCISES } from '../../../../src/lib/scenarios'

const TIPS = [
  { icon: '→', title: 'Use symbols for speed', desc: '→ leads to · ↑↓ increase/decrease · = means · w/ with · w/o without · @ at · # number · & and · $ amount' },
  { icon: '📝', title: 'Capture keywords only', desc: 'Don\'t write full sentences. "pt sob + chest pain 3 days" beats "The patient reports shortness of breath and chest pain for three days."' },
  { icon: '🏷', title: 'Tag on the fly', desc: 'Use Alt+N (Name), Alt+P (Phone), Alt+C (Account) the moment a key piece of info is spoken so it\'s never missed.' },
  { icon: '📖', title: 'Learn 10 abbreviations per day', desc: 'Go to the Abbreviation Library, pick one domain, and memorize 10. After a week of medical terms you\'ll take notes 3x faster.' },
  { icon: '⏱', title: 'Timestamp everything critical', desc: 'The session timer stamps each note automatically. This helps you find the moment in a recording or meeting if you need to verify later.' },
  { icon: '👤', title: 'Use prefixes for speakers', desc: 'Start each note line with a speaker prefix: "Dr: …" or "Pt: …" or "Agent:" to keep dialogue organized.' },
  { icon: '📍', title: 'Pin first, review later', desc: 'During the call, pin anything you are unsure about. After the call, filter pinned notes and verify details.' },
  { icon: '🔁', title: 'Review, don\'t re-read', desc: 'After a session, use the tag filters to jump straight to names, numbers, and addresses — you usually only need those.' },
]

export default function TipsPage() {
  const [activeEx, setActiveEx] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState<{ fact: typeof PRACTICE_EXERCISES[0]['keyFacts'][0]; found: boolean }[]>([])

  const exercise = PRACTICE_EXERCISES.find(e => e.id === activeEx)

  const checkNotes = () => {
    if (!exercise) return
    const n = notes.toLowerCase()
    const results = exercise.keyFacts.map(fact => ({ fact, found: n.includes(fact.value.toLowerCase().split(' ')[0]) || n.includes(fact.value.toLowerCase()) }))
    setHits(results)
    setScore(Math.round((results.filter(r => r.found).length / results.length) * 100))
    setSubmitted(true)
  }

  const resetEx = () => { setNotes(''); setSubmitted(false); setScore(0); setHits([]) }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/notes" style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 600, textDecoration: 'none' }}>← Notes</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Lightbulb size={26} color="var(--brand-500)" /> Tips & Note-Taking Practice
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>
          Pro strategies for fast, accurate note-taking — then practice with real conversation scripts.
        </p>
      </div>

      {/* Tips */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>💡 Pro Tips</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
          {TIPS.map((tip, i) => (
            <div key={i} className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 22, flexShrink: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-50)', borderRadius: 10 }}>
                {tip.icon}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{tip.title}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Symbol cheat sheet */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>✏️ Symbol Quick Reference</h2>
        <div className="card" style={{ background: 'var(--surface-alt)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px 24px', fontSize: 13.5 }}>
            {[
              ['→', 'leads to / causes'], ['=', 'means / is defined as'], ['↑', 'increase / raised'],
              ['↓', 'decrease / lowered'], ['w/', 'with'], ['w/o', 'without'],
              ['@', 'at / located at'], ['#', 'number'], ['&', 'and'],
              ['$', 'dollar amount'], ['?', 'question / unclear'], ['!', 'important / urgent'],
              ['~', 'approximately'], ['≠', 'different from / not'], ['b/c', 'because'],
              ['pt', 'patient'], ['dr', 'doctor'], ['re:', 'regarding'],
            ].map(([sym, meaning]) => (
              <div key={sym} style={{ display: 'flex', gap: 8, paddingBottom: 4, borderBottom: '1px dashed var(--border)' }}>
                <code style={{ fontWeight: 800, color: 'var(--brand-600)', minWidth: 30 }}>{sym}</code>
                <span style={{ color: 'var(--text-secondary)' }}>{meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice exercises */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>🎯 Practice Exercises</h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Read the conversation script below as if you are hearing it live. Use the notepad to capture key information, then submit to see your score.
        </p>

        {/* Exercise picker buttons */}
        {!activeEx && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {PRACTICE_EXERCISES.map(ex => (
              <button key={ex.id} onClick={() => { setActiveEx(ex.id); resetEx() }} className="card"
                style={{ textAlign: 'left', cursor: 'pointer', border: '1.5px solid var(--border)', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{ex.title.split(' ')[0]}</div>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{ex.title.slice(3)}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ex.description}</p>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-600)', fontSize: 13, fontWeight: 600 }}>
                  Start Practice <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Exercise detail */}
        {activeEx && exercise && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => { setActiveEx(null); resetEx() }} className="btn btn-ghost btn-sm">← Back</button>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{exercise.title}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 700 ? '1fr 1fr' : '1fr', gap: 20 }}>
              {/* Script */}
              <div className="card" style={{ alignSelf: 'start' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Conversation Script</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {exercise.script.map((line, i) => {
                    const [speaker, ...rest] = line.split(': ')
                    return (
                      <div key={i} style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--brand-600)', minWidth: 80, flexShrink: 0 }}>{speaker}:</span>
                        <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>{rest.join(': ')}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Note pad */}
              <div>
                <div className="card" style={{ marginBottom: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Your Notes
                  </h4>
                  <textarea
                    disabled={submitted}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={`Take notes here as you read the script...\n\nHints: capture names, numbers, IDs, dates, and key details`}
                    style={{
                      width: '100%', minHeight: 220, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.7,
                      padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 12, outline: 'none',
                      background: submitted ? 'var(--surface-alt)' : 'var(--surface)', resize: 'vertical',
                      color: 'var(--text-primary)',
                    }}
                  />
                  {!submitted ? (
                    <button onClick={checkNotes} disabled={!notes.trim()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
                      Check My Notes →
                    </button>
                  ) : (
                    <button onClick={resetEx} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
                      <RotateCcw size={14} /> Try Again
                    </button>
                  )}
                </div>

                {/* Results */}
                {submitted && (
                  <div className="card animate-in">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700 }}>Results: {score}%</h4>
                      <span className={score >= 80 ? 'badge badge-success' : score >= 50 ? 'badge badge-warning' : 'badge badge-danger'}>
                        {score >= 80 ? '🏆 Excellent' : score >= 50 ? '⭐ Good' : '💪 Keep practicing'}
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--surface-alt)', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
                      <div style={{ height: '100%', width: `${score}%`, background: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: 999, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {hits.map((h, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
                          {h.found ? <CheckCircle2 size={16} color="var(--success)" /> : <XCircle size={16} color="var(--danger)" />}
                          <span style={{ fontWeight: 600, minWidth: 140 }}>{h.fact.label}:</span>
                          <span style={{ color: h.found ? '#065f46' : '#991b1b' }}>{h.fact.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
