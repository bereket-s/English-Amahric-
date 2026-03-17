'use client'

import { useCallback, useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, ChevronRight, X } from 'lucide-react'

type ExtractedEntry = {
  english_term?: string
  amharic_term?: string
  definition?: string
  english_sentence?: string
  amharic_sentence?: string
}

const SUPPORTED_TYPES = ['PDF', 'DOCX', 'TXT', 'CSV', 'JSON']

export default function StudyPage() {
  const [selectedFile, setSelectedFile]         = useState<File | null>(null)
  const [level, setLevel]                       = useState('')
  const [topic, setTopic]                       = useState('')
  const [message, setMessage]                   = useState('')
  const [messageType, setMessageType]           = useState<'success' | 'error' | ''>('')
  const [pages, setPages]                       = useState<number | null>(null)
  const [extractedEntriesCount, setExtractedCount]   = useState(0)
  const [extractedEntriesPreview, setExtractedPreview] = useState<ExtractedEntry[]>([])
  const [uploading, setUploading]               = useState(false)
  const [isDragOver, setIsDragOver]             = useState(false)

  const resetState = () => {
    setMessage(''); setMessageType(''); setPages(null)
    setExtractedCount(0); setExtractedPreview([])
  }

  const onFileChange = (file: File | null) => {
    setSelectedFile(file); resetState()
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer.files[0] || null
    onFileChange(file)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) { alert('Please select a file first.'); return }
    setUploading(true); resetState()
    const form = new FormData()
    form.append('file', selectedFile)
    form.append('level', level)
    form.append('topic', topic)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const result = await res.json()
      if (!res.ok) {
        setMessage(result.error || 'Upload failed.')
        setMessageType('error')
        return
      }
      setMessage(`Saved ${result.savedEntriesCount || 0} entries from "${result.fileName}"`)
      setMessageType('success')
      setPages(result.parsePages || null)
      setExtractedCount(result.extractedEntriesCount || 0)
      setExtractedPreview(result.extractedEntriesPreview || [])
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed.')
      setMessageType('error')
    } finally { setUploading(false) }
  }

  return (
    <main style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Upload size={26} color="var(--brand-500)" /> Study Upload
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Upload documents to automatically extract English–Amharic terms and save them to your glossary.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('studyFileInput')?.click()}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--brand-500)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          background: isDragOver ? 'var(--brand-50)' : 'var(--surface)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '20px',
        }}
      >
        <input
          id="studyFileInput"
          type="file"
          accept=".pdf,.docx,.txt,.csv,.json"
          style={{ display: 'none' }}
          onChange={e => onFileChange(e.target.files?.[0] || null)}
        />
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>
          {selectedFile ? '📄' : '📂'}
        </div>
        {selectedFile ? (
          <div>
            <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{selectedFile.name}</p>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              {(selectedFile.size / 1024).toFixed(1)} KB · Click to change file
            </p>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onFileChange(null) }}
              className="btn btn-ghost btn-sm"
              style={{ marginTop: '10px' }}
            >
              <X size={14} /> Remove
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>Drag &amp; drop a file here</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '14px' }}>or click to browse</p>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {SUPPORTED_TYPES.map(t => (
                <span key={t} className="badge badge-brand">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Level
          </label>
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            className="input select"
          >
            <option value="">Select level (optional)</option>
            <option value="L2">L2</option>
            <option value="L3">L3</option>
            <option value="L4">L4</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Topic
          </label>
          <input
            type="text"
            value={topic}
            placeholder="e.g. medical, insurance…"
            onChange={e => setTopic(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !selectedFile}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', justifyContent: 'center', opacity: (!selectedFile || uploading) ? 0.6 : 1, cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer' }}
      >
        {uploading ? (
          <><span style={{ animation: 'spin-slow 1s linear infinite', display: 'inline-block' }}>⏳</span> Processing…</>
        ) : (
          <><Upload size={17} /> Upload &amp; Extract Terms</>
        )}
      </button>

      {/* Status message */}
      {message && (
        <div style={{
          marginTop: '16px',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          background: messageType === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          border: `1px solid ${messageType === 'success' ? '#a7f3d0' : '#fecaca'}`,
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }} className="animate-in">
          {messageType === 'success'
            ? <CheckCircle size={18} color="var(--success)" style={{ flexShrink: 0 }} />
            : <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0 }} />}
          <div>
            <p style={{ fontWeight: 600, fontSize: '14px', color: messageType === 'success' ? '#065f46' : '#991b1b' }}>{message}</p>
            {pages && <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pages parsed: {pages}</p>}
            {extractedEntriesCount > 0 && <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Entries extracted: {extractedEntriesCount}</p>}
          </div>
        </div>
      )}

      {/* Extracted preview */}
      {extractedEntriesPreview.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--brand-500)" /> Extracted Entries Preview
            </h2>
            <a href="/glossary" className="btn btn-ghost btn-sm">
              View Glossary <ChevronRight size={14} />
            </a>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {extractedEntriesPreview.map((entry, i) => (
              <div key={i} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <p style={{ fontWeight: 700, fontSize: '15px' }}>{entry.english_term || '—'}</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{entry.amharic_term || '—'}</p>
                  </div>
                  {entry.definition && (
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, flex: '2', minWidth: '200px' }}>
                      {entry.definition}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
