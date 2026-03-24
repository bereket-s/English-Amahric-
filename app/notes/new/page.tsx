'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Pin, Trash2, Save, ChevronDown, ChevronUp, Keyboard, Type } from 'lucide-react'
import { BUILT_IN_ABBREVIATIONS } from '../../../src/lib/abbreviations'
import Link from 'next/link'

type NoteEntry = {
  id: string
  ts: number
  text: string
  tag: string
  pinned: boolean
}

const TAGS = [
  { key: 'name',      label: '👤 Name',     color: '#6366f1', shortcut: 'Alt+N' },
  { key: 'phone',     label: '📞 Phone',    color: '#10b981', shortcut: 'Alt+P' },
  { key: 'address',   label: '🏠 Address',  color: '#3b82f6', shortcut: 'Alt+A' },
  { key: 'account',   label: '💳 Account',  color: '#8b5cf6', shortcut: 'Alt+C' },
  { key: 'medical',   label: '🏥 Medical',  color: '#ef4444', shortcut: 'Alt+M' },
  { key: 'term',      label: '📖 Term',     color: '#f59e0b', shortcut: 'Alt+T' },
  { key: 'important', label: '❗ Important', color: '#ec4899', shortcut: 'Alt+!' },
  { key: 'general',   label: '📝 General',  color: '#6b7280', shortcut: '' },
]

function fmtElapsed(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function uid() { return Math.random().toString(36).slice(2) }

export default function NewNotePage() {
  const [title, setTitle] = useState('Untitled Session')
  const [input, setInput] = useState('')
  const [tag, setTag] = useState('general')
  const [entries, setEntries] = useState<NoteEntry[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const startTime = useRef(Date.now())
  const sessionId = useRef(uid())

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-save to localStorage every 5 seconds
  useEffect(() => {
    const id = setInterval(() => {
      if (entries.length === 0) return
      saveLocal()
    }, 5000)
    return () => clearInterval(id)
  }, [entries, title])

  const saveLocal = () => {
    const raw = localStorage.getItem('note_sessions') || '[]'
    let sessions: any[] = []
    try { sessions = JSON.parse(raw) } catch {}
    const now = new Date().toISOString()
    const existing = sessions.findIndex((s: any) => s.id === sessionId.current)
    const session = {
      id: sessionId.current,
      title,
      content: entries.map(({ id: _id, ...rest }) => rest),
      created_at: sessions[existing]?.created_at || now,
      updated_at: now,
    }
    if (existing >= 0) sessions[existing] = session
    else sessions.unshift(session)
    localStorage.setItem('note_sessions', JSON.stringify(sessions))
  }

  // Abbreviation expansion (Tab key)
  const expandAbbr = (text: string): string => {
    const words = text.split(' ')
    const last = words[words.length - 1].toLowerCase()
    const match = BUILT_IN_ABBREVIATIONS.find(a => a.abbr === last)
    if (match) {
      words[words.length - 1] = match.expansion
      return words.join(' ')
    }
    // Also check custom abbreviations in localStorage
    const raw = localStorage.getItem('custom_abbreviations') || '[]'
    try {
      const custom: { abbr: string; expansion: string }[] = JSON.parse(raw)
      const cm = custom.find(a => a.abbr === last)
      if (cm) { words[words.length - 1] = cm.expansion; return words.join(' ') }
    } catch {}
    return text
  }

  const addEntry = useCallback(() => {
    const text = input.trim()
    if (!text) return
    const entry: NoteEntry = { id: uid(), ts: elapsed, text, tag, pinned: false }
    setEntries(prev => {
      const next = [entry, ...prev]
      return next
    })
    setInput('')
    setSaved(false)
    inputRef.current?.focus()
  }, [input, tag, elapsed])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addEntry(); return }
    if (e.key === 'Tab') { e.preventDefault(); setInput(expandAbbr(input)); return }
    if (e.altKey) {
      const map: Record<string, string> = { 'n': 'name', 'p': 'phone', 'a': 'address', 'c': 'account', 'm': 'medical', 't': 'term', '1': 'important' }
      const mapped = map[e.key.toLowerCase()]
      if (mapped) { e.preventDefault(); setTag(mapped) }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      setEntries(prev => {
        if (prev.length === 0) return prev
        const [removed, ...rest] = prev
        setInput(removed.text)
        return rest
      })
    }
  }

  const togglePin = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e))
    setSaved(false)
  }

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    setSaved(false)
  }

  const editText = (id: string, text: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, text } : e))
    setSaved(false)
  }

  const saveCloud = async () => {
    setSaving(true)
    saveLocal()
    const now = new Date().toISOString()
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId.current,
          title,
          content: entries.map(({ id: _id, ...rest }) => rest),
          created_at: now,
          updated_at: now,
        }),
      })
      setSaved(true)
    } catch {}
    setSaving(false)
  }

  const currentTagInfo = TAGS.find(t => t.key === tag)!

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 80px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 22, fontWeight: 800, flex: 1, minWidth: 200, color: 'var(--text-primary)' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 18, fontVariantNumeric: 'tabular-nums', color: 'var(--brand-500)' }}>⏱ {fmtElapsed(elapsed)}</span>
          <button onClick={saveCloud} disabled={saving || entries.length === 0} className="btn btn-secondary btn-sm">
            <Save size={14} /> {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
          </button>
          <Link href="/notes" className="btn btn-ghost btn-sm">← Back</Link>
        </div>
      </div>

      {/* Shortcuts panel toggle */}
      <button onClick={() => setShowShortcuts(s => !s)} className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
        <Keyboard size={14} /> Keyboard Shortcuts {showShortcuts ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {showShortcuts && (
        <div className="card animate-in" style={{ marginBottom: 16, padding: 16, background: 'var(--surface-alt)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '6px 24px', fontSize: 12.5 }}>
            {[
              ['Enter', 'Save current note'],
              ['Tab', 'Expand abbreviation (e.g. bp → blood pressure)'],
              ['Ctrl+Z', 'Undo last note (restores to input)'],
              ['Alt+N', 'Tag as Name'], ['Alt+P', 'Tag as Phone'],
              ['Alt+A', 'Tag as Address'], ['Alt+C', 'Tag as Account'],
              ['Alt+M', 'Tag as Medical'], ['Alt+T', 'Tag as Term'],
              ['Alt+1', 'Tag as Important'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <code style={{ background: '#e0e7ff', color: '#3730a3', padding: '1px 7px', borderRadius: 6, fontWeight: 700, flexShrink: 0, fontSize: 11 }}>{k}</code>
                <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <Link href="/notes/abbreviations" style={{ color: 'var(--brand-600)', fontWeight: 600, fontSize: 12 }}>📖 View all abbreviations →</Link>
            </div>
          </div>
        </div>
      )}

      {/* Tag selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {TAGS.map(t => (
          <button key={t.key} onClick={() => setTag(t.key)}
            style={{
              padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              border: `2px solid ${tag === t.key ? t.color : 'transparent'}`,
              background: tag === t.key ? `${t.color}20` : 'var(--surface-alt)',
              color: tag === t.key ? t.color : 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            autoFocus
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type note → Enter to save · Tab to expand abbreviation…"
            style={{ fontSize: 15, paddingRight: 80, borderColor: currentTagInfo.color, boxShadow: `0 0 0 2px ${currentTagInfo.color}25` }}
          />
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: currentTagInfo.color, fontWeight: 700, pointerEvents: 'none' }}>
            {currentTagInfo.label}
          </div>
        </div>
        <button onClick={addEntry} className="btn btn-primary" style={{ background: `linear-gradient(135deg, ${currentTagInfo.color}, ${currentTagInfo.color}cc)` }}>
          <Type size={16} /> Add
        </button>
      </div>

      {/* Notes feed */}
      {entries.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 14 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎧</div>
          Start typing notes above. Press <strong>Enter</strong> to log each one.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map(entry => {
          const tInfo = TAGS.find(t => t.key === entry.tag)!
          return (
            <div key={entry.id} className="animate-in" style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px',
              borderRadius: 14, background: 'var(--surface)', border: `1.5px solid ${entry.pinned ? '#fcd34d' : 'var(--border)'}`,
              borderLeft: `4px solid ${tInfo.color}`,
              boxShadow: entry.pinned ? '0 2px 12px rgba(245,158,11,0.15)' : 'var(--shadow-sm)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, paddingTop: 3, minWidth: 38 }}>
                {fmtElapsed(entry.ts)}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${tInfo.color}18`, color: tInfo.color }}>
                    {tInfo.label}
                  </span>
                  {entry.pinned && <span style={{ marginLeft: 6, fontSize: 13 }}>📌</span>}
                </div>
                {editingId === entry.id ? (
                  <input
                    autoFocus
                    className="input"
                    defaultValue={entry.text}
                    onBlur={e => { editText(entry.id, e.target.value); setEditingId(null) }}
                    onKeyDown={e => e.key === 'Enter' && (editText(entry.id, e.currentTarget.value), setEditingId(null))}
                    style={{ padding: '4px 8px', fontSize: 14 }}
                  />
                ) : (
                  <p onClick={() => setEditingId(entry.id)} style={{ fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.5, cursor: 'text' }}>
                    {entry.text}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => togglePin(entry.id)} title="Pin" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: entry.pinned ? '#f59e0b' : 'var(--text-muted)', fontSize: 16 }}>
                  <Pin size={15} />
                </button>
                <button onClick={() => deleteEntry(entry.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'var(--text-muted)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
