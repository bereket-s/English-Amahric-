'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Copy, CheckCircle, PenTool, Book, Stethoscope } from 'lucide-react'
import { PAIN_DESCRIPTORS, COMMON_MEDICINES, ANATOMY, VITAL_SIGNS_AND_PHRASES, ReferenceItem } from '../../src/lib/medical-reference'
import { BUILT_IN_ABBREVIATIONS } from '../../src/lib/abbreviations'

type Tab = 'notes' | 'glossary' | 'references'

const MACROS = [
  { label: '🕒', val: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  { label: 'Dr.', val: 'Dr: ' },
  { label: 'Pt.', val: 'Pt: ' },
  { label: 'Int.', val: 'Int: ' },
  { label: 'Rx', val: 'Prescription ' },
  { label: 'Tx', val: 'Treatment ' },
  { label: 'Hx', val: 'History ' },
  { label: 'DOB', val: 'Date of Birth: ' },
]

export default function MobileLiveAssist() {
  const [activeTab, setActiveTab] = useState<Tab>('notes')
  const [noteText, setNoteText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Glossary state
  const [query, setQuery] = useState('')
  const [glossaryResults, setGlossaryResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Reference Accordion state
  const [openRef, setOpenRef] = useState<string>('pain')

  // Load notes safely
  useEffect(() => {
    try {
      const saved = localStorage.getItem('live_assist_mobile_notes')
      if (saved) setNoteText(saved)
    } catch {}
  }, [])

  // Save notes
  useEffect(() => {
    try {
      localStorage.setItem('live_assist_mobile_notes', noteText)
    } catch {}
  }, [noteText])

  const insertMacro = (val: string | (() => string)) => {
    const textToInsert = typeof val === 'function' ? val() : val
    
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newText = noteText.substring(0, start) + textToInsert + noteText.substring(end)
      setNoteText(newText)
      
      // Move cursor after the inserted text
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
        }
      }, 0)
    } else {
      setNoteText(prev => prev + ' ' + textToInsert)
    }
  }

  // Abbreviation Expander (runs on space)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === ' ') {
      // Find the last word typed
      const cursorPosition = textareaRef.current?.selectionEnd || noteText.length
      const textBeforeCursor = noteText.substring(0, cursorPosition)
      const words = textBeforeCursor.trimEnd().split(/\s+/)
      const lastWord = words[words.length - 1].toLowerCase()
      
      const abbrevs = BUILT_IN_ABBREVIATIONS.reduce((acc, curr) => ({ ...acc, [curr.abbr.toLowerCase()]: curr.expansion }), {} as Record<string,string>)
      
      if (abbrevs[lastWord]) {
        e.preventDefault()
        const textBeforeReplacement = textBeforeCursor.slice(0, textBeforeCursor.lastIndexOf(lastWord))
        const textAfterCursor = noteText.substring(cursorPosition)
        
        const newText = textBeforeReplacement + abbrevs[lastWord] + ' ' + textAfterCursor
        setNoteText(newText)
        
        const newCursorPos = textBeforeReplacement.length + abbrevs[lastWord].length + 1
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          }
        }, 0)
      }
    }
  }

  // Glossary Lookup
  useEffect(() => {
    if (!query.trim()) { setGlossaryResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/glossary?q=${encodeURIComponent(query)}&limit=15`)
        const data = await res.json()
        setGlossaryResults(data.entries || [])
      } catch {}
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  const renderReferenceSection = (id: string, title: string, items: ReferenceItem[]) => {
    const isOpen = openRef === id
    return (
      <div style={{ marginBottom: 12, background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <button 
          onClick={() => setOpenRef(isOpen ? '' : id)}
          style={{ width: '100%', padding: '16px', background: isOpen ? 'var(--surface-alt)' : 'transparent', border: 'none', textAlign: 'left', fontWeight: 800, fontSize: 17, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {title}
          <span style={{ color: 'var(--text-muted)' }}>{isOpen ? '▼' : '▶'}</span>
        </button>
        {isOpen && (
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{item.english}</div>
                {item.examples && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontStyle: 'italic' }}>Examples: {item.examples}</div>}
                <div style={{ color: 'var(--brand-600)', fontWeight: 700, fontSize: 16, margin: '4px 0' }}>{item.amharic}</div>
                {item.phonetic && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.phonetic}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--background)' }}>
      
      {/* Header */}
      <div style={{ padding: '16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>Live Assist</h1>
        {activeTab === 'notes' && noteText && (
           <button 
             onClick={() => { if (confirm('Clear notes?')) setNoteText('') }} 
             style={{ fontSize: 14, fontWeight: 700, color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '6px 12px', borderRadius: 99 }}
           >
             Clear
           </button>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        
        {/* TAB 1: NOTES */}
        <div style={{ display: activeTab === 'notes' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <textarea
            ref={textareaRef}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tap to start taking notes...&#10;&#10;• Type and this will auto-save.&#10;• Use quick buttons below.&#10;• Type abbrev + space to expand (e.g. pt + space)."
            style={{ 
              flex: 1, 
              width: '100%', 
              padding: '20px', 
              fontSize: 18, 
              lineHeight: 1.6, 
              border: 'none', 
              resize: 'none', 
              background: 'transparent',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          
          {/* Toolbelt (Sticky above bottom nav) */}
          <div className="hide-scroll" style={{ 
            display: 'flex', 
            gap: 10, 
            padding: '12px 16px', 
            background: 'var(--surface)', 
            borderTop: '1px solid var(--border)',
            overflowX: 'auto',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
          }}>
            {MACROS.map(m => (
              <button 
                key={m.label} 
                onClick={() => insertMacro(m.val)}
                style={{
                  padding: '10px 18px',
                  background: 'var(--surface-alt)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 16,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  color: 'var(--text-primary)'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 2: GLOSSARY */}
        <div style={{ display: activeTab === 'glossary' ? 'block' : 'none', padding: '16px' }}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
             <Search size={22} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
             <input
               value={query}
               onChange={e => setQuery(e.target.value)}
               placeholder="Search dictionary..."
               style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: 18, borderRadius: 16, border: '1.5px solid var(--border)', background: 'var(--surface)', outline: 'none' }}
             />
             {query && (
               <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4 }}>
                 <X size={20} />
               </button>
             )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {searching && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 16 }}>Searching...</p>}
            
            {!searching && !query && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Book size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Quick Dictionary Lookup</p>
                <p style={{ fontSize: 15, lineHeight: 1.6 }}>Search for any English or Amharic medical term instantly while on your call.</p>
              </div>
            )}

            {!searching && glossaryResults.map((entry: any) => (
              <div key={entry.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{entry.english_term}</div>
                  <div style={{ color: 'var(--brand-600)', fontWeight: 700, fontSize: 17 }}>{entry.amharic_term}</div>
                  {entry.definition && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>{entry.definition}</div>}
                </div>
                <button 
                  onClick={() => copyText(entry.amharic_term, entry.id)}
                  style={{
                    padding: '8px 12px', background: copiedId === entry.id ? '#ecfdf5' : 'var(--surface-alt)',
                    border: `1.5px solid ${copiedId === entry.id ? '#6ee7b7' : 'var(--border)'}`,
                    borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    color: copiedId === entry.id ? '#059669' : 'var(--text-secondary)'
                  }}
                >
                  {copiedId === entry.id ? <CheckCircle size={18} /> : <Copy size={18} />}
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{copiedId === entry.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* TAB 3: REFERENCES */}
        <div style={{ display: activeTab === 'references' ? 'block' : 'none', padding: '16px', background: 'var(--background)' }}>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 500 }}>
            Quickly reference important medical categories translated to Amharic. Tap to expand.
          </p>
          {renderReferenceSection('pain', '🤕 Pain Descriptors', PAIN_DESCRIPTORS)}
          {renderReferenceSection('meds', '💊 Common Medicines', COMMON_MEDICINES)}
          {renderReferenceSection('anatomy', '🦴 Anatomy', ANATOMY)}
          {renderReferenceSection('vitals', '❤️ Vitals & Phrases', VITAL_SIGNS_AND_PHRASES)}
        </div>

      </div>

      {/* Bottom Navigation */}
      <div style={{ 
        display: 'flex', 
        background: 'var(--surface)', 
        borderTop: '1.5px solid var(--border)', 
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
      }}>
        {[
          { id: 'notes', label: 'Notes', icon: PenTool },
          { id: 'glossary', label: 'Dictionary', icon: Book },
          { id: 'references', label: 'References', icon: Stethoscope }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            style={{
              flex: 1,
              padding: '14px 0 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? 'var(--brand-600)' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            <tab.icon size={26} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span style={{ fontSize: 12, fontWeight: activeTab === tab.id ? 800 : 600 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
