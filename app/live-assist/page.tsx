'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, Search, X, Plus, Pin, Copy, Download, Trash2, Clock, CheckCircle, Mic, BookOpen, AlertCircle, Tag } from 'lucide-react'

type NoteTag = 'name' | 'number' | 'date' | 'term' | 'address' | 'important' | 'general'
type NoteEntry = { id: string; text: string; tag: NoteTag; ts: number; pinned: boolean }
type GlossaryResult = { id: string; english_term: string; amharic_term: string; definition?: string }

const TAG_META: Record<NoteTag, { label: string; emoji: string; color: string; bg: string }> = {
  name:      { label: 'Name',      emoji: '👤', color: '#6366f1', bg: '#eef2ff' },
  number:    { label: 'Number',    emoji: '🔢', color: '#3b82f6', bg: '#eff6ff' },
  date:      { label: 'Date',      emoji: '📅', color: '#8b5cf6', bg: '#f5f3ff' },
  term:      { label: 'Term',      emoji: '📖', color: '#10b981', bg: '#ecfdf5' },
  address:   { label: 'Address',   emoji: '🏠', color: '#f59e0b', bg: '#fffbeb' },
  important: { label: 'Important', emoji: '❗', color: '#ef4444', bg: '#fef2f2' },
  general:   { label: 'General',   emoji: '📝', color: '#6b7280', bg: '#f9fafb' },
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function timeLabel(ts: number): string {
  return formatTime(ts)
}

export default function LiveAssistPage() {
  // Timer
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Glossary search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlossaryResult[]>([])
  const [searching, setSearching] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Notes
  const [notes, setNotes] = useState<NoteEntry[]>([])
  const [noteText, setNoteText] = useState('')
  const [noteTag, setNoteTag] = useState<NoteTag>('general')
  const [activeTab, setActiveTab] = useState<'search' | 'notes'>('search')
  const [copied, setCopied] = useState(false)
  const noteInputRef = useRef<HTMLInputElement>(null)

  // Load notes from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('live_assist_notes')
      if (raw) setNotes(JSON.parse(raw))
    } catch {}
  }, [])

  // Save notes
  useEffect(() => {
    localStorage.setItem('live_assist_notes', JSON.stringify(notes))
  }, [notes])

  // Timer
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running])

  // Glossary search debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/glossary?q=${encodeURIComponent(query)}&limit=8`)
        const data = await res.json()
        setResults(data.entries || [])
      } catch {}
      setSearching(false)
    }, 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [query])

  const startStop = () => {
    if (!running) {
      setRunning(true)
    } else {
      setRunning(false)
    }
  }

  const resetSession = () => {
    setRunning(false)
    setElapsed(0)
    setNotes([])
    setQuery('')
    setResults([])
    localStorage.removeItem('live_assist_notes')
  }

  const addNote = () => {
    if (!noteText.trim()) return
    const entry: NoteEntry = {
      id: Date.now().toString(),
      text: noteText.trim(),
      tag: noteTag,
      ts: elapsed,
      pinned: false,
    }
    setNotes(n => [entry, ...n])
    setNoteText('')
    noteInputRef.current?.focus()
  }

  const togglePin = (id: string) => {
    setNotes(n => n.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e))
  }

  const deleteNote = (id: string) => {
    setNotes(n => n.filter(e => e.id !== id))
  }

  const copyTerm = (term: string, id: string) => {
    navigator.clipboard.writeText(term).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  const addTermAsNote = (entry: GlossaryResult) => {
    const newNote: NoteEntry = {
      id: Date.now().toString(),
      text: `${entry.english_term} = ${entry.amharic_term}`,
      tag: 'term',
      ts: elapsed,
      pinned: false,
    }
    setNotes(n => [newNote, ...n])
    setQuery('')
    setResults([])
    setActiveTab('notes')
  }

  const copyAllNotes = () => {
    const sorted = [...notes].sort((a, b) => a.ts - b.ts)
    const text = sorted.map(n => `[${formatTime(n.ts)}] [${TAG_META[n.tag].label}] ${n.text}`).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return a.ts - b.ts
  })

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 0 100px', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* === TOP BAR === */}
      <div style={{
        background: running
          ? 'linear-gradient(135deg, #059669, #10b981)'
          : 'linear-gradient(135deg, #4f46e5, #6366f1)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        marginBottom: 16,
        transition: 'background 0.5s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: running ? 'pulse-ring 2s infinite' : 'none',
          }}>
            <Phone size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {running ? 'Live Call Active' : 'Ready to Start'}
            </div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 }}>
              {formatTime(elapsed)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={startStop}
            style={{
              padding: '10px 20px',
              background: running ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,1)',
              color: running ? '#fff' : '#059669',
              border: 'none',
              borderRadius: 99,
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          {elapsed > 0 && (
            <button
              onClick={resetSession}
              style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                border: 'none',
                borderRadius: 99,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
              title="Reset session"
            >
              ↺
            </button>
          )}
        </div>
      </div>

      {/* === QUICK NOTE BAR === */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        {/* Tag selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {(Object.keys(TAG_META) as NoteTag[]).map(t => {
            const m = TAG_META[t]
            return (
              <button
                key={t}
                onClick={() => setNoteTag(t)}
                style={{
                  flexShrink: 0,
                  padding: '5px 12px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: `2px solid ${noteTag === t ? m.color : 'transparent'}`,
                  background: noteTag === t ? m.bg : 'var(--surface)',
                  color: noteTag === t ? m.color : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {m.emoji} {m.label}
              </button>
            )
          })}
        </div>
        {/* Note input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={noteInputRef}
            className="input"
            placeholder="Quick note… (name, number, term, etc.)"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNote()}
            style={{ fontSize: 15, flex: 1, borderRadius: 14, paddingRight: 14 }}
          />
          <button
            onClick={addNote}
            disabled={!noteText.trim()}
            style={{
              width: 48, height: 48,
              background: noteText.trim() ? `linear-gradient(135deg, ${TAG_META[noteTag].color}, ${TAG_META[noteTag].color}cc)` : 'var(--surface-alt)',
              border: 'none',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: noteText.trim() ? 'pointer' : 'not-allowed',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            <Plus size={20} color={noteText.trim() ? '#fff' : 'var(--text-muted)'} />
          </button>
        </div>
      </div>

      {/* === TABS === */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', background: 'var(--surface-alt)', borderRadius: 14, padding: 4, gap: 4 }}>
          {(['search', 'notes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === tab ? 'var(--surface)' : 'transparent',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                color: activeTab === tab ? 'var(--brand-600)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s',
              }}
            >
              {tab === 'search' ? <><Search size={15} /> Glossary</> : <><Tag size={15} /> Notes {notes.length > 0 && <span style={{ background: 'var(--brand-500)', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 11 }}>{notes.length}</span>}</>}
            </button>
          ))}
        </div>
      </div>

      {/* === GLOSSARY SEARCH TAB === */}
      {activeTab === 'search' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Search English or Amharic term…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 40, fontSize: 16, borderRadius: 14, height: 50 }}
              autoComplete="off"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]) }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {searching && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 14 }}>
              Searching…
            </div>
          )}

          {!searching && results.length === 0 && query.trim() && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              <BookOpen size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ fontSize: 14 }}>No results for "{query}"</p>
            </div>
          )}

          {!query && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Search size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Instant Glossary Lookup</p>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>Type any English or Amharic term to find it instantly during your call.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map(entry => (
              <div key={entry.id} className="card" style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                background: 'var(--surface)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-sm)',
                transition: 'box-shadow 0.2s',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {entry.english_term}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--brand-600)' }}>
                    {entry.amharic_term}
                  </div>
                  {entry.definition && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                      {entry.definition.slice(0, 80)}{entry.definition.length > 80 ? '…' : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => copyTerm(entry.amharic_term, entry.id)}
                    style={{
                      padding: '7px 12px',
                      background: copiedId === entry.id ? '#ecfdf5' : 'var(--surface-alt)',
                      border: `1.5px solid ${copiedId === entry.id ? '#6ee7b7' : 'var(--border)'}`,
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: copiedId === entry.id ? '#059669' : 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', gap: 4,
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copiedId === entry.id ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                  <button
                    onClick={() => addTermAsNote(entry)}
                    style={{
                      padding: '7px 12px',
                      background: 'var(--brand-50)',
                      border: '1.5px solid var(--brand-200)',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: 'var(--brand-700)',
                      display: 'flex', alignItems: 'center', gap: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Plus size={12} /> Note
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === NOTES TAB === */}
      {activeTab === 'notes' && (
        <div style={{ padding: '0 16px' }}>
          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Tag size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No notes yet</p>
              <p style={{ fontSize: 13 }}>Use the quick note bar above to capture info during the call.</p>
            </div>
          ) : (
            <>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={copyAllNotes}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: copied ? '#ecfdf5' : 'var(--surface)',
                    border: `1.5px solid ${copied ? '#6ee7b7' : 'var(--border-strong)'}`,
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    color: copied ? '#059669' : 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy All Notes</>}
                </button>
                <button
                  onClick={() => { if (confirm('Clear all notes?')) setNotes([]) }}
                  style={{
                    padding: '10px 14px',
                    background: 'var(--danger-bg)',
                    border: '1.5px solid #fecaca',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    color: 'var(--danger)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Trash2 size={14} /> Clear
                </button>
              </div>

              {/* Note list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedNotes.map(note => {
                  const m = TAG_META[note.tag]
                  return (
                    <div key={note.id} style={{
                      background: 'var(--surface)',
                      border: `1.5px solid ${note.pinned ? m.color + '60' : 'var(--border)'}`,
                      borderLeft: `4px solid ${m.color}`,
                      borderRadius: 14,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      boxShadow: note.pinned ? `0 0 0 2px ${m.color}30` : 'var(--shadow-sm)',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: m.bg, color: m.color }}>
                            {m.emoji} {m.label}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={10} /> {timeLabel(note.ts)}
                          </span>
                          {note.pinned && <span style={{ fontSize: 10, fontWeight: 700, color: m.color }}>📌 Pinned</span>}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                          {note.text}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => togglePin(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: note.pinned ? m.color : 'var(--text-muted)' }} title="Pin">
                          📌
                        </button>
                        <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile bottom tip */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '10px 20px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text-muted)',
        fontWeight: 500,
        zIndex: 50,
      }}>
        🎙 Live Interpreter Assistant · Notes auto-saved locally
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
          70%  { box-shadow: 0 0 0 14px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
      `}</style>
    </main>
  )
}
