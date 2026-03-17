'use client'

import { useEffect, useMemo, useState } from 'react'
import Recorder from '../../components/Recorder'
import ScoreRing from '../../components/ui/ScoreRing'
import { Search, Volume2, Mic2, ChevronRight, BookOpen, X, SlidersHorizontal } from 'lucide-react'
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

  const speakEnglish = (text: string) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) { alert('Speech not supported.'); return }
    const synth = window.speechSynthesis
    const voices = synth.getVoices()
    if (!voices.length) { alert('Voices not ready yet. Try again.'); return }
    synth.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-US'; utt.rate = 0.9; utt.pitch = 1; utt.volume = 1
    const voice = voices.find(v => v.lang.toLowerCase().startsWith('en-us')) || voices.find(v => v.lang.toLowerCase().startsWith('en')) || null
    if (voice) utt.voice = voice
    utt.onerror = () => alert('Speech playback failed.')
    synth.speak(utt)
  }

  const resetPracticeState = () => {
    setRecordedBlob(null); setTranscription(''); setTranscriptionStatus('')
    setMatchScore(null); setMatchStatus(''); setSaveStatus('')
    setMatchedWords([]); setMissingWords([]); setExtraWords([])
    setAiFeedback(''); setAutoSelectedMsg('')
  }

  const startPractice = (entry: GlossaryEntry, mode: 'term' | 'sentence' | 'interpret-term' | 'interpret-sentence') => {
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
        <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + 16px)' }}>
          <div className="card" style={{ border: '1.5px solid var(--brand-200)', background: 'linear-gradient(160deg, #fff 60%, var(--brand-50))', maxHeight: 'calc(100vh - var(--nav-height) - 80px)', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: 'var(--brand-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mic2 size={18} /> Pronunciation Practice
            </h2>

            {!practiceEntry ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                <Mic2 size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                <p style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
                  Click <strong>"Practice Term"</strong> or <strong>"Practice Sentence"</strong> on any entry to get started.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    Practicing {practiceLabel}
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{expectedText}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{practiceEntry.amharic_term}</p>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <button onClick={() => speakEnglish(expectedText)} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    <Volume2 size={15} /> Hear Pronunciation
                  </button>
                </div>

                {/* Recorder */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'center' }}>
                  <Recorder
                    onRecorded={blob => {
                      setRecordedBlob(blob)
                      setTranscription(''); setTranscriptionStatus(''); setMatchScore(null)
                      setMatchStatus(''); setSaveStatus(''); setMatchedWords([]); setMissingWords([]); setExtraWords([])
                    }}
                  />
                </div>

                {recordedAudioUrl && (
                  <div style={{ marginTop: '12px' }}>
                    <audio controls src={recordedAudioUrl} style={{ width: '100%', height: '36px' }} />
                    <button
                      onClick={transcribeRecording}
                      disabled={isChecking}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                    >
                      {isChecking ? '⏳ Checking…' : '🔍 Check My Pronunciation'}
                    </button>
                  </div>
                )}

                {transcriptionStatus && (
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '10px', textAlign: 'center' }}>{transcriptionStatus}</p>
                )}

                {/* Results */}
                {matchScore !== null && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }} className="animate-bounceIn">
                    <ScoreRing score={matchScore} size={88} label="Match Score" />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span className={statusBadgeClass(matchStatus)} style={{ fontSize: '13px', padding: '4px 10px' }}>{matchStatus}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-700)', marginTop: '4px' }}>
                        {getEncouragement(matchScore)}
                      </span>
                    </div>

                    {transcription && (
                      <div style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: '13px', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-muted)' }}>{practiceMode.startsWith('interpret') ? 'YOU INTERPRETED:' : 'YOU SAID:'} </span>
                        {transcription}
                      </div>
                    )}

                    {aiFeedback && practiceMode.startsWith('interpret') && (
                      <div style={{ width: '100%', padding: '12px', background: 'var(--brand-50)', border: '1px solid var(--brand-200)', borderRadius: 'var(--radius-sm)', fontSize: '13px', lineHeight: 1.6, color: 'var(--brand-900)' }}>
                        <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--brand-600)', display: 'block', marginBottom: '4px' }}>AI EVALUATION:</span>
                        {aiFeedback}
                      </div>
                    )}

                    {!aiFeedback && (matchedWords.length > 0 || missingWords.length > 0 || extraWords.length > 0) && (
                      <div style={{ width: '100%', fontSize: '12.5px', lineHeight: 1.6 }}>
                        {matchedWords.length > 0 && <p><span style={{ fontWeight: 600, color: 'var(--success)' }}>✓ Matched:</span> {matchedWords.map((w, i) => <span key={i} className="word-matched" style={{ marginRight: '4px' }}>{w}</span>)}</p>}
                        {missingWords.length > 0 && <p style={{ marginTop: '4px' }}><span style={{ fontWeight: 600, color: 'var(--danger)' }}>✗ Missing:</span> {missingWords.map((w, i) => <span key={i} className="word-missing" style={{ marginRight: '4px' }}>{w}</span>)}</p>}
                        {extraWords.length > 0 && <p style={{ marginTop: '4px' }}><span style={{ fontWeight: 600, color: 'var(--warning)' }}>~ Extra:</span> {extraWords.map((w, i) => <span key={i} className="word-extra" style={{ marginRight: '4px' }}>{w}</span>)}</p>}
                      </div>
                    )}
                  </div>
                )}

                {saveStatus && (
                  <p style={{ fontSize: '12px', color: saveStatus.includes('✓') ? 'var(--success)' : 'var(--danger)', textAlign: 'center', marginTop: '8px' }}>
                    {saveStatus}
                  </p>
                )}
              </>
            )}
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
        @media (max-width: 820px) {
          main > div:last-of-type {
            display: flex !important;
            flex-direction: column-reverse !important;
            gap: 20px;
          }
          main > div:last-of-type > div:last-child {
            position: relative;
            top: 0;
            z-index: 10;
          }
        }
      `}</style>
    </main>
  )
}
