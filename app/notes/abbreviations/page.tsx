'use client'

import { useState, useMemo } from 'react'
import { BookOpen, Search, Plus, Trash2, X } from 'lucide-react'
import { BUILT_IN_ABBREVIATIONS, DOMAIN_LABELS, DOMAIN_COLORS, AbbreviationEntry } from '../../../src/lib/abbreviations'
import Link from 'next/link'

const DOMAINS = ['medical', 'insurance', 'banking', 'general', 'symbols'] as const

function getCustomAbbr(): AbbreviationEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('custom_abbreviations') || '[]') } catch { return [] }
}

function saveCustomAbbr(arr: AbbreviationEntry[]) {
  localStorage.setItem('custom_abbreviations', JSON.stringify(arr))
}

export default function AbbreviationsPage() {
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState<string>('all')
  const [custom, setCustom] = useState<AbbreviationEntry[]>(getCustomAbbr)
  const [showAdd, setShowAdd] = useState(false)
  const [newAbbr, setNewAbbr] = useState('')
  const [newExpansion, setNewExpansion] = useState('')
  const [newDomain, setNewDomain] = useState<AbbreviationEntry['domain']>('general')

  const all = [...BUILT_IN_ABBREVIATIONS, ...custom]

  const filtered = useMemo(() => {
    return all.filter(a => {
      if (domain !== 'all' && a.domain !== domain) return false
      if (query) {
        const q = query.toLowerCase()
        return a.abbr.includes(q) || a.expansion.toLowerCase().includes(q)
      }
      return true
    })
  }, [query, domain, custom])

  const addCustom = () => {
    if (!newAbbr.trim() || !newExpansion.trim()) return
    const entry: AbbreviationEntry = { abbr: newAbbr.trim().toLowerCase(), expansion: newExpansion.trim(), domain: newDomain }
    const next = [...custom, entry]
    setCustom(next)
    saveCustomAbbr(next)
    setNewAbbr(''); setNewExpansion(''); setShowAdd(false)
  }

  const deleteCustom = (abbr: string) => {
    const next = custom.filter(a => a.abbr !== abbr)
    setCustom(next)
    saveCustomAbbr(next)
  }

  const grouped: Record<string, typeof filtered> = {}
  filtered.forEach(a => { if (!grouped[a.domain]) grouped[a.domain] = []; grouped[a.domain].push(a) })

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 8 }}>
            <Link href="/notes" style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 600, textDecoration: 'none' }}>← Notes</Link>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={26} color="var(--brand-500)" /> Abbreviation Library
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>
            {all.length} abbreviations · type any code + <kbd style={{ background: '#e0e7ff', color: '#3730a3', padding: '1px 6px', borderRadius: 5, fontSize: 12, fontWeight: 700 }}>Tab</kbd> in Notes to auto-expand
          </p>
        </div>
        <button onClick={() => setShowAdd(s => !s)} className="btn btn-primary btn-sm">
          <Plus size={15} /> Add Custom
        </button>
      </div>

      {/* Add custom form */}
      {showAdd && (
        <div className="card animate-in" style={{ marginBottom: 20, background: 'var(--brand-50)', borderColor: 'var(--brand-200)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Add Custom Abbreviation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <input className="input" placeholder="Abbr (e.g. cb)" value={newAbbr} onChange={e => setNewAbbr(e.target.value)} style={{ fontSize: 14 }} />
            <input className="input" placeholder="Expansion (e.g. call back)" value={newExpansion} onChange={e => setNewExpansion(e.target.value)} style={{ fontSize: 14 }} />
            <select className="input select" value={newDomain} onChange={e => setNewDomain(e.target.value as any)} style={{ fontSize: 14 }}>
              {DOMAINS.map(d => <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addCustom} className="btn btn-primary btn-sm">Save</button>
            <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm"><X size={14} /> Cancel</button>
          </div>
        </div>
      )}

      {/* Search + Domain filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search abbreviations…" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input select" value={domain} onChange={e => setDomain(e.target.value)} style={{ width: 160 }}>
          <option value="all">All Domains</option>
          {DOMAINS.map(d => <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>)}
        </select>
      </div>

      {/* Results count */}
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
        Showing {filtered.length} abbreviation{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grouped tables */}
      {Object.entries(grouped).map(([dom, items]) => (
        <div key={dom} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: DOMAIN_COLORS[dom as AbbreviationEntry['domain']] }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {DOMAIN_LABELS[dom as AbbreviationEntry['domain']]}
            </h2>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{items.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
            {items.map((item, i) => {
              const isCustom = custom.some(c => c.abbr === item.abbr)
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  background: 'var(--surface)', border: `1.5px solid ${isCustom ? DOMAIN_COLORS[dom as AbbreviationEntry['domain']] + '40' : 'var(--border)'}`,
                  borderRadius: 10,
                }}>
                  <code style={{ fontWeight: 800, fontSize: 13, color: DOMAIN_COLORS[dom as AbbreviationEntry['domain']], background: `${DOMAIN_COLORS[dom as AbbreviationEntry['domain']]}15`, padding: '2px 8px', borderRadius: 6, flexShrink: 0, minWidth: 52, textAlign: 'center' }}>
                    {item.abbr}
                  </code>
                  <span style={{ fontSize: 13.5, color: 'var(--text-primary)', flex: 1 }}>{item.expansion}</span>
                  {isCustom && (
                    <button onClick={() => deleteCustom(item.abbr)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 4px' }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <BookOpen size={32} style={{ opacity: 0.2, marginBottom: 10 }} />
          <p>No abbreviations match your search.</p>
        </div>
      )}
    </main>
  )
}
