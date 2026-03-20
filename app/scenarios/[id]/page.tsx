'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layers, ChevronLeft, Mic2, Volume2, CheckCircle, ArrowRight, XCircle, Loader2, EyeOff, Ear } from 'lucide-react'
import Recorder, { RecorderRef } from '../../../components/Recorder'
import ScoreRing from '../../../components/ui/ScoreRing'
import confetti from 'canvas-confetti'
import { playSound } from '../../../src/lib/audio'

type ScenarioTurn = {
  id: string
  turn_order: number
  speaker: string
  source_language: string
  source_text: string
  target_reference_text?: string
}

type Scenario = {
  id: string
  title: string
  level?: string
  topic?: string
  scenario_turns: ScenarioTurn[]
}

function getEncouragement(score: number) {
  if (score >= 95) return '🎉 Flawless! Perfect!'
  if (score >= 80) return '🔥 Great job! Very close.'
  if (score >= 50) return '👍 Good effort, keep practicing!'
  return '💪 Don\'t give up! Try again.'
}

function statusBadgeClass(status: string) {
  if (status === 'Exact match' || status === 'Very close' || status === 'Exact Match') return 'badge badge-success'
  if (status === 'Close match' || status === 'Close Match') return 'badge badge-info'
  if (status === 'Partial match' || status === 'Partial Match') return 'badge badge-warning'
  return 'badge badge-danger'
}

export default function ScenarioPlayerPage() {
  const { id } = useParams()
  const router = useRouter()
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [currentTurnIdx, setCurrentTurnIdx] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [aiFeedback, setAiFeedback] = useState('')
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [matchStatus, setMatchStatus] = useState('')

  const [practiceMode, setPracticeMode] = useState<'interpretation' | 'recall'>('interpretation')
  const [isTextHidden, setIsTextHidden] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // We track results for all turns to show a final summary
  const [turnResults, setTurnResults] = useState<Array<{ score: number; feedback: string; transcription: string }>>([])
  
  const recorderRef = useRef<RecorderRef>(null)
  const autoEvalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFinished = scenario && currentTurnIdx >= scenario.scenario_turns.length

  const handleScoreCelebration = (score: number) => {
    if (score >= 90) {
      playSound('perfect')
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
    } else if (score >= 70) {
      playSound('success')
    } else if (score >= 40) {
      playSound('neutral')
    } else {
      playSound('tryAgain')
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/scenarios?id=${id}`)
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to load scenario')
        setScenario(result.scenario)
        setTurnResults(new Array(result.scenario.scenario_turns.length).fill(null))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  const currentTurn = scenario?.scenario_turns[currentTurnIdx]

  const recordedAudioUrl = useMemo(() => {
    if (!recordedBlob) return ''
    return URL.createObjectURL(recordedBlob)
  }, [recordedBlob])

  // Cleanup blob urls
  useEffect(() => () => { if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl) }, [recordedAudioUrl])

  const speakEnglish = (text: string, rate: number = 1.0, onStart?: () => void, onEnd?: () => void) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    synth.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-US'
    utt.rate = rate
    if (onStart) utt.onstart = onStart
    if (onEnd) utt.onend = onEnd
    synth.speak(utt)
  }

  const handleTranscribeAndEvaluate = async () => {
    if (!recordedBlob || !currentTurn) return
    setIsChecking(true)
    setTranscription(''); setAiFeedback(''); setMatchScore(null); setMatchStatus('')
    
    try {
      // 1. Transcribe (assume Amharic if translating, else English)
      // For MVP, scenario direction is mostly EN -> AM. 
      // We will parse the audio just like glossary interpretation
      const form = new FormData()
      form.append('file', new File([recordedBlob], 'recording.webm', { type: 'audio/webm' }))
      
      if (practiceMode === 'recall') {
        form.append('expectedLanguage', 'en')
      }
      
      const transRes = await fetch('/api/transcribe', { method: 'POST', body: form })
      const transResult = await transRes.json()
      if (!transRes.ok) throw new Error(transResult.error || 'Transcription failed.')
      const text = transResult.text || ''
      setTranscription(text)

      // 2. Evaluate using Interpretation Endpoint or Recall Endpoint
      const endpoint = practiceMode === 'recall' ? '/api/evaluate-recall' : '/api/evaluate-interpretation'
      const payload = practiceMode === 'recall' 
        ? { sourceText: currentTurn.source_text, spokenText: text }
        : { englishText: currentTurn.source_text, amharicText: text }

      const evalRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const evalResult = await evalRes.json()
      if (!evalRes.ok) throw new Error(evalResult.error || 'Evaluation failed')
      
      const { score, status, feedback } = evalResult.evaluation
      setMatchScore(score); setMatchStatus(status); setAiFeedback(feedback)
      handleScoreCelebration(score)
      
      // Save result to local state
      const newResults = [...turnResults]
      newResults[currentTurnIdx] = { score, feedback, transcription: text }
      setTurnResults(newResults)
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown evaluation error')
    } finally {
      setIsChecking(false)
    }
  }

  // Auto-evaluate when blob changes in any mode
  useEffect(() => {
    if (recordedBlob && matchScore === null && !isChecking) {
      if (autoEvalTimeoutRef.current) clearTimeout(autoEvalTimeoutRef.current)
      autoEvalTimeoutRef.current = setTimeout(() => {
        handleTranscribeAndEvaluate()
      }, 500) // slight delay to ensure UI updates and Blob is fully ready
    }
    return () => { if (autoEvalTimeoutRef.current) clearTimeout(autoEvalTimeoutRef.current) }
  }, [recordedBlob, matchScore, isChecking])

  const nextTurn = () => {
    setRecordedBlob(null)
    setTranscription(''); setAiFeedback(''); setMatchScore(null); setMatchStatus('')
    setIsTextHidden(false)
    setIsPlayingAudio(false)
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current)
    setCurrentTurnIdx(idx => idx + 1)
  }

  if (loading) {
    return <main style={{ padding: '40px', textAlign: 'center' }}>Loading Scenario…</main>
  }
  if (error || !scenario) {
    return <main style={{ padding: '40px', color: 'var(--danger)', textAlign: 'center' }}>{error || 'Scenario not found'}</main>
  }
  if (scenario.scenario_turns.length === 0) {
    return <main style={{ padding: '40px', textAlign: 'center' }}>This scenario has no turns to practice.</main>
  }

  // Final Summary Screen
  if (isFinished) {
    const totalScore = turnResults.reduce((sum, r) => sum + (r?.score || 0), 0)
    const avgScore = Math.round(totalScore / scenario.scenario_turns.length)
    return (
      <main style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
        <div className="card animate-in" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CheckCircle size={48} color="var(--success)" style={{ display: 'inline-block', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Scenario Complete!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>You've finished practicing "{scenario.title}"</p>
          
          <div style={{ margin: '30px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average {practiceMode === 'interpretation' ? 'Interpretation' : 'Recall'} Score</span>
            <ScoreRing score={avgScore} size={100} strokeWidth={8} />
          </div>

          <button onClick={() => router.push('/scenarios')} className="btn btn-secondary" style={{ marginTop: '20px' }}>
            <ChevronLeft size={16} /> Back to Scenarios
          </button>
        </div>
      </main>
    )
  }

  const turnNumber = currentTurnIdx + 1
  const totalTurns = scenario.scenario_turns.length
  const progressPercent = (currentTurnIdx / totalTurns) * 100

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <button onClick={() => router.push('/scenarios')} className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }} title="Back">
          <ChevronLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--brand-500)" /> {scenario.title}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Turn {turnNumber} of {totalTurns}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: '6px', background: 'var(--surface-alt)', borderRadius: '3px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '100%', background: 'var(--brand-500)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ background: 'var(--surface-alt)', padding: '4px', borderRadius: 'var(--radius-full)', display: 'inline-flex' }}>
          <button 
            onClick={() => { setPracticeMode('interpretation'); setIsTextHidden(false); }}
            className={`btn btn-sm ${practiceMode === 'interpretation' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            Interpretation
          </button>
          <button 
            onClick={() => setPracticeMode('recall')}
            className={`btn btn-sm ${practiceMode === 'recall' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            Exact Recall
          </button>
        </div>
      </div>

      {/* Source Turn Display */}
      <div className="card animate-in" style={{ marginBottom: '24px', borderLeft: '4px solid var(--brand-400)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span className="badge badge-brand">{currentTurn?.speaker}</span>
          
          <button 
            onClick={() => {
              if (isPlayingAudio) return;
              setRecordedBlob(null);
              setTranscription(''); setAiFeedback(''); setMatchScore(null); setMatchStatus('');
              setIsTextHidden(false);
              
              speakEnglish(
                currentTurn?.source_text || '', 
                practiceMode === 'recall' ? 0.8 : 1.0, 
                () => setIsPlayingAudio(true),
                () => { 
                  setIsPlayingAudio(false); 
                  if (practiceMode === 'recall') setIsTextHidden(true); 
                  
                  // Auto-start recording
                  if (recorderRef.current) {
                    recorderRef.current.startRecording();
                    
                    // Auto-stop after expected speaking time
                    const textLen = currentTurn?.source_text?.length || 0;
                    const isInterpret = practiceMode === 'interpretation';
                    // Interpret takes longer (listening, thinking, translating, speaking) -> ~150ms/char, Base 4s
                    // Recall is faster -> ~80ms/char, Base 3s
                    const targetDurationMs = isInterpret 
                      ? Math.max(4000, textLen * 150)
                      : Math.max(3000, textLen * 80);
                    
                    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current)
                    recordingTimeoutRef.current = setTimeout(() => {
                      if (recorderRef.current) recorderRef.current.stopRecording()
                    }, targetDurationMs)
                  }
                }
              )
            }} 
            className="btn btn-primary btn-sm"
            disabled={isPlayingAudio}
          >
            {isPlayingAudio ? <><Volume2 className="animate-pulse" size={16} /> Listening...</> : <><Ear size={16} /> Listen & Practice</>}
          </button>
        </div>
        
        {practiceMode === 'recall' && isTextHidden ? (
          <div style={{ padding: '20px', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
            <EyeOff size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Text is hidden for recall practice.</p>
            <button onClick={() => setIsTextHidden(false)} className="btn btn-ghost btn-sm" style={{ marginTop: '8px' }}>Show Text</button>
          </div>
        ) : (
          <p style={{ fontSize: '18px', fontWeight: 500, lineHeight: 1.5, color: 'var(--text-primary)' }}>
            {currentTurn?.source_text}
          </p>
        )}
      </div>

      {/* Target Translation / Practice area */}
      <div className="card" style={{ background: 'var(--surface-alt)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>
          {practiceMode === 'interpretation' ? 'Your Interpretation' : 'Your Recall'}
        </h3>

        {!recordedAudioUrl ? (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Recorder ref={recorderRef} onRecorded={setRecordedBlob} />
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <audio controls src={recordedAudioUrl} style={{ width: '100%', maxWidth: '400px', height: '40px' }} />
            
            {matchScore === null ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setRecordedBlob(null)} className="btn btn-secondary" disabled={isChecking}>
                  <XCircle size={16} /> Retake
                </button>
                <button onClick={handleTranscribeAndEvaluate} className="btn btn-primary" disabled={isChecking}>
                  {isChecking ? <><Loader2 size={16} className="animate-spin" /> Evaluating…</> : <><Mic2 size={16} /> {practiceMode === 'interpretation' ? 'Score My Interpretation' : 'Score My Recall'}</>}
                </button>
              </div>
            ) : (
              <div className="animate-bounceIn" style={{ width: '100%', background: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <ScoreRing score={matchScore} size={80} strokeWidth={6} />
                    <span className={statusBadgeClass(matchStatus)} style={{ fontSize: '11px', padding: '3px 8px' }}>{matchStatus}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brand-700)', marginBottom: '8px' }}>
                      {getEncouragement(matchScore)}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>YOU SAID:</p>
                    <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', fontStyle: 'italic' }}>"{transcription}"</p>
                    
                    <div style={{ padding: '12px', background: 'var(--brand-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-100)' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-600)', marginBottom: '4px' }}>AI FEEDBACK:</p>
                      <p style={{ fontSize: '13.5px', color: 'var(--brand-900)', lineHeight: 1.4 }}>{aiFeedback}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button onClick={nextTurn} className="btn btn-primary btn-lg">
                    {turnNumber === totalTurns ? 'Finish Scenario' : 'Next Turn'} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
