'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Recorder, { RecorderRef } from '../../components/Recorder'
import ScoreRing from '../../components/ui/ScoreRing'
import { Search, Volume2, Mic2, ChevronRight, BookOpen, X, SlidersHorizontal, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { playSound } from '../../src/lib/audio'

type GlossaryEntry = {
  id: string
  english_term?: string
  amharic_term?: string
  definition?: string
  english_sentence?: string
  amharic_sentence?: string
  level?: string | null
  topic?: string | null
}

type ComparisonResult = {
  score: number
  status: string
  matchedWords: string[]
  missingWords: string[]
  extraWords: string[]
}

function normalizeText(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function compareTexts(expected: string, actual: string): ComparisonResult {
  const expectedNorm = normalizeText(expected)
  const actualNorm   = normalizeText(actual)

  if (!expectedNorm || !actualNorm) {
    return { score: 0, status: 'No match', matchedWords: [], missingWords: expectedNorm ? expectedNorm.split(' ') : [], extraWords: actualNorm ? actualNorm.split(' ') : [] }
  }
  if (expectedNorm === actualNorm) {
    const words = expectedNorm.split(' ')
    return { score: 100, status: 'Exact match', matchedWords: words, missingWords: [], extraWords: [] }
  }

  const expectedWords = expectedNorm.split(' ')
  const actualWords   = actualNorm.split(' ')
  const matchedWords  = expectedWords.filter(w => actualWords.includes(w))
  const missingWords  = expectedWords.filter(w => !actualWords.includes(w))
  const extraWords    = actualWords.filter(w => !expectedWords.includes(w))
  const score = Math.round((matchedWords.length / expectedWords.length) * 100)

  let status = 'Needs improvement'
  if (score >= 90) status = 'Very close'
  else if (score >= 70) status = 'Close match'
  else if (score >= 40) status = 'Partial match'

  return { score, status, matchedWords, missingWords, extraWords }
}

function statusBadgeClass(status: string) {
  if (status === 'Exact match' || status === 'Very close' || status === 'Exact Match') return 'badge badge-success'
  if (status === 'Close match' || status === 'Close Match') return 'badge badge-info'
  if (status === 'Partial match' || status === 'Partial Match') return 'badge badge-warning'
  return 'badge badge-danger'
}

function getEncouragement(score: number) {
  if (score >= 95) return '🎉 Flawless! Perfect!'
  if (score >= 80) return '🔥 Great job! Very close.'
  if (score >= 50) return '👍 Good effort, keep practicing!'
  return '💪 Don\'t give up! Try again.'
}

function LevelBadge({ level }: { level?: string | null }) {
  if (!level) return null
  return <span className="badge badge-brand">{level}</span>
}

function TopicBadge({ topic }: { topic?: string | null }) {
  if (!topic) return null
  return <span className="badge badge-muted">{topic}</span>
}

export default function GlossaryPage() {
  const [entries, setEntries]             = useState<GlossaryEntry[]>([])
  const [query, setQuery]                 = useState('')
  const [level, setLevel]                 = useState('')
  const [topic, setTopic]                 = useState('')
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [voicesReady, setVoicesReady]     = useState(false)
  const [autoSelectedMsg, setAutoSelectedMsg] = useState('')
  const [showFilters, setShowFilters]     = useState(false)

  const [practiceEntry, setPracticeEntry] = useState<GlossaryEntry | null>(null)
  const [practiceMode, setPracticeMode]   = useState<'term' | 'sentence' | 'interpret-term' | 'interpret-sentence'>('term')
  const [recordedBlob, setRecordedBlob]   = useState<Blob | null>(null)
  const [transcription, setTranscription] = useState('')
  const [transcriptionStatus, setTranscriptionStatus] = useState('')
  const [matchScore, setMatchScore]       = useState<number | null>(null)
  const [matchStatus, setMatchStatus]     = useState('')
  const [saveStatus, setSaveStatus]       = useState('')
  const [matchedWords, setMatchedWords]   = useState<string[]>([])
  const [missingWords, setMissingWords]   = useState<string[]>([])
  const [extraWords, setExtraWords]       = useState<string[]>([])
  const [aiFeedback, setAiFeedback]       = useState('')
  const [isChecking, setIsChecking]       = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const recorderRef = useRef<RecorderRef>(null)
  const autoEvalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const recordedAudioUrl = useMemo(() => {
    if (!recordedBlob) return ''
    return URL.createObjectURL(recordedBlob)
  }, [recordedBlob])

  const loadEntries = async (search = '', selLevel = '', selTopic = '') => {
    setLoading(true); setError(''); setAutoSelectedMsg('')
    try {
      const params = new URLSearchParams()
      if (search)  params.set('q', search)
      if (selLevel) params.set('level', selLevel)
      if (selTopic) params.set('topic', selTopic)
      const url = params.toString() ? `/api/glossary?${params}` : '/api/glossary'
      const res = await fetch(url)
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Failed to load glossary.'); setEntries([]); return }
      const loaded: GlossaryEntry[] = result.entries || []
      setEntries(loaded)
      if (search) {
        const searchNorm = normalizeText(search)
        const exact = loaded.filter(e => normalizeText(e.english_term || '') === searchNorm)
        const pick  = exact.length === 1 ? exact[0] : loaded.length === 1 ? loaded[0] : null
        if (pick) { startPractice(pick, 'term'); setAutoSelectedMsg(`Auto-selected "${pick.english_term}" for practice.`) }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error'); setEntries([])
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const term = params.get('term') || ''
    setQuery(term)
    loadEntries(term, '', '')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    const loadVoices = () => { if (synth.getVoices().length > 0) setVoicesReady(true) }
    loadVoices()
    synth.onvoiceschanged = loadVoices
    return () => { synth.onvoiceschanged = null }
  }, [])

  useEffect(() => () => { if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl) }, [recordedAudioUrl])

  const speakEnglish = (text: string, onStart?: () => void, onEnd?: () => void) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) { alert('Speech not supported.'); return }
    const synth = window.speechSynthesis
    const voices = synth.getVoices()
    if (!voices.length) { alert('Voices not ready yet. Try again.'); return }
    synth.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-US'; utt.rate = 0.8; utt.pitch = 1; utt.volume = 1
    const voice = voices.find(v => v.lang.toLowerCase().startsWith('en-us')) || voices.find(v => v.lang.toLowerCase().startsWith('en')) || null
    if (voice) utt.voice = voice
    if (onStart) utt.onstart = onStart
    if (onEnd) utt.onend = onEnd
    utt.onerror = () => {
      alert('Speech playback failed.')
      if (onEnd) onEnd()
    }
    synth.speak(utt)
  }

  const resetPracticeState = () => {
    setRecordedBlob(null); setTranscription(''); setTranscriptionStatus('')
    setMatchScore(null); setMatchStatus(''); setSaveStatus('')
    setMatchedWords([]); setMissingWords([]); setExtraWords([])
    setAiFeedback(''); setAutoSelectedMsg('')
  }

  const startPractice = (entry: GlossaryEntry, mode: 'term' | 'sentence' | 'interpret-term' | 'interpret-sentence') => {
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current)
    if (recorderRef.current && isPlayingAudio) recorderRef.current.stopRecording()
    setIsPlayingAudio(false)
    setPracticeEntry(entry); setPracticeMode(mode); resetPracticeState()
  }

  const saveAttempt = async (studyEntryId: string, spokenText: string, score: number, expectedText: string, status: string, practiceType: 'term' | 'sentence' | 'interpret-term' | 'interpret-sentence', aiFeedback?: string) => {
    try {
      const res = await fetch('/api/attempts/term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_entry_id: studyEntryId, spoken_text: spokenText, correctness_score: score, expected_term: expectedText, status, practice_type: practiceType, ai_feedback: aiFeedback }),
      })
      const result = await res.json()
      setSaveStatus(res.ok ? 'Attempt saved ✓' : `Save failed: ${result.error || 'Unknown error'}`)
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Failed to save.')
    }
  }

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

  const transcribeRecording = async () => {
    if (!recordedBlob) { alert('Please record audio first.'); return }
    if (!practiceEntry?.id) { alert('Please choose an item first.'); return }
    const expectedText = (practiceMode === 'term' || practiceMode === 'interpret-term') ? practiceEntry.english_term || '' : practiceEntry.english_sentence || ''
    if (!expectedText) { alert('No expected text for this item.'); return }

    setIsChecking(true)
    setTranscriptionStatus('Transcribing your audio…')
    setTranscription(''); setMatchScore(null); setMatchStatus(''); setSaveStatus('')
    setMatchedWords([]); setMissingWords([]); setExtraWords([]); setAiFeedback('')

    try {
      // 1. Transcribe audio
      const form = new FormData()
      form.append('file', new File([recordedBlob], 'recording.webm', { type: 'audio/webm' }))
      // If practicing English pronunciation, force English transcription. If interpreting to Amharic, force Amharic.
      form.append('expectedLanguage', practiceMode.startsWith('interpret') ? 'am' : 'en')
      
      const transRes = await fetch('/api/transcribe', { method: 'POST', body: form })
      const transResult = await transRes.json()
      if (!transRes.ok) { setTranscriptionStatus(`${transResult.error || 'Transcription failed.'}${transResult.details ? ' ' + transResult.details : ''}`); return }
      const text = transResult.text || ''
      setTranscription(text)
      
      if (practiceMode === 'interpret-term' || practiceMode === 'interpret-sentence') {
        // 2. Evaluate Interpretation
        setTranscriptionStatus('Consulting AI Evaluator…')
        const evalRes = await fetch('/api/evaluate-interpretation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ englishText: expectedText, amharicText: text })
        })
        const evalResult = await evalRes.json()
        if (!evalRes.ok) throw new Error(`${evalResult.error || 'Evaluation failed'}${evalResult.details ? ': ' + evalResult.details : ''}`)
        
        const { score, status, feedback } = evalResult.evaluation
        setMatchScore(score); setMatchStatus(status); setAiFeedback(feedback)
        setTranscriptionStatus('Evaluation complete.')
        handleScoreCelebration(score)
        await saveAttempt(practiceEntry.id, text, score, expectedText, status, practiceMode, feedback)
      } else {
        // 2. Evaluate Term / Sentence locally
        setTranscriptionStatus('Transcription complete.')
        const cmp = compareTexts(expectedText, text)
        setMatchScore(cmp.score); setMatchStatus(cmp.status)
        setMatchedWords(cmp.matchedWords); setMissingWords(cmp.missingWords); setExtraWords(cmp.extraWords)
        handleScoreCelebration(cmp.score)
        await saveAttempt(practiceEntry.id, text, cmp.score, expectedText, cmp.status, practiceMode)
      }
    } catch (err) {
      setTranscriptionStatus(err instanceof Error ? err.message : 'Unknown transcription error')
    } finally { setIsChecking(false) }
  }

  // Auto-evaluate when blob changes
  useEffect(() => {
    if (recordedBlob && matchScore === null && !isChecking) {
      if (autoEvalTimeoutRef.current) clearTimeout(autoEvalTimeoutRef.current)
      autoEvalTimeoutRef.current = setTimeout(() => {
        transcribeRecording()
      }, 500)
    }
    return () => { if (autoEvalTimeoutRef.current) clearTimeout(autoEvalTimeoutRef.current) }
  }, [recordedBlob, matchScore, isChecking])

  const expectedText = (practiceMode === 'term' || practiceMode === 'interpret-term') ? practiceEntry?.english_term || '' : practiceEntry?.english_sentence || ''
  const practiceLabel = practiceMode === 'term' ? 'Term' : practiceMode === 'sentence' ? 'Sentence' : practiceMode === 'interpret-term' ? 'Term Interpretation' : 'Sentence Interpretation'

  const selectedEntry = entries.length === 1
    ? entries[0]
    : entries.find(e => normalizeText(e.english_term || '') === normalizeText(query)) || null

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title" style={{ fontSize: '26px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={26} color="var(--brand-500)" /> Glossary
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Search terms · hear pronunciation · practice speaking
          {voicesReady && <span className="badge badge-success" style={{ marginLeft: '10px' }}>🔊 Speech Ready</span>}
        </p>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search English, Amharic, or definition…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') loadEntries(query, level, topic) }}
            className="input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <button onClick={() => loadEntries(query, level, topic)} className="btn btn-primary">Search</button>
        <button onClick={() => setShowFilters(f => !f)} className="btn btn-secondary" title="Filters">
          <SlidersHorizontal size={16} /> Filters
        </button>
        {(query || level || topic) && (
          <button onClick={() => { setQuery(''); setLevel(''); setTopic(''); setAutoSelectedMsg(''); loadEntries('', '', '') }} className="btn btn-ghost">
            <X size={15} /> Clear
          </button>
        )}
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', padding: '14px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} className="animate-in">
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>LEVEL:</span>
            {['', 'L2', 'L3', 'L4'].map(l => (
              <button key={l} onClick={() => setLevel(l)} className={`btn btn-sm ${level === l ? 'btn-primary' : 'btn-secondary'}`}>
                {l || 'All'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>TOPIC:</span>
            <input
              type="text"
              placeholder="e.g. medical"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="input"
              style={{ width: '180px' }}
            />
          </div>
        </div>
      )}

      {autoSelectedMsg && (
        <div style={{ marginBottom: '16px', padding: '10px 16px', background: 'var(--brand-50)', border: '1px solid var(--brand-200)', borderRadius: 'var(--radius-md)', fontSize: '13.5px', color: 'var(--brand-700)' }} className="animate-in">
          ✨ {autoSelectedMsg}
        </div>
      )}

      {/* Two-column layout on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '24px', alignItems: 'start' }}>

        {/* ── Left: Glossary list ── */}
        <div>
          {loading && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '120px' }} />)}
            </div>
          )}
          {error && <p style={{ color: 'var(--danger)', padding: '12px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)' }}>{error}</p>}

          {!loading && !error && (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'} found
              </p>
              {entries.length === 0
                ? <div className="card" style={{ textAlign: 'center', padding: '40px' }}><BookOpen size={32} color="var(--text-muted)" /><p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>No matching entries found.</p></div>
                : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {entries.map(entry => {
                      const isSelected = practiceEntry?.id === entry.id
                      return (
                        <div key={entry.id} className="card" style={{ borderColor: isSelected ? 'var(--brand-400)' : undefined, boxShadow: isSelected ? '0 0 0 2px var(--brand-200)' : undefined }}>
                          {/* Header row */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <div style={{ flex: 1 }}>
                              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{entry.english_term}</h2>
                              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{entry.amharic_term}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <LevelBadge level={entry.level} />
                              <TopicBadge topic={entry.topic} />
                            </div>
                          </div>

                          {entry.definition && (
                            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.55 }}>
                              {entry.definition}
                            </p>
                          )}

                          {entry.english_sentence && (
                            <div style={{ fontSize: '13px', background: 'var(--surface-alt)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '10px', lineHeight: 1.5 }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px' }}>EN: </span>{entry.english_sentence}
                              {entry.amharic_sentence && (
                                <><br /><span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px' }}>AM: </span>{entry.amharic_sentence}</>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {entry.english_term && (
                              <button onClick={() => speakEnglish(entry.english_term!)} className="btn btn-secondary btn-sm">
                                <Volume2 size={14} /> Play
                              </button>
                            )}
                            <button onClick={() => startPractice(entry, 'term')} className={`btn btn-sm ${isSelected && practiceMode === 'term' ? 'btn-primary' : 'btn-ghost'}`}>
                              <Mic2 size={14} /> Practice Term
                            </button>
                            {entry.english_sentence && (
                              <button onClick={() => startPractice(entry, 'sentence')} className={`btn btn-sm ${isSelected && practiceMode === 'sentence' ? 'btn-primary' : 'btn-ghost'}`}>
                                <Mic2 size={14} /> Practice Sentence
                              </button>
                            )}
                            <button onClick={() => startPractice(entry, 'interpret-term')} className={`btn btn-sm ${isSelected && practiceMode === 'interpret-term' ? 'btn-primary' : 'btn-ghost'}`}>
                              <Mic2 size={14} /> Interpret Term
                            </button>
                            {entry.english_sentence && (
                              <button onClick={() => startPractice(entry, 'interpret-sentence')} className={`btn btn-sm ${isSelected && practiceMode === 'interpret-sentence' ? 'btn-primary' : 'btn-ghost'}`}>
                                <Mic2 size={14} /> Interpret Sentence
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
            </>
          )}
        </div>

        {/* ── Right: Practice Panel ── */}
        <div id="practice-panel" style={{ position: 'sticky', top: 'calc(var(--nav-height) + 16px)' }}>
          <div className="card" style={{ border: 'none', overflow: 'hidden', boxShadow: '0 8px 32px rgba(99,102,241,0.12)', background: '#fff', maxHeight: 'calc(100vh - var(--nav-height) - 80px)', overflowY: 'auto' }}>

            {/* Gradient Header */}
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)', padding: '16px 18px 18px', marginBottom: 0, position: 'relative' }}>
              {/* Mobile drag pill */}
              <div className="mobile-close-btn" style={{ display: 'none', width: '36px', height: '4px', background: 'rgba(255,255,255,0.4)', borderRadius: '99px', margin: '0 auto 12px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mic2 size={16} color="#fff" />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pronunciation Practice</span>
                  </div>
                  {practiceEntry ? (
                    <div>
                      <p style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{expectedText}</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '3px 0 0', fontStyle: 'italic' }}>{practiceEntry.amharic_term}</p>
                    </div>
                  ) : (
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', margin: 0 }}>Choose a term to practice</p>
                  )}
                </div>
                {practiceEntry && (
                  <button
                    onClick={() => setPracticeEntry(null)}
                    className="mobile-close-btn"
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <X size={16} color="#fff" />
                  </button>
                )}
              </div>
              {practiceEntry && (
                <div style={{ marginTop: '10px' }}>
                  <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', backdropFilter: 'blur(4px)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {practiceMode === 'term' ? '🎯 Term' : practiceMode === 'sentence' ? '📝 Sentence' : practiceMode === 'interpret-term' ? '🌐 Interpret Term' : '🌐 Interpret Sentence'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ padding: '18px' }}>
              {!practiceEntry ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                  <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #ede9fe, #f3e8ff)', borderRadius: '50%', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic2 size={28} color="#8b5cf6" />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Ready to Practice?</p>
                  <p style={{ fontSize: '13px', lineHeight: 1.6 }}>
                    Click <strong style={{ color: 'var(--brand-600)' }}>"Practice Term"</strong> on any entry below to get started.
                  </p>
                </div>
              ) : (
                <>
                  {/* Hear button */}
                  <button
                    onClick={() => {
                      if (isPlayingAudio) return;
                      setRecordedBlob(null);
                      setTranscription(''); setTranscriptionStatus(''); setMatchScore(null);
                      setMatchStatus(''); setSaveStatus(''); setMatchedWords([]); setMissingWords([]); setExtraWords([]);
                      setAiFeedback('');
                      
                      const speechText = practiceMode.startsWith('interpret') ? (practiceEntry?.amharic_term || '') : expectedText;
                      
                      // For Amharic interpretation, if speech synth doesn't support Amharic, we just skip TTS or try our best.
                      // Since we only have English TTS setup reliably, if it's interpret mode we might not want to auto-read Amharic reliably.
                      // Let's just do it for English modes, or read the English source.
                      // Wait, interpretation means translating English -> Amharic. So we should read the English source!
                      const textToRead = expectedText;
                      
                      speakEnglish(
                        textToRead,
                        () => setIsPlayingAudio(true),
                        () => {
                          setIsPlayingAudio(false);
                          if (recorderRef.current) {
                            recorderRef.current.startRecording();
                            const targetMs = Math.max(3000, textToRead.length * 90);
                            if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current)
                            recordingTimeoutRef.current = setTimeout(() => {
                              if (recorderRef.current) recorderRef.current.stopRecording()
                            }, targetMs)
                          }
                        }
                      )
                    }}
                    disabled={isPlayingAudio}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', marginBottom: '14px', borderRadius: '12px', fontWeight: 600, gap: '8px', border: '1.5px solid var(--border-strong)', background: isPlayingAudio ? 'var(--brand-100)' : undefined }}
                  >
                    {isPlayingAudio ? <><Volume2 className="animate-pulse" size={15} /> Listening...</> : <><Volume2 size={15} /> Listen & Record</>}
                  </button>

                  {/* Recorder */}
                  <div style={{ background: 'linear-gradient(135deg, #f8f7ff, #fdf4ff)', border: '1.5px solid #e9d5ff', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🎙 Record your voice</p>
                    <Recorder
                      ref={recorderRef}
                      onRecorded={blob => {
                        setRecordedBlob(blob)
                      }}
                    />
                  </div>

                  {recordedAudioUrl && !isChecking && matchScore === null && (
                    <div style={{ marginTop: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Auto-evaluating...
                    </div>
                  )}

                  {transcriptionStatus && (
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '10px', textAlign: 'center' }}>{transcriptionStatus}</p>
                  )}

                  {/* Results */}
                  {matchScore !== null && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }} className="animate-bounceIn">
                      <ScoreRing score={matchScore} size={88} label="Match Score" />

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <span className={statusBadgeClass(matchStatus)} style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '99px' }}>{matchStatus}</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: matchScore >= 90 ? '#059669' : matchScore >= 60 ? '#d97706' : '#dc2626' }}>
                          {getEncouragement(matchScore)}
                        </span>
                      </div>

                      {transcription && (
                        <div style={{ width: '100%', padding: '10px 14px', background: '#f8f7ff', border: '1px solid #e9d5ff', borderRadius: '12px', fontSize: '13px', lineHeight: 1.6 }}>
                          <span style={{ fontWeight: 700, fontSize: '10px', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '2px' }}>{practiceMode.startsWith('interpret') ? 'YOU INTERPRETED:' : '🗣 YOU SAID:'}</span>
                          {transcription}
                        </div>
                      )}

                      {aiFeedback && practiceMode.startsWith('interpret') && (
                        <div style={{ width: '100%', padding: '12px 14px', background: 'var(--brand-50)', border: '1px solid var(--brand-200)', borderRadius: '12px', fontSize: '13px', lineHeight: 1.6, color: 'var(--brand-900)' }}>
                          <span style={{ fontWeight: 700, fontSize: '10px', color: 'var(--brand-600)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>🤖 AI EVALUATION:</span>
                          {aiFeedback}
                        </div>
                      )}

                      {!aiFeedback && (matchedWords.length > 0 || missingWords.length > 0 || extraWords.length > 0) && (
                        <div style={{ width: '100%', fontSize: '12.5px', lineHeight: 1.7, background: 'var(--surface)', padding: '10px 12px', borderRadius: '10px' }}>
                          {matchedWords.length > 0 && <p><span style={{ fontWeight: 700, color: 'var(--success)' }}>✓ Matched:</span> {matchedWords.map((w, i) => <span key={i} className="word-matched" style={{ marginRight: '4px' }}>{w}</span>)}</p>}
                          {missingWords.length > 0 && <p style={{ marginTop: '4px' }}><span style={{ fontWeight: 700, color: 'var(--danger)' }}>✗ Missing:</span> {missingWords.map((w, i) => <span key={i} className="word-missing" style={{ marginRight: '4px' }}>{w}</span>)}</p>}
                          {extraWords.length > 0 && <p style={{ marginTop: '4px' }}><span style={{ fontWeight: 700, color: 'var(--warning)' }}>~ Extra:</span> {extraWords.map((w, i) => <span key={i} className="word-extra" style={{ marginRight: '4px' }}>{w}</span>)}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {saveStatus && (
                    <p style={{ fontSize: '12px', color: saveStatus.includes('✓') ? 'var(--success)' : 'var(--danger)', textAlign: 'center', marginTop: '8px', fontWeight: 600 }}>
                      {saveStatus}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {selectedEntry && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              <a href="/history" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>History <ChevronRight size={14} /></a>
              <a href="/weak-words" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Weak Words <ChevronRight size={14} /></a>
            </div>
          )}
        </div>

      </div>

      {/* Mobile practice panel positioning */}
      <style>{`
        /* Desktop */
        @media (min-width: 821px) {
          .mobile-close-btn { display: none !important; }
          #practice-panel {
            display: block !important;
            position: sticky !important;
          }
        }

        /* Mobile */
        @media (max-width: 820px) {
          main > div:last-of-type {
            display: block !important;
          }
          /* The left side (list) takes full width */
          main > div:last-of-type > div:first-child {
            width: 100%;
            padding-bottom: 20px;
          }

          /* The right side (practice panel) becomes a fixed bottom sheet overlay */
          #practice-panel {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            top: auto !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
            z-index: 100 !important;
            background: #fff !important;
            border-top: 1px solid var(--border-strong) !important;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.15) !important;
            border-radius: 24px 24px 0 0 !important;
            animation: slideUp 0.3s ease-out forwards;
            padding: 0 !important;
          }

          /* Remove card constraints inside the bottom sheet */
          #practice-panel .card {
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }

          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        }
      `}</style>

      {/* Mobile overlay backdrop */}
      {practiceEntry && (
        <style>{`
          @media (max-width: 820px) {
            #practice-panel { display: flex !important; flex-direction: column; }
          }
        `}</style>
      )}
      {!practiceEntry && (
        <style>{`
          @media (max-width: 820px) {
            #practice-panel { display: none !important; }
          }
        `}</style>
      )}
    </main>
  )
}
