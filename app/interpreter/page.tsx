'use client'

import { useState, useRef, useEffect } from 'react'
import { Headphones, Play, Pause, Square, SkipForward, Clock, Settings, Mic, Activity, CheckCircle2, ChevronRight } from 'lucide-react'
import { PRACTICE_EXERCISES, Scenario } from '../../src/lib/scenarios'

type Mode = 'consecutive' | 'shadowing'

export default function InterpreterSimPage() {
  const [activeEx, setActiveEx] = useState<Scenario | null>(null)
  const [mode, setMode] = useState<Mode>('consecutive')
  const [index, setIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [waitingForUser, setWaitingForUser] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [voicePairs, setVoicePairs] = useState<Record<string, SpeechSynthesisVoice | null>>({})
  const [hasVoices, setHasVoices] = useState(false)
  
  // Timer state for consecutive pause length
  const [pauseTime, setPauseTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

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
    window.speechSynthesis.cancel()
    
    // Assign different voices automatically to different speakers if possible
    const speakers = Array.from(new Set(ex.script.map(l => l.split(':')[0])))
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
    const pair: Record<string, SpeechSynthesisVoice | null> = {}
    speakers.forEach((sp, i) => {
      pair[sp] = voices[i % voices.length] || null
    })
    setVoicePairs(pair)
  }

  const playLine = (lineIndex: number) => {
    if (!activeEx || lineIndex >= activeEx.script.length) {
      setIndex(-1); setPlaying(false); return
    }
    
    setIndex(lineIndex)
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
      } else {
        // Shadow mode: short pause then next line
        setTimeout(() => playLine(lineIndex + 1), 1500)
      }
    }
    
    synthRef.current = utt
    window.speechSynthesis.speak(utt)
  }

  const togglePlay = () => {
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
    } else {
      playLine(index >= 0 ? index : 0)
    }
  }

  const nextAction = () => {
    if (waitingForUser) {
      // User is done interpreting, clear timer and play next line
      if (timerRef.current) clearInterval(timerRef.current)
      setWaitingForUser(false)
      playLine(index + 1)
    } else {
      // Skip current playing line
      window.speechSynthesis.cancel()
      playLine(index + 1)
    }
  }

  // Spacebar binding
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
  }, [activeEx, waitingForUser, playing, index])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Activity size={26} color="var(--brand-500)" /> Interpreter Simulator
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>
          High-intensity audio drills for consecutive and simultaneous interpreting practice.
        </p>
      </div>

      {!activeEx ? (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Choose a Scenario</h2>
            <div style={{ fontSize: 13, color: hasVoices ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Headphones size={14} /> {hasVoices ? 'Audio Engine Ready' : 'Loading Audio...'}
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {PRACTICE_EXERCISES.map(ex => (
              <div key={ex.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{ex.title.split(' ')[0]}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{ex.title.slice(3)}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16, flex: 1 }}>{ex.description}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--surface-alt)', borderRadius: 99, color: 'var(--text-muted)' }}>
                    {Math.round(ex.script.join(' ').split(' ').length / 130)} min audio
                  </span>
                  <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--brand-50)', borderRadius: 99, color: 'var(--brand-600)' }}>
                    {ex.script.length} turns
                  </span>
                </div>
                <button onClick={() => startScenario(ex)} className="btn btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                  Start Simulator →
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="animate-in">
          {/* Active Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <button onClick={() => setActiveEx(null)} className="btn btn-ghost btn-sm" style={{ padding: 0, color: 'var(--brand-600)', marginBottom: 8 }}>← Back to Scenarios</button>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{activeEx.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{activeEx.script.length} turns · {mode === 'consecutive' ? 'Consecutive Mode' : 'Shadowing Mode'}</p>
            </div>
            
            <div style={{ display: 'flex', gap: 6, background: 'var(--surface-alt)', padding: 4, borderRadius: 12 }}>
              <button 
                onClick={() => setMode('consecutive')} 
                className="btn btn-sm"
                style={{ background: mode === 'consecutive' ? 'var(--surface)' : 'transparent', boxShadow: mode === 'consecutive' ? 'var(--shadow-sm)' : 'none', color: mode === 'consecutive' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                Consecutive
              </button>
              <button 
                onClick={() => setMode('shadowing')} 
                className="btn btn-sm"
                style={{ background: mode === 'shadowing' ? 'var(--surface)' : 'transparent', boxShadow: mode === 'shadowing' ? 'var(--shadow-sm)' : 'none', color: mode === 'shadowing' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                Shadowing
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1.5fr 1fr' : '1fr', gap: 24 }}>
            
            {/* Main Simulator Panel */}
            <div className="card" style={{ padding: window.innerWidth > 768 ? '40px' : '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'var(--surface-alt)', border: 'none' }}>
              
              {/* Instructions */}
              {index === -1 && !playing && !waitingForUser && (
                <div style={{ maxWidth: 400, margin: '40px auto' }}>
                  <Mic size={48} color="var(--brand-500)" style={{ marginBottom: 20 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Ready to Interpret?</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                    {mode === 'consecutive' 
                      ? 'The AI will speak one turn, then pause. You interpret into Amharic out loud. Press Spacebar to move to the next turn.'
                      : 'The AI will speak continuously with short pauses. Shadow the English out loud, or interpret simultaneously.'}
                  </p>
                  <button onClick={togglePlay} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                    <Play size={18} /> Begin Scenario
                  </button>
                </div>
              )}

              {/* Active Player */}
              {index >= 0 && index < activeEx.script.length && (
                <div style={{ width: '100%', padding: '20px 0' }}>
                  {/* Speaker Badge */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'var(--brand-100)', color: 'var(--brand-700)', borderRadius: 99, fontWeight: 700, fontSize: 13, marginBottom: 24 }}>
                    <Headphones size={14} />
                    {activeEx.script[index].split(':')[0]}
                  </div>
                  
                  {/* Subtitles (Only reveal if waiting or shadowing) */}
                  <div style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
                    {(waitingForUser || mode === 'shadowing') ? (
                      <p className="animate-in" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                        "{activeEx.script[index].split(':').slice(1).join(':').trim()}"
                      </p>
                    ) : (
                      <div className="pulse-text" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-muted)' }}>
                        Listening...
                      </div>
                    )}
                  </div>

                  {/* Status & Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    {waitingForUser ? (
                      <div className="animate-bounceIn" style={{ background: '#ecfdf5', border: '2px solid #6ee7b7', padding: '16px 24px', borderRadius: 16, width: '100%', maxWidth: 360 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#065f46', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                          <Mic size={20} /> Your Turn to Interpret
                        </div>
                        <div style={{ fontSize: 13, color: '#047857', fontFamily: 'monospace', fontSize: 16, fontWeight: 700 }}>
                          ⏱ {Math.floor(pauseTime / 60)}:{String(pauseTime % 60).padStart(2, '0')}
                        </div>
                      </div>
                    ) : playing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-500)', fontWeight: 700 }}>
                        <div className="audio-wave" /> Audio Playing
                      </div>
                    ) : null}

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button onClick={() => playLine(index)} className="btn btn-secondary btn-lg" style={{ minWidth: 140, justifyContent: 'center' }}>
                        <RotateCcw size={18} /> Replay Line
                      </button>
                      
                      {waitingForUser ? (
                        <button onClick={nextAction} className="btn btn-primary btn-lg" style={{ minWidth: 200, justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
                          Next Line <ChevronRight size={18} />
                        </button>
                      ) : (
                        <button onClick={togglePlay} className="btn btn-secondary btn-lg" style={{ minWidth: 140, justifyContent: 'center' }}>
                          <Square size={18} /> Stop
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Press <kbd style={{ padding: '2px 6px', background: 'var(--surface)', borderRadius: 4, border: '1px solid var(--border)' }}>Spacebar</kbd> to {waitingForUser ? 'continue' : 'play/pause'}</p>
                  </div>
                </div>
              )}

              {/* End of Scenario */}
              {index >= activeEx.script.length && (
                <div className="animate-bounceIn" style={{ padding: '40px 0' }}>
                  <CheckCircle2 size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Scenario Complete!</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Excellent work translating {activeEx.script.length} consecutive turns.</p>
                  <button onClick={() => startScenario(activeEx)} className="btn btn-primary btn-lg"><RotateCcw size={16} /> Run Again</button>
                </div>
              )}
            </div>

            {/* Side Panel: Key Facts Checklist */}
            <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Target Details
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Make sure you capture and correctly interpret these key facts during the scenario.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeEx.keyFacts.map((fact, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', background: 'var(--surface-alt)', borderRadius: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-600)', textTransform: 'uppercase' }}>{fact.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{fact.value}</span>
                  </div>
                ))}
              </div>
              
              {/* Settings */}
              <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px dashed var(--border)' }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Audio Settings
                </h3>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  Playback Speed <span>{speed}×</span>
                </label>
                <input 
                  type="range" 
                  min="0.75" max="1.5" step="0.25" 
                  value={speed} 
                  onChange={e => setSpeed(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Global CSS for wave animation */}
      <style dangerouslySetInnerHTML={{__html: `
        .audio-wave {
          display: inline-block;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 1.2s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
      `}} />
    </main>
  )
}
