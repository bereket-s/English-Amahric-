'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Pin, Download, Tag, Filter } from 'lucide-react'
import Link from 'next/link'

type NoteEntry = { ts: number; text: string; tag: string; pinned: boolean }
type Session = { id: string; title: string; content: NoteEntry[]; created_at: string }

const TAG_COLORS: Record<string, string> = {
  name: '#6366f1', phone: '#10b981', address: '#3b82f6',
  account: '#8b5cf6', medical: '#ef4444', term: '#f59e0b', important: '#ec4899', general: '#6b7280',
}
const TAG_LABELS: Record<string, string> = {
  name: '👤 Name', phone: '📞 Phone', address: '🏠 Address',
  account: '💳 Account', medical: '🏥 Medical', term: '📖 Term', important: '❗ Important', general: '📝 General',
}
const ALL_TAGS = Object.keys(TAG_LABELS)

function fmtTs(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

export default function NoteDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [session, setSession] = useState<Session | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage first
    const raw = localStorage.getItem('note_sessions') || '[]'
    try {
      const sessions: Session[] = JSON.parse(raw)
      const found = sessions.find(s => s.id === id)
      if (found) { setSession(found); setLoading(false) }
    } catch {}

    // Fetch from server
    fetch(`/api/notes?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.session) { setSession(d.session); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [id])

  const exportTxt = () => {
    if (!session) return
    const lines = [`${session.title}`, `${new Date(session.created_at).toLocaleString()}`, '─'.repeat(40), '']
    const grouped: Record<string, NoteEntry[]> = {}
    session.content.forEach(e => { if (!grouped[e.tag]) grouped[e.tag] = []; grouped[e.tag].push(e) })
    Object.entries(grouped).forEach(([tag, entries]) => {
      lines.push(`\n[${TAG_LABELS[tag] || tag}]`)
      entries.forEach(e => lines.push(`  ${fmtTs(e.ts)} ${e.pinned ? '📌 ' : ''}${e.text}`))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${session.title}.txt`; a.click()
  }

  if (loading) return <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}><div className="skeleton" style={{ height: 400 }} /></main>
  if (!session) return <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}><p>Session not found.</p><Link href="/notes" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>← Back to Notes</Link></main>

  const filtered = filterTag ? session.content.filter(e => e.tag === filterTag) : session.content

  // Auto-summarize special fields
  const phones = session.content.filter(e => e.tag === 'phone').map(e => e.text)
  const accounts = session.content.filter(e => e.tag === 'account').map(e => e.text)
  const names = session.content.filter(e => e.tag === 'name').map(e => e.text)
  const addresses = session.content.filter(e => e.tag === 'address').map(e => e.text)
  const pinned = session.content.filter(e => e.pinned)
  const hasSummary = phones.length > 0 || accounts.length > 0 || names.length > 0 || addresses.length > 0 || pinned.length > 0

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link href="/notes" style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            ← All Notes
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{session.title}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(session.created_at).toLocaleString()} · {session.content.length} notes</p>
        </div>
        <button onClick={exportTxt} className="btn btn-secondary btn-sm">
          <Download size={14} /> Export TXT
        </button>
      </div>

      {/* Auto-summary panel */}
      {hasSummary && (
        <div className="card" style={{ marginBottom: 24, background: 'var(--brand-50)', borderColor: 'var(--brand-200)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--brand-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag size={16} /> Quick Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {names.length > 0 && <SummaryGroup label="👤 Names" items={names} color="#6366f1" />}
            {phones.length > 0 && <SummaryGroup label="📞 Phone Numbers" items={phones} color="#10b981" />}
            {accounts.length > 0 && <SummaryGroup label="💳 Account Numbers" items={accounts} color="#8b5cf6" />}
            {addresses.length > 0 && <SummaryGroup label="🏠 Addresses" items={addresses} color="#3b82f6" />}
            {pinned.length > 0 && <SummaryGroup label="📌 Pinned" items={pinned.map(e => e.text)} color="#f59e0b" />}
          </div>
        </div>
      )}

      {/* Filter by tag */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={15} color="var(--text-muted)" />
        <button onClick={() => setFilterTag(null)} className="btn btn-sm" style={{ borderRadius: 99, background: !filterTag ? 'var(--brand-50)' : 'var(--surface-alt)', color: !filterTag ? 'var(--brand-600)' : 'var(--text-muted)', border: `1.5px solid ${!filterTag ? 'var(--brand-300)' : 'transparent'}` }}>All</button>
        {ALL_TAGS.filter(t => session.content.some(e => e.tag === t)).map(t => (
          <button key={t} onClick={() => setFilterTag(t === filterTag ? null : t)}
            className="btn btn-sm"
            style={{ borderRadius: 99, background: filterTag === t ? `${TAG_COLORS[t]}18` : 'var(--surface-alt)', color: filterTag === t ? TAG_COLORS[t] : 'var(--text-muted)', border: `1.5px solid ${filterTag === t ? TAG_COLORS[t] : 'transparent'}`, fontWeight: filterTag === t ? 700 : 400 }}>
            {TAG_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Note entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No notes with this tag.</p>}
        {filtered.map((entry, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px',
            borderRadius: 14, background: 'var(--surface)', border: `1.5px solid ${entry.pinned ? '#fcd34d' : 'var(--border)'}`,
            borderLeft: `4px solid ${TAG_COLORS[entry.tag] || '#6b7280'}`,
          }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, paddingTop: 2, minWidth: 38 }}>
              {fmtTs(entry.ts)}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${TAG_COLORS[entry.tag]}18`, color: TAG_COLORS[entry.tag] }}>
                  {TAG_LABELS[entry.tag] || entry.tag}
                </span>
                {entry.pinned && <Pin size={13} style={{ marginLeft: 8, color: '#f59e0b', display: 'inline' }} />}
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.5 }}>{entry.text}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

function SummaryGroup({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div>
      <p style={{ fontSize: 11.5, fontWeight: 700, color, marginBottom: 6 }}>{label}</p>
      {items.map((item, i) => (
        <p key={i} style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', padding: '2px 0', borderBottom: '1px dashed var(--border)' }}>{item}</p>
      ))}
    </div>
  )
}
