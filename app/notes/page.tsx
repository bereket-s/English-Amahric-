'use client'

import { useEffect, useState } from 'react'
import { NotebookPen, Plus, Clock, Tag, Trash2, BookmarkCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type Session = {
  id: string
  title: string
  content: NoteEntry[]
  created_at: string
  updated_at: string
}

export type NoteEntry = {
  ts: number        // seconds elapsed in session
  text: string
  tag: string
  pinned: boolean
}

const TAG_COLORS: Record<string, string> = {
  name: '#6366f1', phone: '#10b981', address: '#3b82f6',
  account: '#8b5cf6', medical: '#ef4444', term: '#f59e0b', important: '#ec4899', general: '#6b7280',
}
const TAG_LABELS: Record<string, string> = {
  name: '👤 Name', phone: '📞 Phone', address: '🏠 Address',
  account: '💳 Account', medical: '🏥 Medical', term: '📖 Term', important: '❗ Important', general: '📝 General',
}

export default function NotesHubPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage (offline-first)
    const raw = localStorage.getItem('note_sessions')
    if (raw) {
      try { setSessions(JSON.parse(raw)) } catch {}
    }
    // Also try to load from server
    fetch('/api/notes')
      .then(r => r.json())
      .then(d => {
        if (d.sessions) {
          setSessions(d.sessions)
          localStorage.setItem('note_sessions', JSON.stringify(d.sessions))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    setTimeout(() => setLoading(false), 600)
  }, [])

  const deleteSession = (id: string) => {
    const next = sessions.filter(s => s.id !== id)
    setSessions(next)
    localStorage.setItem('note_sessions', JSON.stringify(next))
    fetch(`/api/notes?id=${id}`, { method: 'DELETE' }).catch(() => {})
  }

  const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotebookPen size={26} color="var(--brand-500)" /> Notes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>
            Fast keyboard-based note sessions — capture names, numbers, terms while listening.
          </p>
        </div>
        <Link href="/notes/new" className="btn btn-primary btn-lg">
          <Plus size={18} /> New Session
        </Link>
      </div>

      {/* Quick-access sub-pages */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <Link href="/notes/abbreviations" className="btn btn-secondary btn-sm">📖 Abbreviation Library</Link>
        <Link href="/notes/tips" className="btn btn-secondary btn-sm">💡 Tips & Practice</Link>
      </div>

      {loading && (
        <div style={{ display: 'grid', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--text-muted)' }}>
          <NotebookPen size={40} style={{ opacity: 0.25, marginBottom: 16 }} />
          <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No note sessions yet</p>
          <p style={{ fontSize: 13, marginBottom: 20 }}>Start a new session and begin capturing notes while you listen.</p>
          <Link href="/notes/new" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={16} /> Start First Session
          </Link>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {sessions.map(session => {
            const pinned = session.content.filter(e => e.pinned).length
            const tagCounts: Record<string, number> = {}
            session.content.forEach(e => { if (e.tag !== 'general') tagCounts[e.tag] = (tagCounts[e.tag] || 0) + 1 })
            return (
              <div key={session.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <p style={{ fontWeight: 700, fontSize: 16 }}>{session.title}</p>
                    {pinned > 0 && <span className="badge badge-warning" style={{ fontSize: 11 }}>📌 {pinned} pinned</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {fmt(session.created_at)}
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag size={12} /> {session.content.length} notes
                    </span>
                    {Object.entries(tagCounts).slice(0, 3).map(([tag, count]) => (
                      <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: `${TAG_COLORS[tag]}20`, color: TAG_COLORS[tag], fontWeight: 600 }}>
                        {TAG_LABELS[tag]?.split(' ')[0]} {count}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/notes/${session.id}`} className="btn btn-secondary btn-sm">
                    <ExternalLink size={14} /> View
                  </Link>
                  <button onClick={() => deleteSession(session.id)} className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #fecaca' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
