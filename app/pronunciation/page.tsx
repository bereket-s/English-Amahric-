'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Volume2, Mic, MicOff, RefreshCw, ChevronRight, Loader2, Star } from 'lucide-react'
import Recorder, { RecorderRef } from '../../components/Recorder'

const WARMUP_SETS = [
  {
    category: '🏥 Medical', color: '#6366f1', bg: '#eef2ff',
    phrases: ['blood pressure', 'prescription medication', 'informed consent', 'emergency room', 'prenatal care'],
  },
  {
    category: '⚖️ Legal', color: '#8b5cf6', bg: '#f5f3ff',
    phrases: ['right to remain silent', 'probable cause', 'due process', 'restraining order', 'plea agreement'],
  },
  {
    category: '🏦 Banking', color: '#3b82f6', bg: '#eff6ff',
    phrases: ['unauthorized transaction', 'routing number', 'minimum payment', 'overdraft fee', 'credit score'],
  },
  {
    category: '🏠 Social Services', color: '#10b981', bg: '#ecfdf5',
    phrases: ['rental assistance', 'food assistance program', 'case worker', 'domestic violence shelter', 'social security'],
  },
  {
    category: '🌐 Immigration', color: '#f59e0b', bg: '#fffbeb',
    phrases: ['political asylum', 'permanent resident', 'work authorization', 'immigration court', 'deportation order'],
  },
]

type EvalResult = { score: number; feedback: string } | null

export default function PronunciationWarmupPage() {
  const [catIdx, setCatIdx] = useState(0)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [result, setResult] = useState<EvalResult>(null)
  const [sessionScores, setSessionScores] = useState<number[]>([])
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')
  const recorderRef = useRef<RecorderRef>(null)
  const stopTimeout = useRef<NodeJS.Timeout | null>(null)

  const cat = WARMUP_SETS[catIdx]
  const phrase = cat.phrases[phraseIdx]

  // Auto-speak when phrase changes
  useEffect(() => {
    speakPhrase()
    setResult(null)
    setIsRecording(false)
    setIsEvaluating(false)
  }, [catIdx, phraseIdx])

  const speakPhrase = () => {
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(phrase)
    utt.lang = 'en-US'
    utt.rate = speed === 'slow' ? 0.65 : speed === 'fast' ? 1.1 : 0.85
    window.speechSynthesis.speak(utt)
  }

  const startRecording = () => {
    setIsRecording(true)
    setResult(null)
    recorderRef.current?.startRecording()
    stopTimeout.current = setTimeout(() => stopRecording(), 6000)
  }

  const stopRecording = () => {
    if (stopTimeout.current) clearTimeout(stopTimeout.current)
    setIsRecording(false)
    recorderRef.current?.stopRecording()
  }

  const handleRecorded = useCallback(async (blob: Blob) => {
    setIsEvaluating(true)
    try {
      const form = new FormData()
      form.append('file', new File([blob], 'pronunciation.webm', { type: 'audio/webm' }))
      form.append('expectedLanguage', 'en')
      const tRes = await fetch('/api/transcribe', { method: 'POST', body: form })
      const tData = await tRes.json()
      const spokenText = tData.text || ''

      if (!spokenText) {
        setResult({ score: 0, feedback: 'Could not hear your pronunciation. Please try again.' })
        setIsEvaluating(false)
        return
      }

      const eRes = await fetch('/api/evaluate-interpretation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ englishText: phrase, amharicText: spokenText }),
      })
      const eData = await eRes.json()
      const { score, feedback } = eData.evaluation || { score: 0, feedback: '' }
      setResult({ score, feedback })
      setSessionScores(prev => [...prev, score])
    } catch {
      setResult({ score: 0, feedback: 'Evaluation failed — please try again.' })
    } finally {
      setIsEvaluating(false)
    }
  }, [phrase])

  const nextPhrase = () => {
    setResult(null)
    if (phraseIdx + 1 < cat.phrases.length) {
      setPhraseIdx(p => p + 1)
    } else {
      setPhraseIdx(0)
      setCatIdx(c => (c + 1) % WARMUP_SETS.length)
    }
  }

  const sessionAvg = sessionScores.length > 0
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : null

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          🗣️ Pronunciation Warm-Up
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Listen → repeat → get AI scored on your English pronunciation
        </p>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {WARMUP_SETS.map((c, i) => (
          <button key={i} onClick={() => { setCatIdx(i); setPhraseIdx(0) }}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: `2px solid ${catIdx === i ? c.color : 'transparent'}`,
              background: catIdx === i ? c.bg : 'var(--surface)',
              color: catIdx === i ? c.color : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}>
            {c.category}
          </button>
        ))}
      </div>

      {/* Main card */}
      <div className="card" style={{ marginBottom: 20, borderTop: `4px solid ${cat.color}`, padding: '28px 24px', textAlign: 'center' }}>
        {/* Phrase counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {cat.phrases.map((_, i) => (
              <div key={i} onClick={() => setPhraseIdx(i)} style={{
                width: 28, height: 6, borderRadius: 99, cursor: 'pointer',
                background: i === phraseIdx ? cat.color : i < phraseIdx ? cat.color + '60' : 'var(--surface-alt)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
          {sessionAvg !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
              <Star size={12} color="#f59e0b" /> Session avg: <span style={{ color: cat.color }}>{sessionAvg}%</span>
            </div>
          )}
        </div>

        {/* Speed selector */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
          {(['slow', 'normal', 'fast'] as const).map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              style={{
                padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `2px solid ${speed === s ? cat.color : 'var(--border)'}`,
                background: speed === s ? cat.bg : 'var(--surface)',
                color: speed === s ? cat.color : 'var(--text-muted)',
                textTransform: 'capitalize',
              }}>
              {s === 'slow' ? '🐢 Slow' : s === 'fast' ? '⚡ Fast' : '🎯 Normal'}
            </button>
          ))}
        </div>

        {/* The phrase */}
        <div style={{
          fontSize: 'clamp(20px, 5vw, 28px)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          lineHeight: 1.4,
          marginBottom: 24,
          padding: '20px',
          background: 'var(--surface-alt)',
          borderRadius: 16,
          letterSpacing: '-0.01em',
        }}>
          "{phrase}"
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {[
            { label: '1. Listen', done: true },
            { label: '2. Repeat', done: isRecording || result !== null },
            { label: '3. Score', done: result !== null },
          ].map((step, i) => (
            <div key={i} style={{
              padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: step.done ? cat.bg : 'var(--surface-alt)',
              color: step.done ? cat.color : 'var(--text-muted)',
              border: `1.5px solid ${step.done ? cat.color + '60' : 'transparent'}`,
            }}>
              {step.label}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={speakPhrase}
            style={{
              padding: '12px 20px', borderRadius: 14, border: 'none',
              background: cat.bg, color: cat.color,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <Volume2 size={18} /> Listen Again
          </button>

          {!isRecording && !isEvaluating && (
            <button onClick={startRecording}
              style={{
                padding: '12px 24px', borderRadius: 14, border: 'none',
                background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`,
                color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: `0 4px 16px ${cat.color}40`,
              }}>
              <Mic size={18} /> {result ? 'Try Again' : 'Record Yourself'}
            </button>
          )}

          {isRecording && (
            <button onClick={stopRecording}
              style={{
                padding: '12px 24px', borderRadius: 14, border: 'none',
                background: '#dc2626', color: '#fff',
                fontWeight: 800, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                animation: 'pulse-bg 1.5s infinite',
              }}>
              <MicOff size={18} /> Stop Recording
            </button>
          )}

          {isEvaluating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: cat.color, fontWeight: 600 }}>
              <Loader2 size={18} style={{ animation: 'spin-slow 1s linear infinite' }} /> Scoring…
            </div>
          )}
        </div>

        {/* Recording status */}
        {isRecording && (
          <div className="animate-in" style={{ marginTop: 14, fontSize: 13, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, background: '#dc2626', borderRadius: '50%', animation: 'pulse-dot 1s infinite' }} />
            Say the phrase in English now…
          </div>
        )}
      </div>

      {/* Score result card */}
      {result && !isEvaluating && (
        <div className="card animate-bounceIn" style={{ marginBottom: 20, borderLeft: `4px solid ${result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: result.score >= 80 ? '#ecfdf5' : result.score >= 60 ? '#fffbeb' : '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900,
              color: result.score >= 80 ? '#059669' : result.score >= 60 ? '#d97706' : '#dc2626',
              border: `2px solid ${result.score >= 80 ? '#6ee7b7' : result.score >= 60 ? '#fde68a' : '#fca5a5'}`,
            }}>
              {result.score}%
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                {result.score >= 90 ? '🎉 Excellent pronunciation!' : result.score >= 75 ? '🔥 Good job!' : result.score >= 60 ? '👍 Getting there!' : '💪 Keep practicing!'}
              </div>
              {result.feedback && (
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>{result.feedback}</div>
              )}
            </div>
          </div>
          <button onClick={nextPhrase}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}>
            Next Phrase <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Session scores */}
      {sessionScores.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Session Scores
          </h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {sessionScores.map((s, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2',
                color: s >= 80 ? '#059669' : s >= 60 ? '#d97706' : '#dc2626',
                border: `2px solid ${s >= 80 ? '#6ee7b7' : s >= 60 ? '#fde68a' : '#fca5a5'}`,
              }}>{s}</div>
            ))}
            {sessionAvg !== null && (
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginLeft: 8 }}>
                Avg: <strong style={{ color: cat.color, marginLeft: 4 }}>{sessionAvg}%</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden recorder */}
      <div style={{ display: 'none' }}>
        <Recorder ref={recorderRef} onRecorded={handleRecorded} />
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin-slow { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes pulse-bg { 0%,100%{opacity:1} 50%{opacity:0.8} }
      `}} />
    </main>
  )
}
