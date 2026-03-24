'use client'

import { useEffect, useState } from 'react'
import { Puzzle, RotateCcw, Trophy, Zap } from 'lucide-react'

type Term = { id: string; english_term: string; amharic_term: string }

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

export default function MatchPage() {
  const [terms, setTerms] = useState<Term[]>([])
  const [englishCol, setEnglishCol] = useState<Term[]>([])
  const [amharicCol, setAmharicCol] = useState<Term[]>([])
  const [selectedEng, setSelectedEng] = useState<string | null>(null)
  const [selectedAmh, setSelectedAmh] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<string | null>(null) // id that flashed wrong
  const [loading, setLoading] = useState(true)
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [finished, setFinished] = useState(false)
  const [xp, setXp] = useState(0)
  const [errors, setErrors] = useState(0)

  const PAIR_COUNT = 8

  useEffect(() => {
    fetch('/api/glossary?limit=40')
      .then(r => r.json())
      .then(d => {
        const t: Term[] = shuffle((d.entries || []) as Term[]).slice(0, PAIR_COUNT)
        setTerms(t)
        setEnglishCol(shuffle([...t]))
        setAmharicCol(shuffle([...t]))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (finished) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(id)
  }, [finished, startTime])

  useEffect(() => {
    if (selectedEng && selectedAmh) {
      const engTerm = terms.find(t => t.id === selectedEng)
      const amhTerm = terms.find(t => t.id === selectedAmh)
      if (engTerm && amhTerm && engTerm.id === amhTerm.id) {
        // Correct match
        const newMatched = new Set([...matched, selectedEng])
        setMatched(newMatched)
        setXp(x => x + 10)
        setSelectedEng(null)
        setSelectedAmh(null)
        if (newMatched.size === PAIR_COUNT) setFinished(true)
      } else {
        // Wrong
        setErrors(e => e + 1)
        setWrong(`${selectedEng}-${selectedAmh}`)
        setTimeout(() => {
          setSelectedEng(null)
          setSelectedAmh(null)
          setWrong(null)
        }, 700)
      }
    }
  }, [selectedEng, selectedAmh])

  const restart = () => {
    const t = shuffle([...terms]).slice(0, PAIR_COUNT)
    setEnglishCol(shuffle([...t]))
    setAmharicCol(shuffle([...t]))
    setMatched(new Set())
    setSelectedEng(null); setSelectedAmh(null); setWrong(null)
    setXp(0); setErrors(0); setFinished(false)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (loading) return <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}><div className="skeleton" style={{ height: 400 }} /></main>

  if (!loading && terms.length < 4) return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <Puzzle size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Not enough words</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>You need at least 4 terms in your glossary to play Match. Upload a document to add more!</p>
    </main>
  )

  if (finished) return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div className="card animate-bounceIn" style={{ padding: '48px 32px' }}>
        <Trophy size={52} color="#f59e0b" style={{ marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>All Matched! 🎉</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 28, flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: 30, fontWeight: 800, color: '#6366f1' }}>{fmt(elapsed)}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Time</div></div>
          <div><div style={{ fontSize: 30, fontWeight: 800, color: '#10b981' }}>{xp}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>XP earned</div></div>
          <div><div style={{ fontSize: 30, fontWeight: 800, color: '#ef4444' }}>{errors}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Mistakes</div></div>
        </div>
        <button onClick={restart} className="btn btn-primary btn-lg"><RotateCcw size={17} /> Play Again</button>
      </div>
    </main>
  )

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Puzzle size={22} color="var(--brand-500)" /> Match Game
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-muted">⏱ {fmt(elapsed)}</span>
          <span className="badge badge-warning"><Zap size={13} /> {xp} XP</span>
          <span className="badge" style={{ background: '#fef2f2', color: '#991b1b' }}>{errors} ✗</span>
        </div>
      </div>

      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Click an English word, then click its Amharic match. {matched.size} / {PAIR_COUNT} matched.
      </p>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* English column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>🇬🇧 English</div>
          {englishCol.map(term => {
            const isMatched = matched.has(term.id)
            const isSelected = selectedEng === term.id
            const isWrong = wrong?.startsWith(term.id)
            return (
              <button key={term.id} onClick={() => !isMatched && setSelectedEng(term.id)}
                disabled={isMatched}
                style={{
                  padding: '14px 16px', borderRadius: 12, border: `2px solid ${isWrong ? '#fca5a5' : isSelected ? 'var(--brand-500)' : isMatched ? '#6ee7b7' : 'var(--border)'}`,
                  background: isWrong ? 'var(--danger-bg)' : isSelected ? 'var(--brand-50)' : isMatched ? 'var(--success-bg)' : 'var(--surface)',
                  fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: isMatched ? 'default' : 'pointer',
                  textAlign: 'left', transition: 'all 0.2s', opacity: isMatched ? 0.5 : 1,
                  textDecoration: isMatched ? 'line-through' : 'none',
                }}>
                {term.english_term}
              </button>
            )
          })}
        </div>

        {/* Amharic column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>🇪🇹 Amharic</div>
          {amharicCol.map(term => {
            const isMatched = matched.has(term.id)
            const isSelected = selectedAmh === term.id
            const isWrong = wrong?.endsWith(term.id)
            return (
              <button key={term.id} onClick={() => !isMatched && setSelectedAmh(term.id)}
                disabled={isMatched}
                style={{
                  padding: '14px 16px', borderRadius: 12, border: `2px solid ${isWrong ? '#fca5a5' : isSelected ? '#10b981' : isMatched ? '#6ee7b7' : 'var(--border)'}`,
                  background: isWrong ? 'var(--danger-bg)' : isSelected ? '#ecfdf5' : isMatched ? 'var(--success-bg)' : 'var(--surface)',
                  fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: isMatched ? 'default' : 'pointer',
                  textAlign: 'left', transition: 'all 0.2s', opacity: isMatched ? 0.5 : 1,
                  textDecoration: isMatched ? 'line-through' : 'none',
                }}>
                {term.amharic_term}
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
