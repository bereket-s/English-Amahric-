'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Plus, Pin, Copy, Trash2, Clock, CheckCircle, Tag, BookOpen, Keyboard } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
type NoteTag = 'name' | 'number' | 'date' | 'term' | 'address' | 'important' | 'general'
type NoteEntry = { id: string; text: string; tag: NoteTag; ts: Date; pinned: boolean }
type GlossaryResult = { id: string; english_term: string; amharic_term: string; definition?: string }

// ── Built-in interpreter abbreviations expanded on spacebar ───────────────
const ABBREVIATIONS: Record<string, string> = {
  'pt': 'patient',     'px': 'prescription', 'dx': 'diagnosis',     'tx': 'treatment',
  'hx': 'history',     'sx': 'symptoms',     'rx': 'medication',    'fx': 'fracture',
  'dob': 'date of birth', 'doa': 'date of arrival', 'poc': 'point of contact',
  'dv': 'domestic violence', 'ss': 'social security', 'hud': 'housing authority',
  'atty': 'attorney',  'def': 'defendant',    'plt': 'plaintiff',    'imm': 'immigration',
  'asyp': 'asylum petition', 'gc': 'green card',  'wp': 'work permit',
  'nb': 'note well',   'asap': 'as soon as possible', 'appt': 'appointment',
  'ref': 'referral',   'ins': 'insurance',   'auth': 'authorization',
}

const TAG_META: Record<NoteTag, { label: string; emoji: string; color: string; bg: string; key: string }> = {
  name:      { label: 'Name',      emoji: '👤', color: '#6366f1', bg: '#eef2ff', key: '1' },
  number:    { label: 'Number',    emoji: '🔢', color: '#3b82f6', bg: '#eff6ff', key: '2' },
  date:      { label: 'Date',      emoji: '📅', color: '#8b5cf6', bg: '#f5f3ff', key: '3' },
  term:      { label: 'Term',      emoji: '📖', color: '#10b981', bg: '#ecfdf5', key: '4' },
  address:   { label: 'Address',   emoji: '🏠', color: '#f59e0b', bg: '#fffbeb', key: '5' },
  important: { label: 'Important', emoji: '❗', color: '#ef4444', bg: '#fef2f2', key: '6' },
  general:   { label: 'General',   emoji: '📝', color: '#6b7280', bg: '#f9fafb', key: '7' },
}

// ── Popup state ────────────────────────────────────────────────────────────
type Popup = {
  visible: boolean
  x: number; y: number
  word: string
  results: GlossaryResult[]
  loading: boolean
}

function timeStr(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function LiveAssistPage() {
  // Note input
  const [noteText, setNoteText] = useState('')
  const [noteTag, setNoteTag] = useState<NoteTag>('general')
  const [notes, setNotes] = useState<NoteEntry[]>([])
  const noteInputRef = useRef<HTMLInputElement>(null)

  // Manual glossary search tab
  const [activeTab, setActiveTab] = useState<'notes' | 'search'>('notes')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GlossaryResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchDebounce = useRef<NodeJS.Timeout | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Highlight-to-translate popup
  const [popup, setPopup] = useState<Popup>({ visible: false, x: 0, y: 0, word: '', results: [], loading: false })
  const popupRef = useRef<HTMLDivElement>(null)
  const noteListRef = useRef<HTMLDivElement>(null)

  // Copied all
  const [copiedAll, setCopiedAll] = useState(false)

  // ── Load / save notes ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('live_assist_v2')
      if (raw) {
        const parsed = JSON.parse(raw)
        setNotes(parsed.map((n: any) => ({ ...n, ts: new Date(n.ts) })))
      }
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('live_assist_v2', JSON.stringify(notes))
  }, [notes])

  // ── Abbreviation expander on spacebar ───────────────────────────────────
  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { addNote(); return }
    if (e.key === ' ') {
      const words = noteText.trimEnd().split(/\s+/)
      const last = words[words.length - 1].toLowerCase()
      if (ABBREVIATIONS[last]) {
        e.preventDefault()
        const expanded = noteText.slice(0, noteText.lastIndexOf(last)) + ABBREVIATIONS[last] + ' '
        setNoteText(expanded)
      }
    }
    // Alt+1-7 to quickly switch tag
    if (e.altKey) {
      const tags = Object.keys(TAG_META) as NoteTag[]
      const idx = parseInt(e.key) - 1
      if (idx >= 0 && idx < tags.length) { setNoteTag(tags[idx]); e.preventDefault() }
    }
  }

  const addNote = () => {
    if (!noteText.trim()) return
    setNotes(n => [{
      id: Date.now().toString(),
      text: noteText.trim(),
      tag: noteTag,
      ts: new Date(),
      pinned: false,
    }, ...n])
    setNoteText('')
    noteInputRef.current?.focus()
  }

  const togglePin = (id: string) => setNotes(n => n.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e))
  const deleteNote = (id: string) => setNotes(n => n.filter(e => e.id !== id))

  const copyAll = () => {
    const sorted = [...notes].sort((a, b) => a.ts.getTime() - b.ts.getTime())
    const text = sorted.map(n =>
      `[${timeStr(n.ts)}] [${TAG_META[n.tag].label}] ${n.text}`
    ).join('\n')
    navigator.clipboard.writeText(text).then(() => { setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000) })
  }

  // ── Manual search debounce ──────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return }
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    setSearching(true)
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/glossary?q=${encodeURIComponent(query)}&limit=8`)
        const data = await res.json()
        setSearchResults(data.entries || [])
      } catch {}
      setSearching(false)
    }, 280)
  }, [query])

  // ── Highlight-to-translate ───────────────────────────────────────────────
  const lookupWord = useCallback(async (word: string, x: number, y: number) => {
    const clean = word.trim().replace(/[.,!?;:'"]/g, '')
    if (clean.length < 2) return
    setPopup({ visible: true, x, y, word: clean, results: [], loading: true })
    try {
      const res = await fetch(`/api/glossary?q=${encodeURIComponent(clean)}&limit=4`)
      const data = await res.json()
      setPopup(p => ({ ...p, results: data.entries || [], loading: false }))
    } catch {
      setPopup(p => ({ ...p, loading: false }))
    }
  }, [])

  const handleTextSelect = useCallback((e: React.MouseEvent) => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) { setPopup(p => ({ ...p, visible: false })); return }
    const text = sel.toString().trim()
    if (text.length < 2 || text.length > 60) { setPopup(p => ({ ...p, visible: false })); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    lookupWord(text, rect.left + rect.width / 2, rect.bottom + window.scrollY + 8)
  }, [lookupWord])

  // ── Close popup on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(p => ({ ...p, visible: false }))
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const copyTerm = (amharic: string, id: string) => {
    navigator.clipboard.writeText(amharic).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 1500) })
  }

  const addTermAsNote = (entry: GlossaryResult) => {
    setNotes(n => [{
      id: Date.now().toString(),
      text: `${entry.english_term} = ${entry.amharic_term}`,
      tag: 'term',
      ts: new Date(),
      pinned: false,
    }, ...n])
    setPopup(p => ({ ...p, visible: false }))
    setQuery('')
    setSearchResults([])
  }

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.ts.getTime() - a.ts.getTime()
  })

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 120px', position: 'relative' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1f3e, #2d2f5e)',
        padding: '16px 20px 18px',
        borderRadius: '0 0 24px 24px',
        marginBottom: 16,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              📝 Live Call Note Assistant
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
              Advanced digital notepad · Highlight any word for instant translation
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {notes.length > 0 && (
              <button onClick={copyAll} style={{
                padding: '8px 14px', background: copiedAll ? '#059669' : 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: 99, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {copiedAll ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy All</>}
              </button>
            )}
            {notes.length > 0 && (
              <button onClick={() => { if (confirm('Clear all notes?')) setNotes([]) }} style={{
                padding: '8px 12px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 99, color: '#fca5a5', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick-note input ─────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        {/* Tag row */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {(Object.keys(TAG_META) as NoteTag[]).map((t, i) => {
            const m = TAG_META[t]
            return (
              <button key={t} onClick={() => setNoteTag(t)} title={`Alt+${i + 1}`} style={{
                flexShrink: 0, padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `2px solid ${noteTag === t ? m.color : 'transparent'}`,
                background: noteTag === t ? m.bg : 'var(--surface)',
                color: noteTag === t ? m.color : 'var(--text-muted)',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
                {m.emoji} {m.label}
                <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.5 }}>Alt+{i + 1}</span>
              </button>
            )
          })}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={noteInputRef}
            className="input"
            placeholder={`${TAG_META[noteTag].emoji} Type a note… (Enter to save · abbreviations auto-expand)`}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={handleNoteKeyDown}
            style={{ flex: 1, fontSize: 15, borderRadius: 14 }}
            autoFocus
          />
          <button onClick={addNote} disabled={!noteText.trim()} style={{
            width: 48, height: 48, flexShrink: 0,
            background: noteText.trim() ? `linear-gradient(135deg, ${TAG_META[noteTag].color}, ${TAG_META[noteTag].color}cc)` : 'var(--surface-alt)',
            border: 'none', borderRadius: 14, cursor: noteText.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}>
            <Plus size={20} color={noteText.trim() ? '#fff' : 'var(--text-muted)'} />
          </button>
        </div>

        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span><Keyboard size={10} style={{ verticalAlign: 'middle' }} /> <strong>Enter</strong> = save</span>
          <span><strong>Space</strong> after abbrev. = expand (pt→patient, dx→diagnosis…)</span>
          <span><strong>Select text</strong> in notes = instant translation popup</span>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', background: 'var(--surface-alt)', borderRadius: 14, padding: 4, gap: 4 }}>
          {(['notes', 'search'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '9px', background: activeTab === tab ? 'var(--surface)' : 'transparent',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
              color: activeTab === tab ? 'var(--brand-600)' : 'var(--text-muted)',
              cursor: 'pointer', boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
            }}>
              {tab === 'notes'
                ? <><Tag size={14} /> Notes {notes.length > 0 && <span style={{ background: 'var(--brand-500)', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 11 }}>{notes.length}</span>}</>
                : <><Search size={14} /> Lookup</>
              }
            </button>
          ))}
        </div>
      </div>

      {/* ── NOTES TAB ────────────────────────────────────────────────── */}
      {activeTab === 'notes' && (
        <div ref={noteListRef} style={{ padding: '0 16px' }} onMouseUp={handleTextSelect}>
          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Ready to take notes</p>
              <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 320, margin: '0 auto' }}>
                Type in the bar above and press <strong>Enter</strong> to save.<br />
                <strong>Select / highlight</strong> any word in your notes to instantly see its meaning and Amharic translation.
              </p>
            </div>
          ) : (
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
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    boxShadow: note.pinned ? `0 0 0 2px ${m.color}20` : 'var(--shadow-sm)',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: m.bg, color: m.color }}>
                          {m.emoji} {m.label}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={10} /> {timeStr(note.ts)}
                        </span>
                        {note.pinned && <span style={{ fontSize: 10, fontWeight: 700, color: m.color }}>📌 Pinned</span>}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word', userSelect: 'text', cursor: 'text' }}>
                        {note.text}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => togglePin(note.id)} title={note.pinned ? 'Unpin' : 'Pin'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, fontSize: 14, color: note.pinned ? m.color : 'var(--text-muted)', borderRadius: 8 }}>
                        📌
                      </button>
                      <button onClick={() => deleteNote(note.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, color: 'var(--text-muted)', borderRadius: 8 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SEARCH TAB ───────────────────────────────────────────────── */}
      {activeTab === 'search' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Type any English or Amharic term…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 40, fontSize: 16, borderRadius: 14, height: 50 }}
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); setSearchResults([]) }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {searching && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 14 }}>Searching…</div>}

          {!searching && !query && (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
              <BookOpen size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Quick Glossary Lookup</p>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                Or <strong>select/highlight</strong> any word in your notes on the Notes tab for an automatic popup translation.
              </p>
            </div>
          )}

          {!searching && query && searchResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
              No results for <strong>"{query}"</strong>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {searchResults.map(entry => (
              <div key={entry.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', marginBottom: 2 }}>{entry.english_term}</div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--brand-600)' }}>{entry.amharic_term}</div>
                  {entry.definition && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                      {entry.definition.slice(0, 90)}{entry.definition.length > 90 ? '…' : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => copyTerm(entry.amharic_term, entry.id)} style={{
                    padding: '6px 12px', background: copiedId === entry.id ? '#ecfdf5' : 'var(--surface-alt)',
                    border: `1.5px solid ${copiedId === entry.id ? '#6ee7b7' : 'var(--border)'}`,
                    borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    color: copiedId === entry.id ? '#059669' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}>
                    {copiedId === entry.id ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                  <button onClick={() => addTermAsNote(entry)} style={{
                    padding: '6px 12px', background: 'var(--brand-50)', border: '1.5px solid var(--brand-200)',
                    borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--brand-700)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}>
                    <Plus size={12} /> Note
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HIGHLIGHT-TO-TRANSLATE POPUP ─────────────────────────────── */}
      {popup.visible && (
        <div ref={popupRef} style={{
          position: 'absolute',
          top: popup.y,
          left: Math.max(12, Math.min(popup.x - 160, window.innerWidth - 340)),
          width: 320,
          background: 'var(--surface)',
          borderRadius: 18,
          boxShadow: '0 16px 48px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)',
          border: '1.5px solid var(--border)',
          zIndex: 200,
          overflow: 'hidden',
          animation: 'popupIn 0.18s ease',
        }}>
          {/* Popup header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px', borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={12} />
              <em style={{ color: 'var(--text-primary)' }}>"{popup.word}"</em>
            </div>
            <button onClick={() => setPopup(p => ({ ...p, visible: false }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              <X size={14} />
            </button>
          </div>

          {/* Popup content */}
          <div style={{ padding: '8px 0', maxHeight: 260, overflowY: 'auto' }}>
            {popup.loading && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>Looking up…</div>
            )}
            {!popup.loading && popup.results.length === 0 && (
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No glossary entry found for this term.
                </p>
                <button onClick={() => { setQuery(popup.word); setActiveTab('search'); setPopup(p => ({ ...p, visible: false })) }}
                  style={{ marginTop: 8, fontSize: 12, color: 'var(--brand-600)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Search size={12} /> Search the full glossary →
                </button>
              </div>
            )}
            {popup.results.map(entry => (
              <div key={entry.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{entry.english_term}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--brand-600)', marginBottom: entry.definition ? 4 : 0 }}>{entry.amharic_term}</div>
                {entry.definition && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{entry.definition.slice(0, 100)}{entry.definition.length > 100 ? '…' : ''}</div>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={() => copyTerm(entry.amharic_term, entry.id + '_popup')} style={{
                    padding: '5px 10px', background: copiedId === entry.id + '_popup' ? '#ecfdf5' : 'var(--surface-alt)',
                    border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    color: copiedId === entry.id + '_popup' ? '#059669' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Copy size={11} /> Copy Amharic
                  </button>
                  <button onClick={() => addTermAsNote(entry)} style={{
                    padding: '5px 10px', background: 'var(--brand-50)', border: '1.5px solid var(--brand-200)',
                    borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--brand-700)', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Plus size={11} /> Add to Notes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        padding: '10px 20px', textAlign: 'center', fontSize: 11,
        color: 'var(--text-muted)', fontWeight: 500, zIndex: 50,
      }}>
        📝 Digital Notepad · Select text in notes for instant translation · Notes saved locally
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        @keyframes popupIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </main>
  )
}
