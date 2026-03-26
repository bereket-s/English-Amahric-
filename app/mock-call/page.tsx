'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Square, MicOff, Mic, ChevronRight, RotateCcw, Loader2, Clock, Star, Volume2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { PRACTICE_EXERCISES, Scenario } from '../../src/lib/scenarios'
import Recorder, { RecorderRef } from '../../components/Recorder'
import ScoreRing from '../../components/ui/ScoreRing'

const DIFFICULTY_TIMES: Record<string, number> = { L2: 12, L3: 9, L4: 6 }
const DOMAIN_EMOJI: Record<string, string> = {
  medical: '🏥', legal: '⚖️', banking: '🏦', insurance: '🛡️',
  immigration: '🏛️', 'social services': '📋',
}

type TurnResult = { line: string; score: number; feedback: string; transcript: string }

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const bg = score >= 80 ? '#ecfdf5' : score >= 60 ? '#fffbeb' : '#fef2f2'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 800, background: bg, color }}>
      {score}%
    </span>
  )
}

export default function MockCallPage() {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [phase, setPhase] = useState<'select' | 'briefing' | 'call' | 'review'>('select')
  const [lineIdx, setLineIdx] = useState(0)
  const [userTurns, setUserTurns] = useState<number[]>([]) // which line indices need user to interpret
  const [isPlayingLine, setIsPlayingLine] = useState(false)
  const [waitingUser, setWaitingUser] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [results, setResults] = useState<TurnResult[]>([])
  const [totalXP, setTotalXP] = useState(0)
  const [autoSeconds, setAutoSeconds] = useState(9)
  const [keyFacts, setKeyFacts] = useState<{ label: string; value: string }[]>([])
  const [factsRevealed, setFactsRevealed] = useState<Set<number>>(new Set())
  const [statusMsg, setStatusMsg] = useState('')

  const recorderRef = useRef<RecorderRef>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Determine which lines need user interpretation (every other speaker turn)
  const buildUserTurns = (sc: Scenario) => {
    const turns: number[] = []
    const speakers = Array.from(new Set(sc.script.map(l => l.split(':')[0].trim())))
    // User interprets lines from the SECOND speaker (index 1 in speakers array)
    const targetSpeaker = speakers[1] || speakers[0]
    sc.script.forEach((line, i) => {
      const speaker = line.split(':')[0].trim()
      if (speaker === targetSpeaker) turns.push(i)
    })
    return turns
  }

  const startScenario = (sc: Scenario) => {
    setScenario(sc)
    setPhase('briefing')
    setUserTurns(buildUserTurns(sc))
    setLineIdx(0)
    setResults([])
    setKeyFacts(sc.keyFacts)
    setFactsRevealed(new Set())
    setTotalXP(0)
    setAutoSeconds(DIFFICULTY_TIMES[sc.level] ?? 9)
    window.speechSynthesis.cancel()
  }

  const startCall = () => {
    setPhase('call')
    setLineIdx(0)
    setTimeout(() => playLine(0), 400)
  }

  const speakLine = (text: string, rate = 1.0): Promise<void> => {
    return new Promise(resolve => {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = 'en-US'
      utt.rate = rate
      const voices = window.speechSynthesis.getVoices()
      // Pick second voice for second speaker if available
      if (voices.length > 1) utt.voice = voices[1]
      utt.onend = () => resolve()
      window.speechSynthesis.speak(utt)
    })
  }

  const playLine = useCallback(async (idx: number) => {
    if (!scenario || idx >= scenario.script.length) {
      setPhase('review')
      return
    }
    setLineIdx(idx)
    setIsPlayingLine(true)
    setWaitingUser(false)
    setStatusMsg('')

    const line = scenario.script[idx]
    const text = line.includes(':') ? line.split(':').slice(1).join(':').trim() : line
    const rate = scenario.level === 'L4' ? 1.1 : scenario.level === 'L3' ? 0.9 : 0.8

    await speakLine(text, rate)
    setIsPlayingLine(false)

    // Check if user needs to interpret this line
    if (userTurns.includes(idx)) {
      setWaitingUser(true)
      beginCountdown(idx)
    } else {
      // Auto-advance for non-user lines after brief pause
      setTimeout(() => playLine(idx + 1), 600)
    }
  }, [scenario, userTurns])

  const beginCountdown = (idx: number) => {
    setCountdown(autoSeconds)
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current!)
          startRecording(idx)
        }
        return c - 1
      })
    }, 1000)
  }

  const startRecording = (idx: number) => {
    if (isRecording) return
    setWaitingUser(false)
    setIsRecording(true)
    setStatusMsg('🎤 Recording your interpretation…')
    recorderRef.current?.startRecording()
    stopTimeoutRef.current = setTimeout(() => stopRecording(idx), autoSeconds * 1000)
  }

  const stopRecording = (idx: number) => {
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    setIsRecording(false)
    recorderRef.current?.stopRecording()
    setStatusMsg('⏳ Evaluating…')
  }

  const handleRecorded = useCallback(async (blob: Blob) => {
    if (!scenario) return
    const idx = lineIdx
    setIsEvaluating(true)
    try {
      const form = new FormData()
      form.append('file', new File([blob], 'mock.webm', { type: 'audio/webm' }))
      form.append('expectedLanguage', 'am')
      const tRes = await fetch('/api/transcribe', { method: 'POST', body: form })
      const tData = await tRes.json()
      const transcript = tData.text || ''

      const line = scenario.script[idx]
      const englishText = line.includes(':') ? line.split(':').slice(1).join(':').trim() : line

      let score = 0, feedback = ''
      if (transcript) {
        const eRes = await fetch('/api/evaluate-interpretation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ englishText, amharicText: transcript }),
        })
        const eData = await eRes.json()
        score = eData.evaluation?.score ?? 0
        feedback = eData.evaluation?.feedback ?? ''
      } else {
        feedback = 'Could not hear your interpretation — microphone check recommended.'
      }

      const result: TurnResult = { line, score, feedback, transcript }
      setResults(prev => [...prev, result])
      setTotalXP(x => x + Math.floor(score / 10) * 5)

      // Reveal key facts progressively
      const factPatterns = scenario.keyFacts.map(f => f.value.toLowerCase())
      const scoreLower = englishText.toLowerCase()
      scenario.keyFacts.forEach((_, fi) => {
        if (scoreLower.includes(factPatterns[fi]?.slice(0, 6))) {
          setFactsRevealed(prev => new Set([...prev, fi]))
        }
      })

      setStatusMsg('')
      setIsEvaluating(false)

      // Move to next line
      setTimeout(() => playLine(idx + 1), 1200)
    } catch {
      setStatusMsg('Evaluation error — moving to next line')
      setIsEvaluating(false)
      setTimeout(() => playLine(idx + 1), 1000)
    }
  }, [scenario, lineIdx, playLine])

  const avgScore = results.length > 0
    ? Math.round(results.reduce((a, b) => a + b.score, 0) / results.length)
    : 0

  const resetAll = () => {
    window.speechSynthesis.cancel()
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    setScenario(null)
    setPhase('select')
    setResults([])
  }

  // ── RENDER ───────────────────────────────────────────────────────────────
  // Scenario select
  if (phase === 'select') return (
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '28px 16px 100px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          📞 Mock Call Simulator
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Realistic call simulations — speak + AI scores each interpretation turn. Pick a scenario to begin.
        </p>
      </div>

      {/* Difficulty guide */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['L2', '12s', '#10b981', 'Beginner — more time'], ['L3', '9s', '#f59e0b', 'Intermediate'], ['L4', '6s', '#ef4444', 'Advanced — fast pace']].map(([l, t, c, d]) => (
          <div key={l} style={{ padding: '6px 14px', borderRadius: 99, background: c + '18', border: `1.5px solid ${c}40`, fontSize: 12, fontWeight: 700, color: c }}>
            {l} · {t}/turn · {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {PRACTICE_EXERCISES.map(sc => (
          <button key={sc.id} onClick={() => startScenario(sc)} style={{
            background: 'var(--surface)', border: '2px solid var(--border)',
            borderRadius: 20, padding: '20px', textAlign: 'left', cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-400)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{DOMAIN_EMOJI[sc.domain] ?? '📋'}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                  background: sc.level === 'L2' ? '#ecfdf5' : sc.level === 'L3' ? '#fffbeb' : '#fef2f2',
                  color: sc.level === 'L2' ? '#059669' : sc.level === 'L3' ? '#d97706' : '#dc2626',
                }}>{sc.level}</span>
                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'var(--surface-alt)', color: 'var(--text-muted)' }}>
                  {DIFFICULTY_TIMES[sc.level]}s/turn
                </span>
              </div>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{sc.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>{sc.description}</p>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              {sc.script.length} turns · {sc.keyFacts.length} key facts to capture
            </div>
          </button>
        ))}
      </div>
    </main>
  )

  // Briefing screen
  if (phase === 'briefing' && scenario) return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px 100px' }}>
      <div className="card" style={{ borderTop: '4px solid var(--brand-500)', padding: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{scenario.title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>{scenario.description}</p>

        <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>Briefing — Key Facts to Capture</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
          {scenario.keyFacts.map(f => (
            <div key={f.label} style={{ background: 'var(--surface-alt)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-600)' }}>[ to be captured ]</div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--warning-bg)', border: '1.5px solid #fde68a', borderRadius: 14, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#92400e', lineHeight: 1.6,
        }}>
          ⏱️ You have <strong>{autoSeconds} seconds</strong> per interpretation turn (Level {scenario.level}). The call will auto-start recording when your turn comes. Speak clearly in Amharic.
        </div>

        <button onClick={startCall} style={{
          width: '100%', padding: '16px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#fff', border: 'none', borderRadius: 16, fontWeight: 800, fontSize: 16,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
        }}>
          <Play size={20} /> Begin Mock Call
        </button>
        <button onClick={() => setPhase('select')} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 8 }}>
          ← Back to scenarios
        </button>
      </div>
    </main>
  )

  // Call in progress
  if (phase === 'call' && scenario) {
    const currentLine = scenario.script[lineIdx] ?? ''
    const speaker = currentLine.split(':')[0]?.trim() ?? ''
    const text = currentLine.includes(':') ? currentLine.split(':').slice(1).join(':').trim() : currentLine
    const progress = ((lineIdx + 1) / scenario.script.length) * 100

    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 100px' }}>
        {/* Hidden recorder */}
        <div style={{ display: 'none' }}>
          <Recorder ref={recorderRef} onRecorded={handleRecorded} />
        </div>

        {/* Call header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1f3e, #2d2f5e)',
          borderRadius: 20, padding: '16px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 2 }}>MOCK CALL IN PROGRESS</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{scenario.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 10, height: 10, background: '#10b981', borderRadius: '50%', animation: 'pulse-dot 1.5s infinite', alignSelf: 'center' }} />
            <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 700 }}>LIVE</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: 'var(--surface-alt)', borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-500), #10b981)', borderRadius: 99, transition: 'width 0.5s ease' }} />
        </div>

        {/* Current line */}
        <div className="card" style={{ marginBottom: 16, borderLeft: `4px solid ${userTurns.includes(lineIdx) ? '#ef4444' : 'var(--brand-500)'}`, padding: '20px 20px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
            {speaker} is speaking:
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {isPlayingLine ? (
              <span style={{ color: 'var(--brand-600)' }}>{text}</span>
            ) : (
              text
            )}
          </div>
          {isPlayingLine && (
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, background: 'var(--brand-400)', borderRadius: '50%', animation: `bounce-dot 0.8s ${i*0.15}s infinite` }} />
              ))}
              <span style={{ fontSize: 12, color: 'var(--brand-500)', marginLeft: 4, fontWeight: 600 }}>Speaking…</span>
            </div>
          )}
        </div>

        {/* User turn — countdown */}
        {waitingUser && (
          <div className="animate-bounceIn card" style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: 20, padding: '20px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>YOUR TURN — interpret in Amharic</div>
            <div style={{
              fontSize: 52, fontWeight: 900,
              color: countdown <= 3 ? '#dc2626' : '#d97706',
              lineHeight: 1, marginBottom: 8,
              animation: countdown <= 3 ? 'pulse-scale 0.5s infinite' : 'none',
            }}>
              {countdown}
            </div>
            <div style={{ fontSize: 12, color: '#92400e' }}>Recording starts automatically…</div>
            <button onClick={() => { if (countdownRef.current) clearInterval(countdownRef.current); startRecording(lineIdx) }}
              style={{ marginTop: 14, padding: '10px 24px', background: '#dc2626', border: 'none', borderRadius: 99, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Mic size={16} /> Interpret Now
            </button>
          </div>
        )}

        {/* Recording */}
        {isRecording && (
          <div className="animate-bounceIn" style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 20, padding: '20px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 12, height: 12, background: '#dc2626', borderRadius: '50%', animation: 'pulse-dot 1s infinite' }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>Recording…</span>
            </div>
            <p style={{ fontSize: 13, color: '#7f1d1d', marginBottom: 14 }}>Speak your Amharic interpretation now</p>
            <button onClick={() => stopRecording(lineIdx)} style={{ padding: '10px 24px', background: '#dc2626', border: 'none', borderRadius: 99, color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MicOff size={16} /> Done
            </button>
          </div>
        )}

        {/* Evaluating */}
        {isEvaluating && (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--brand-600)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <Loader2 size={18} style={{ animation: 'spin-slow 1s linear infinite' }} /> {statusMsg || 'Evaluating your interpretation…'}
          </div>
        )}

        {/* Recent score */}
        {results.length > 0 && !isRecording && !isEvaluating && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 14, background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ScoreBadge score={results[results.length - 1].score} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {results[results.length - 1].feedback?.slice(0, 70)}{(results[results.length - 1].feedback?.length ?? 0) > 70 ? '…' : ''}
            </span>
          </div>
        )}

        {/* Key facts panel */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
            📋 Key Facts {factsRevealed.size}/{scenario.keyFacts.length} captured
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {scenario.keyFacts.map((f, fi) => (
              <div key={fi} style={{
                padding: '8px 10px', borderRadius: 10,
                background: factsRevealed.has(fi) ? 'var(--success-bg)' : 'var(--surface-alt)',
                border: `1px solid ${factsRevealed.has(fi) ? '#6ee7b7' : 'var(--border)'}`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{f.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: factsRevealed.has(fi) ? '#059669' : 'var(--text-muted)', fontStyle: factsRevealed.has(fi) ? 'normal' : 'italic' }}>
                  {factsRevealed.has(fi) ? f.value : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html:`
          @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes bounce-dot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
          @keyframes spin-slow { from{transform:rotate(0)} to{transform:rotate(360deg)} }
          @keyframes pulse-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        `}} />
      </main>
    )
  }

  // Review screen
  if (phase === 'review' && scenario) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px 100px' }}>
        {/* Score hero */}
        <div className="card animate-bounceIn" style={{ textAlign: 'center', padding: '36px 24px', marginBottom: 20, background: 'linear-gradient(135deg, #1e1f3e, #2d2f5e)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Mock Call Complete
          </div>
          <div style={{ fontSize: 42, marginBottom: 8 }}>
            {avgScore >= 85 ? '🏆' : avgScore >= 70 ? '🔥' : avgScore >= 55 ? '👍' : '💪'}
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, color: avgScore >= 80 ? '#34d399' : avgScore >= 60 ? '#fbbf24' : '#f87171', marginBottom: 4 }}>
            {avgScore}%
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
            {results.length} turns interpreted · +{totalXP} XP earned
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={startCall} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={16} /> Retry
            </button>
            <button onClick={resetAll} style={{ padding: '12px 24px', background: '#6366f1', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              New Scenario <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Key facts captured */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Key Facts Captured ({factsRevealed.size}/{scenario.keyFacts.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {scenario.keyFacts.map((f, fi) => (
              <div key={fi} style={{ padding: '10px 12px', borderRadius: 12, background: factsRevealed.has(fi) ? 'var(--success-bg)' : 'var(--danger-bg)', border: `1.5px solid ${factsRevealed.has(fi) ? '#6ee7b7' : '#fca5a5'}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: factsRevealed.has(fi) ? '#059669' : '#dc2626' }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-turn breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Turn-by-Turn Review
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map((r, i) => (
              <div key={i} style={{ borderLeft: `4px solid ${r.score >= 80 ? '#10b981' : r.score >= 60 ? '#f59e0b' : '#ef4444'}`, paddingLeft: 12, paddingBottom: 10, borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Turn {i + 1}</span>
                  <ScoreBadge score={r.score} />
                  {r.score >= 80 ? <CheckCircle2 size={14} color="#10b981" /> : r.score >= 60 ? <AlertCircle size={14} color="#f59e0b" /> : <XCircle size={14} color="#ef4444" />}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 3 }}>{r.line}</div>
                {r.transcript && <div style={{ fontSize: 12, color: 'var(--brand-600)', fontStyle: 'italic', marginBottom: 3 }}>You said: "{r.transcript}"</div>}
                {r.feedback && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.feedback}</div>}
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return null
}
