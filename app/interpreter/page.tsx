'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Headphones, Play, Square, SkipForward, Mic, Activity, CheckCircle2, ChevronRight, RotateCcw, MicOff, Loader2 } from 'lucide-react'
import { PRACTICE_EXERCISES, Scenario } from '../../src/lib/scenarios'
import Recorder, { RecorderRef } from '../../components/Recorder'
import ScoreRing from '../../components/ui/ScoreRing'

type Mode = 'consecutive' | 'shadowing'

function getEncouragement(score: number) {
  if (score >= 95) return '🎉 Excellent interpretation!'
  if (score >= 80) return '🔥 Great job! Near-perfect.'
  if (score >= 60) return '👍 Good effort, keep going!'
  return '💪 Practice makes perfect!'
}

export default function InterpreterSimPage() {
  const [activeEx, setActiveEx] = useState<Scenario | null>(null)
  const [mode, setMode] = useState<Mode>('consecutive')
  const [index, setIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [waitingForUser, setWaitingForUser] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [voicePairs, setVoicePairs] = useState<Record<string, SpeechSynthesisVoice | null>>({})
  const [hasVoices, setHasVoices] = useState(false)
  const [pauseTime, setPauseTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Voice evaluation state
  const [isRecording, setIsRecording] = useState(false)
  const [evalScore, setEvalScore] = useState<number | null>(null)
  const [evalFeedback, setEvalFeedback] = useState('')
  const [evalStatus, setEvalStatus] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [turnScores, setTurnScores] = useState<number[]>([])
  const recorderRef = useRef<RecorderRef>(null)
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) setHasVoices(true)
    }
    window.speechSynthesis.onvoiceschanged = loadVoices
    loadVoices()
  }, [])

  const startScenario = (ex: Scenario) => {
    setActiveEx(ex)
    setIndex(0)
    setPlaying(false)
    setWaitingForUser(false)
    setEvalScore(null)
    setEvalFeedback('')
    setEvalStatus('')
    setTurnScores([])
    window.speechSynthesis.cancel()
    const speakers = Array.from(new Set(ex.script.map(l => l.split(':')[0])))
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
    const pair: Record<string, SpeechSynthesisVoice | null> = {}
    speakers.forEach((sp, i) => { pair[sp] = voices[i % voices.length] || null })
    setVoicePairs(pair)
  }

  const stopRecordingAndEvaluate = useCallback(async (englishLine: string) => {
    if (!recorderRef.current) return
    setIsRecording(false)
    if (recordingTimeout.current) clearTimeout(recordingTimeout.current)
    // stopRecording triggers onRecorded callback
    recorderRef.current.stopRecording()
  }, [])

  const evaluateBlob = useCallback(async (blob: Blob, englishLine: string) => {
    setIsEvaluating(true)
    setEvalStatus('Evaluating your interpretation…')
    try {
      const form = new FormData()
      form.append('file', new File([blob], 'recording.webm', { type: 'audio/webm' }))
      form.append('expectedLanguage', 'am')
      const transRes = await fetch('/api/transcribe', { method: 'POST', body: form })
      const transData = await transRes.json()
      const amharicText = transData.text || ''

      if (!amharicText) {
        setEvalStatus('Could not transcribe — try again')
        setIsEvaluating(false)
        return
      }

      const evalRes = await fetch('/api/evaluate-interpretation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ englishText: englishLine, amharicText }),
      })
      const evalData = await evalRes.json()
      const { score, feedback } = evalData.evaluation || { score: 0, feedback: '' }
      setEvalScore(score)
      setEvalFeedback(feedback)
      setEvalStatus('Evaluation complete')
      setTurnScores(prev => [...prev, score])
    } catch (e) {
      setEvalStatus('Evaluation failed — continue to next line')
    } finally {
      setIsEvaluating(false)
    }
  }, [])

  const playLine = useCallback((lineIndex: number) => {
    if (!activeEx || lineIndex >= activeEx.script.length) {
      setIndex(activeEx?.script.length || 0); setPlaying(false); return
    }
    setIndex(lineIndex)
    setEvalScore(null)
    setEvalFeedback('')
    setEvalStatus('')
    const line = activeEx.script[lineIndex]
    const [speaker, ...rest] = line.split(':')
    const text = rest.join(':').trim()

    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = speed
    if (voicePairs[speaker]) utt.voice = voicePairs[speaker]!
    utt.onstart = () => { setPlaying(true); setWaitingForUser(false) }
    utt.onend = () => {
      setPlaying(false)
      if (mode === 'consecutive') {
        setWaitingForUser(true)
        setPauseTime(0)
        timerRef.current = setInterval(() => setPauseTime(p => p + 1), 1000)
        // Auto-start recording
        setIsRecording(true)
        setEvalStatus('Recording your interpretation…')
        setTimeout(() => {
          recorderRef.current?.startRecording()
          // Auto-stop after 10s max
          recordingTimeout.current = setTimeout(() => {
            stopRecordingAndEvaluate(text)
          }, 10000)
        }, 400)
      } else {
        setTimeout(() => playLine(lineIndex + 1), 1500)
      }
    }
    synthRef.current = utt
    window.speechSynthesis.speak(utt)
  }, [activeEx, mode, speed, voicePairs, stopRecordingAndEvaluate])

  const togglePlay = () => {
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
    } else {
      playLine(index >= 0 ? index : 0)
    }
  }

  const nextAction = () => {
    // If still recording, stop and evaluate first
    if (isRecording) {
      const currentLine = activeEx?.script[index] || ''
      const text = currentLine.split(':').slice(1).join(':').trim()
      stopRecordingAndEvaluate(text)
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setWaitingForUser(false)
    setIsRecording(false)
    setEvalScore(null)
    setEvalFeedback('')
    setEvalStatus('')
    playLine(index + 1)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && activeEx) {
        e.preventDefault()
        if (waitingForUser || playing) nextAction()
        else togglePlay()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeEx, waitingForUser, playing, index, isRecording])

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const avgScore = turnScores.length > 0 ? Math.round(turnScores.reduce((a, b) => a + b, 0) / turnScores.length) : null

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Activity size={26} color="var(--brand-500)" /> Interpreter Simulator
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>
          Listen → interpret into Amharic → get AI scored automatically.
        </p>
      </div>

      {!activeEx ? (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Choose a Scenario</h2>
            <div style={{ fontSize: 13, color: hasVoices ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Headphones size={14} /> {hasVoices ? 'Audio Engine Ready' : 'Loading Audio…'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {PRACTICE_EXERCISES.map(ex => (
              <div key={ex.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{ex.title.split(' ')[0]}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{ex.title.slice(3)}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16, flex: 1 }}>{ex.description}</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--surface-alt)', borderRadius: 99, color: 'var(--text-muted)' }}>
                    {Math.round(ex.script.join(' ').split(' ').length / 130)} min
                  </span>
                  <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--brand-50)', borderRadius: 99, color: 'var(--brand-600)' }}>
                    {ex.script.length} turns
                  </span>
                  <span style={{ fontSize: 12, padding: '2px 8px', background: '#ecfdf5', borderRadius: 99, color: '#059669' }}>
                    🎤 AI Scored
                  </span>
                </div>
                <button onClick={() => startScenario(ex)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Start Simulator →
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="animate-in">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <button onClick={() => setActiveEx(null)} className="btn btn-ghost btn-sm" style={{ padding: 0, color: 'var(--brand-600)', marginBottom: 8 }}>← Back</button>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{activeEx.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{activeEx.script.length} turns · {mode === 'consecutive' ? 'Consecutive' : 'Shadowing'}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, background: 'var(--surface-alt)', padding: 4, borderRadius: 12 }}>
              {(['consecutive', 'shadowing'] as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)} className="btn btn-sm"
                  style={{ background: mode === m ? 'var(--surface)' : 'transparent', boxShadow: mode === m ? 'var(--shadow-sm)' : 'none', color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 24 }}>
            {/* Main panel */}
            <div className="card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'var(--surface-alt)', border: 'none' }}>
              {index === -1 && !playing && (
                <div style={{ maxWidth: 400, margin: '40px auto' }}>
                  <Mic size={48} color="var(--brand-500)" style={{ marginBottom: 20 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Ready to Interpret?</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                    {mode === 'consecutive'
                      ? 'The AI speaks one turn, then automatically records your Amharic interpretation and evaluates it with AI.'
                      : 'The AI speaks continuously. Shadow out loud to practice rhythm and fluency.'}
                  </p>
                  <button onClick={togglePlay} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                    <Play size={18} /> Begin Scenario
                  </button>
                </div>
              )}

              {index >= 0 && index < activeEx.script.length && (
                <div style={{ width: '100%' }}>
                  {/* Speaker badge */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'var(--brand-100)', color: 'var(--brand-700)', borderRadius: 99, fontWeight: 700, fontSize: 13, marginBottom: 20 }}>
                    <Headphones size={14} />
                    {activeEx.script[index].split(':')[0]}
                  </div>

                  {/* Subtitle */}
                  <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    {(waitingForUser || mode === 'shadowing') ? (
                      <p className="animate-in" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                        "{activeEx.script[index].split(':').slice(1).join(':').trim()}"
                      </p>
                    ) : (
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="audio-wave" /> Listening…
                      </div>
                    )}
                  </div>

                  {/* Recording state */}
                  {waitingForUser && (
                    <div style={{ marginBottom: 16 }}>
                      {isRecording && !isEvaluating ? (
                        <div className="animate-bounceIn" style={{ background: '#fef2f2', border: '2px solid #fca5a5', padding: '14px 20px', borderRadius: 16, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#dc2626', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                            <div style={{ width: 10, height: 10, background: '#dc2626', borderRadius: '50%', animation: 'pulse-dot 1s infinite' }} />
                            Recording Your Interpretation
                          </div>
                          <div style={{ color: '#7f1d1d', fontFamily: 'monospace', fontSize: 15 }}>
                            ⏱ {Math.floor(pauseTime / 60)}:{String(pauseTime % 60).padStart(2, '0')} · Speak in Amharic
                          </div>
                        </div>
                      ) : isEvaluating ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--brand-600)', fontWeight: 600, marginBottom: 12 }}>
                          <Loader2 size={18} className="animate-spin" /> {evalStatus}
                        </div>
                      ) : evalScore !== null ? (
                        <div className="animate-bounceIn" style={{ marginBottom: 12 }}>
                          <ScoreRing score={evalScore} size={80} label="Your Score" />
                          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, color: evalScore >= 80 ? '#059669' : evalScore >= 60 ? '#d97706' : '#dc2626' }}>
                            {getEncouragement(evalScore)}
                          </div>
                          {evalFeedback && (
                            <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--brand-50)', border: '1px solid var(--brand-200)', borderRadius: 12, fontSize: 13, color: 'var(--brand-800)', lineHeight: 1.5, textAlign: 'left' }}>
                              <span style={{ fontWeight: 700, color: 'var(--brand-600)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>🤖 AI Feedback</span>
                              {evalFeedback}
                            </div>
                          )}
                        </div>
                      ) : evalStatus ? (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{evalStatus}</div>
                      ) : null}
                    </div>
                  )}

                  {/* Hidden recorder — triggered programmatically */}
                  <div style={{ display: 'none' }}>
                    <Recorder
                      ref={recorderRef}
                      onRecorded={blob => {
                        const currentLine = activeEx?.script[index] || ''
                        const text = currentLine.split(':').slice(1).join(':').trim()
                        evaluateBlob(blob, text)
                      }}
                    />
                  </div>

                  {/* Controls */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => playLine(index)} className="btn btn-secondary btn-lg" style={{ minWidth: 130, justifyContent: 'center' }}>
                      <RotateCcw size={16} /> Replay
                    </button>
                    {waitingForUser && (
                      <>
                        {isRecording && (
                          <button onClick={() => {
                            const currentLine = activeEx?.script[index] || ''
                            const text = currentLine.split(':').slice(1).join(':').trim()
                            stopRecordingAndEvaluate(text)
                          }} className="btn btn-lg" style={{ minWidth: 160, justifyContent: 'center', background: '#dc2626', color: '#fff', border: 'none' }}>
                            <MicOff size={16} /> Done Speaking
                          </button>
                        )}
                        {!isRecording && (
                          <button onClick={nextAction} className="btn btn-primary btn-lg" style={{ minWidth: 160, justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
                            Next Line <ChevronRight size={18} />
                          </button>
                        )}
                      </>
                    )}
                    {!waitingForUser && playing && (
                      <button onClick={togglePlay} className="btn btn-secondary btn-lg" style={{ minWidth: 130, justifyContent: 'center' }}>
                        <Square size={16} /> Stop
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                    Press <kbd style={{ padding: '2px 6px', background: 'var(--surface)', borderRadius: 4, border: '1px solid var(--border)' }}>Space</kbd> to {waitingForUser ? 'move to next' : 'play/pause'}
                  </p>
                </div>
              )}

              {index >= activeEx.script.length && (
                <div className="animate-bounceIn" style={{ padding: '40px 0' }}>
                  <CheckCircle2 size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Scenario Complete!</h3>
                  {avgScore !== null && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 40, fontWeight: 800, color: avgScore >= 80 ? '#10b981' : avgScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                        {avgScore}%
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Average interpretation score across {turnScores.length} turns</div>
                    </div>
                  )}
                  <button onClick={() => startScenario(activeEx)} className="btn btn-primary btn-lg"><RotateCcw size={16} /> Run Again</button>
                </div>
              )}
            </div>

            {/* Side panel */}
            <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: 20 }}>
              {/* Turn scores */}
              {turnScores.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Turn Scores</h3>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {turnScores.map((s, i) => (
                      <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2', border: `2px solid ${s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: s >= 80 ? '#059669' : s >= 60 ? '#d97706' : '#dc2626' }}>
                        {s}
                      </div>
                    ))}
                  </div>
                  {avgScore !== null && (
                    <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Session avg: <strong style={{ color: 'var(--brand-600)' }}>{avgScore}%</strong>
                    </div>
                  )}
                </div>
              )}

              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Key Facts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeEx.keyFacts.map((fact, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: 'var(--surface-alt)', borderRadius: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-600)', textTransform: 'uppercase', display: 'block' }}>{fact.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{fact.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  Speed <span>{speed}×</span>
                </label>
                <input type="range" min="0.75" max="1.5" step="0.25" value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </section>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .audio-wave {
          display: inline-block; width: 14px; height: 14px;
          border-radius: 50%; background: currentColor;
          animation: pulse 1.2s infinite ease-in-out;
        }
        @keyframes pulse { 0%{transform:scale(0.8);opacity:0.5} 50%{transform:scale(1.2);opacity:1} 100%{transform:scale(0.8);opacity:0.5} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @media (max-width: 640px) {
          main > section > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </main>
  )
}
