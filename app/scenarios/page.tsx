'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Search, X, Layers, PlayCircle, Loader2 } from 'lucide-react'

type Scenario = {
  id: string
  title: string
  level?: string | null
  topic?: string | null
  source_type: string
}

export default function ScenariosListPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('')
  const [topic, setTopic] = useState('')

  const loadScenarios = async (selLevel = '', selTopic = '') => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (selLevel) params.set('level', selLevel)
      if (selTopic) params.set('topic', selTopic)
      const url = params.toString() ? `/api/scenarios?${params}` : '/api/scenarios'
      const res = await fetch(url)
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to load scenarios')
      setScenarios(result.scenarios || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setScenarios([])
    } finally { setLoading(false) }
  }

  useEffect(() => { loadScenarios() }, [])

  const filtered = scenarios.filter(s => {
    if (query && !s.title.toLowerCase().includes(query.toLowerCase()) && !(s.topic && s.topic.toLowerCase().includes(query.toLowerCase()))) return false
    return true
  })

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title" style={{ fontSize: '26px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={26} color="var(--brand-500)" /> Scenario Practice
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Practice real, turn-by-turn interpretation dialogues with AI feedback.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search scenarios…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select value={level} onChange={e => { setLevel(e.target.value); loadScenarios(e.target.value, topic) }} className="input select" style={{ width: '130px' }}>
          <option value="">All Levels</option>
          <option value="L2">L2</option>
          <option value="L3">L3</option>
          <option value="L4">L4</option>
        </select>
        {(query || level || topic) && (
          <button onClick={() => { setQuery(''); setLevel(''); setTopic(''); loadScenarios('', '') }} className="btn btn-ghost">
            <X size={15} /> Clear
          </button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '140px' }} />)}
        </div>
      )}

      {error && <p style={{ color: 'var(--danger)', padding: '14px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)' }}>{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <BookOpen size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No scenarios found.</p>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>Upload a scenario JSON on the Study page to get started.</p>
          <a href="/study" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>Go to Upload</a>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map(s => (
            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  {s.level && <span className="badge badge-brand">{s.level}</span>}
                  {s.topic && <span className="badge badge-muted">{s.topic}</span>}
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>{s.title}</h2>
              </div>
              
              <div style={{ marginTop: '20px', display: 'flex' }}>
                <a href={`/scenarios/${s.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  <PlayCircle size={15} /> Start Scenario
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
