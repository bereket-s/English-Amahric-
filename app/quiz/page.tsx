'use client'

import { useEffect, useState } from 'react'
import { HelpCircle, Keyboard, CheckCircle2, XCircle, RotateCcw, Zap } from 'lucide-react'

type Term = { id: string; english_term: string; amharic_term: string }
type Mode = 'mc' | 'typein' | 'tf'

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function pick4(all: Term[], correct: Term): Term[] {
  const others = shuffle(all.filter(t => t.id !== correct.id)).slice(0, 3)
  return shuffle([correct, ...others])
}

export default function QuizPage() {
  const [terms, setTerms] = useState<Term[]>([])
  const [mode, setMode] = useState<Mode>('mc')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [xp, setXp] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)

  // For current question
  const [options, setOptions] = useState<Term[]>([])
  const [tfPair, setTfPair] = useState<{ q: Term; a: Term; isTrue: boolean }>({ q: { id: '', english_term: '', amharic_term: '' }, a: { id: '', english_term: '', amharic_term: '' }, isTrue: true })

  const current = terms[index]

  useEffect(() => {
    fetch('/api/glossary?limit=40')
      .then(r => r.json())
      .then(d => {
        setTerms(shuffle(d.entries || []))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (terms.length === 0 || !current) return
    if (mode === 'mc') setOptions(pick4(terms, current))
    if (mode === 'tf') {
      const isTrue = Math.random() > 0.5
      const wrongAnswer = isTrue ? current : shuffle(terms.filter(t => t.id !== current.id))[0]
      setTfPair({ q: current, a: wrongAnswer || current, isTrue })
    }
    setSelected(null); setInput(''); setTfAnswer(null); setShowResult(false)
  }, [index, mode, terms])

  const TOTAL = Math.min(terms.length, 15)

  const submit = (correct: boolean) => {
    setShowResult(true)
    if (correct) { setScore(s => s + 1); setXp(x => x + 10) }
  }

  const checkMC = (opt: Term) => {
    if (showResult) return
    setSelected(opt.id)
    submit(opt.id === current.id)
  }

  const checkType = () => {
    if (showResult) return
    const clean = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9\u1200-\u137f ]/g, '')
    const correct = clean(input) === clean(current.amharic_term) || clean(input) === clean(current.english_term)
    submit(correct)
  }

  const checkTF = (ans: boolean) => {
    if (showResult) return
    setTfAnswer(ans)
    submit(ans === tfPair.isTrue)
  }

  const nextQ = () => {
    if (index + 1 >= TOTAL) setFinished(true)
    else setIndex(i => i + 1)
  }

  const restart = () => { setIndex(0); setScore(0); setXp(0); setFinished(false); setTerms(t => shuffle([...t])) }

  if (loading) return <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}><div className="skeleton" style={{ height: 320 }} /></main>

  if (!loading && terms.length < 4) return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <HelpCircle size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Not enough words</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>You need at least 4 terms in your glossary to play the Quiz. Upload a document to add more!</p>
    </main>
  )

  if (finished) return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div className="card animate-bounceIn" style={{ padding: '48px 32px' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>{score >= TOTAL * 0.8 ? '🏆' : score >= TOTAL * 0.5 ? '⭐' : '💪'}</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Quiz Complete!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          {score} / {TOTAL} correct · {xp} XP earned
        </p>
        <div style={{ width: '100%', background: 'var(--surface-alt)', borderRadius: 999, height: 14, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(score / TOTAL) * 100}%`, background: 'linear-gradient(90deg, var(--brand-500), var(--brand-700))', borderRadius: 999 }} />
        </div>
        <button onClick={restart} className="btn btn-primary btn-lg"><RotateCcw size={17} /> Play Again</button>
      </div>
    </main>
  )

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={22} color="var(--brand-500)" /> Quiz
        </h1>
        <span className="badge badge-warning" style={{ fontSize: 13 }}><Zap size={13} /> {xp} XP</span>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {([['mc', 'Multiple Choice'], ['typein', 'Type-In'], ['tf', 'True / False']] as [Mode, string][]).map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); setIndex(0); setScore(0); setXp(0); setFinished(false) }}
            className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center', borderRadius: 99 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
        <span>Question {index + 1} / {TOTAL}</span>
        <span style={{ color: '#10b981', fontWeight: 600 }}>{score} correct</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-alt)', borderRadius: 999, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ height: '100%', width: `${(index / TOTAL) * 100}%`, background: 'linear-gradient(90deg, var(--brand-500), var(--brand-700))', borderRadius: 999, transition: 'width 0.3s' }} />
      </div>

      {current && (
        <div className="card" style={{ marginBottom: 20 }}>
          {/* Question prompt */}
          {mode === 'tf' ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>TRUE or FALSE?</p>
              <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{tfPair.q.english_term}</p>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>means: <strong>{tfPair.a.amharic_term}</strong></p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>TRANSLATE TO AMHARIC:</p>
              <p style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{current.english_term}</p>
            </>
          )}

          {/* Result feedback */}
          {showResult && (
            <div className="animate-in" style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 12,
              background: (mode !== 'tf' ? selected === current.id : tfAnswer === tfPair.isTrue) ? 'var(--success-bg)' : 'var(--danger-bg)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              {(mode !== 'tf' ? selected === current.id : tfAnswer === tfPair.isTrue)
                ? <><CheckCircle2 size={18} color="var(--success)" /><span style={{ color: '#065f46', fontWeight: 600 }}>Correct! +10 XP</span></>
                : <><XCircle size={18} color="var(--danger)" /><span style={{ color: '#991b1b', fontWeight: 600 }}>Correct answer: {current.amharic_term}</span></>
              }
            </div>
          )}
        </div>
      )}

      {/* MC Options */}
      {mode === 'mc' && current && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {options.map(opt => {
            const isCorrect = opt.id === current.id
            const isSelected = selected === opt.id
            let bg = 'var(--surface)'
            let border = 'var(--border)'
            if (showResult && isCorrect) { bg = 'var(--success-bg)'; border = '#6ee7b7' }
            else if (showResult && isSelected && !isCorrect) { bg = 'var(--danger-bg)'; border = '#fca5a5' }
            else if (isSelected) { bg = 'var(--brand-50)'; border = 'var(--brand-400)' }
            return (
              <button key={opt.id} onClick={() => checkMC(opt)} style={{
                padding: '16px', borderRadius: 14, border: `2px solid ${border}`, background: bg,
                cursor: showResult ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit',
                fontSize: 15, fontWeight: 600, transition: 'all 0.2s',
              }}>{opt.amharic_term}</button>
            )
          })}
        </div>
      )}

      {/* Type-in */}
      {mode === 'typein' && (
        <div style={{ marginBottom: 20 }}>
          <input
            className="input"
            placeholder="Type the Amharic translation…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !showResult && checkType()}
            style={{ marginBottom: 10, fontSize: 16 }}
            autoFocus
          />
          {!showResult && (
            <button onClick={checkType} disabled={!input.trim()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Keyboard size={15} /> Check Answer
            </button>
          )}
        </div>
      )}

      {/* True / False */}
      {mode === 'tf' && !showResult && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button onClick={() => checkTF(true)} className="btn btn-lg" style={{ flex: 1, justifyContent: 'center', background: '#ecfdf5', color: '#065f46', border: '2px solid #6ee7b7', fontWeight: 700 }}>✅ True</button>
          <button onClick={() => checkTF(false)} className="btn btn-lg" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger-bg)', color: '#991b1b', border: '2px solid #fca5a5', fontWeight: 700 }}>❌ False</button>
        </div>
      )}

      {showResult && (
        <button onClick={nextQ} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
          {index + 1 >= TOTAL ? 'See Results' : 'Next Question →'}
        </button>
      )}
    </main>
  )
}
