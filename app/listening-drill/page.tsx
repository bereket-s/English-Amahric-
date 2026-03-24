'use client'

import { useEffect, useState, useRef } from 'react'
import { Headphones, Play, Pause, RotateCcw, ChevronRight, Mic, Square } from 'lucide-react'

type Term = { id: string; english_term: string; amharic_term?: string; english_sentence?: string }

type DrillMode = 'listen' | 'shadow'

function diffWords(target: string, input: string) {
  const tWords = target.toLowerCase().split(/\s+/)
  const iWords = input.toLowerCase().split(/\s+/)
  return tWords.map(w => ({ word: w, found: iWords.some(iw => iw.replace(/[^a-z]/g, '') === w.replace(/[^a-z]/g, '')) }))
}

export default function ListeningDrillPage() {
  const [terms, setTerms] = useState<Term[]>([])
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<DrillMode>('listen')
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [diff, setDiff] = useState<{ word: string; found: boolean }[]>([])
  const [speed, setSpeed] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(true)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    fetch('/api/glossary?limit=40')
      .then(r => r.json())
      .then(d => {
        const t: Term[] = (d.entries || []).filter((t: Term) => t.english_sentence || t.english_term)
        setTerms(t)
        setLoading(false)
      })
  }, [])

  const currentTerm = terms[index]
  const targetText = currentTerm?.english_sentence || currentTerm?.english_term || ''

  const speak = () => {
    if (!targetText || typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(targetText)
    utt.rate = speed
    utt.lang = 'en-US'
    utt.onend = () => setPlaying(false)
    synthRef.current = utt
    setPlaying(true)
    window.speechSynthesis.speak(utt)
  }

  const stopSpeech = () => {
    window.speechSynthesis.cancel()
    setPlaying(false)
  }

  const checkAnswer = () => {
    const d = diffWords(targetText, input)
    const correct = d.filter(w => w.found).length
    setDiff(d)
    setScore(Math.round((correct / d.length) * 100))
    setSubmitted(true)
  }

  const next = () => {
    setIndex(i => (i + 1) % terms.length)
    setInput(''); setSubmitted(false); setScore(null); setDiff([])
    stopSpeech()
  }

  if (loading) return <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}><div className="skeleton" style={{ height: 340 }} /></main>

  if (!loading && terms.length === 0) return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <Headphones size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>No terms available</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Upload a document to add terms to your glossary before starting the Listening Drill.</p>
    </main>
  )

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Headphones size={22} color="var(--brand-500)" /> Listening Drill
        </h1>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{index + 1} / {terms.length}</span>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {(['listen', 'shadow'] as DrillMode[]).map(m => (
          <button key={m} onClick={() => { setMode(m); setInput(''); setSubmitted(false); setScore(null); setDiff([]) }}
            className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 99, flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}>
            {m === 'listen' ? '🎧 Listen & Type' : '🎙 Shadowing'}
          </button>
        ))}
      </div>

      {currentTerm && (
        <div>
          {/* Playback card */}
          <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '32px 24px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              {mode === 'listen' ? 'Listen, then type what you heard' : 'Listen, then repeat out loud'}
            </p>
            {/* Playback controls */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
              <button onClick={playing ? stopSpeech : speak} className="btn btn-primary btn-lg" style={{ minWidth: 130, justifyContent: 'center' }}>
                {playing ? <><Pause size={18} /> Stop</> : <><Play size={18} /> Play Audio</>}
              </button>
              {/* Speed control */}
              <div style={{ display: 'flex', gap: 4 }}>
                {[0.75, 1, 1.25].map(s => (
                  <button key={s} onClick={() => setSpeed(s)} style={{
                    padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${speed === s ? 'var(--brand-400)' : 'var(--border)'}`,
                    background: speed === s ? 'var(--brand-50)' : 'var(--surface)', cursor: 'pointer',
                    fontFamily: 'inherit', fontWeight: speed === s ? 700 : 400, fontSize: 13,
                    color: speed === s ? 'var(--brand-600)' : 'var(--text-muted)',
                  }}>
                    {s === 0.75 ? '🐢 Slow' : s === 1 ? '▶ Normal' : '⚡ Fast'}
                  </button>
                ))}
              </div>
            </div>

            {submitted && (
              <div className="animate-in" style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Original text:</p>
                <p style={{ fontSize: 16, lineHeight: 1.8 }}>
                  {diff.map((w, i) => (
                    <span key={i} className={w.found ? 'word-matched' : 'word-missing'} style={{ marginRight: 4 }}>
                      {w.word}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>

          {/* Term context */}
          {currentTerm.amharic_term && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>
              {submitted ? `(${currentTerm.amharic_term})` : '🇪🇹 Translation hidden until you submit'}
            </div>
          )}

          {/* Listen mode: type input */}
          {mode === 'listen' && (
            <div style={{ marginBottom: 16 }}>
              <textarea
                disabled={submitted}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !submitted && (e.preventDefault(), checkAnswer())}
                placeholder="Type exactly what you heard… (Enter to submit)"
                style={{
                  width: '100%', minHeight: 90, fontFamily: 'inherit', fontSize: 15, lineHeight: 1.6,
                  padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 14, outline: 'none',
                  background: submitted ? 'var(--surface-alt)' : 'var(--surface)', resize: 'none',
                  color: 'var(--text-primary)',
                }}
              />
              {!submitted ? (
                <button onClick={checkAnswer} disabled={!input.trim()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                  Check →
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <div className="card animate-in" style={{ flex: 1, padding: '14px 18px', textAlign: 'center', borderTop: `4px solid ${score! >= 80 ? 'var(--success)' : score! >= 50 ? 'var(--warning)' : 'var(--danger)'}` }}>
                    <p style={{ fontSize: 28, fontWeight: 800, color: score! >= 80 ? 'var(--success)' : score! >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{score}%</p>
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>accuracy</p>
                  </div>
                  <button onClick={next} className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }}>
                    Next <ChevronRight size={17} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Shadow mode */}
          {mode === 'shadow' && (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <Mic size={28} color="var(--text-muted)" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Press Play, listen carefully, then repeat the phrase aloud at the same speed.
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Shadowing trains your ear and mouth simultaneously. Try to match the rhythm and stress of what you hear.
              </p>
              <button onClick={next} className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                Next Phrase <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Skip/restart */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
            <button onClick={next} className="btn btn-ghost btn-sm">Skip →</button>
            <button onClick={() => { setIndex(0); setInput(''); setSubmitted(false); setScore(null); setDiff([]) }} className="btn btn-ghost btn-sm">
              <RotateCcw size={13} /> Restart
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
