'use client'

import { useState, useRef, useEffect } from 'react'
import { Brain, Play, RotateCcw, Activity } from 'lucide-react'
import Link from 'next/link'

const CHUNKS = [
  { level: 1, type: 'numbers', text: '5 5 5, 8 1 2, 4 4 9 9' },
  { level: 1, type: 'mixed', text: 'John Smith, October 12, 1980' },
  { level: 2, type: 'mixed', text: 'Policy number is A D X 4 4 7 1' },
  { level: 2, type: 'address', text: '1 2 4 4 West Washington Boulevard, Apartment 4 B' },
  { level: 3, type: 'medical', text: 'I have a headache, a sore throat, fever, and chills.' },
  { level: 3, type: 'mixed', text: 'Confirmation number 8 9 9 B H, appointment is Tuesday at 4:30 PM.' },
  { level: 4, type: 'dense', text: 'Dr. Johnson prescribed 50 milligrams of Losartan to be taken twice a day with food.' },
]

export default function LLSMemoryDrillPage() {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [input, setInput] = useState('')
  const [score, setScore] = useState<number | null>(null)
  
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  const currentChunk = CHUNKS[index]

  const speak = () => {
    if (!currentChunk) return
    setStarted(true)
    setSubmitted(false)
    setInput('')
    window.speechSynthesis.cancel()
    
    const utt = new SpeechSynthesisUtterance(currentChunk.text)
    utt.rate = 1.1 // Slightly fast to simulate real conditions
    utt.onstart = () => setPlaying(true)
    utt.onend = () => setPlaying(false)
    
    synthRef.current = utt
    window.speechSynthesis.speak(utt)
  }

  const checkAnswer = () => {
    // Basic fuzzy scoring based on word tokens
    const targetWords = currentChunk.text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')
    const inputWords = input.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')
    
    let matches = 0
    targetWords.forEach(w => {
      if (inputWords.includes(w)) matches++
    })
    
    setScore(Math.round((matches / targetWords.length) * 100))
    setSubmitted(true)
  }

  const next = () => {
    setIndex(i => (i + 1) % CHUNKS.length)
    setStarted(false)
    setSubmitted(false)
    setInput('')
    setScore(null)
  }

  // Cleanup
  useEffect(() => {
    return () => window.speechSynthesis.cancel()
  }, [])

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/lls" className="btn btn-ghost btn-sm" style={{ padding: 0, color: 'var(--brand-600)', marginBottom: 8 }}>← LLS Training Suite</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Brain size={26} color="var(--brand-500)" /> Memory & Chunking Drills
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>
          Train your short-term memory to hold dense bursts of names, numbers, and lists without taking notes.
        </p>
      </div>

      <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <span className="badge badge-muted">Level {currentChunk.level}</span>
          <span className="badge badge-warning" style={{ textTransform: 'uppercase' }}>{currentChunk.type}</span>
          <span className="badge badge-muted">{index + 1} / {CHUNKS.length}</span>
        </div>

        {!started ? (
           <div className="animate-in">
             <Brain size={48} color="var(--brand-300)" style={{ margin: '0 auto 20px' }} />
             <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Ready for the burst?</h2>
             <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
               The AI will speak a dense chunk of information. Listen carefully, do not write anything down, and try to type it out from memory after it finishes.
             </p>
             <button onClick={speak} className="btn btn-primary btn-lg" style={{ margin: '0 auto' }}>
               <Play size={18} /> Play Audio Burst
             </button>
           </div>
        ) : (
          <div className="animate-in">
            {playing ? (
              <div style={{ padding: '40px 0' }}>
                <Activity size={48} color="var(--brand-500)" className="animate-pulse" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-600)' }}>Listening...</h2>
              </div>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
                  What did you hear?
                </label>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={submitted}
                  autoFocus
                  style={{
                    width: '100%', minHeight: 100, padding: 16, fontSize: 16, borderRadius: 12,
                    border: '1.5px solid var(--border)', fontFamily: 'inherit', resize: 'none',
                    background: submitted ? 'var(--surface-alt)' : 'var(--surface)'
                  }}
                  placeholder="Type the exact details from memory..."
                />
                
                {!submitted ? (
                  <button onClick={checkAnswer} disabled={!input} className="btn btn-primary" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
                    Check Memory
                  </button>
                ) : (
                  <div className="animate-bounceIn" style={{ marginTop: 24, padding: 20, background: 'var(--brand-50)', borderRadius: 12, border: '1px solid var(--brand-200)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-700)', marginBottom: 8 }}>Target Text:</h3>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>"{currentChunk.text}"</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: score! >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                        {score}% <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>match</span>
                      </div>
                      <button onClick={next} className="btn btn-primary">
                        Next Drill →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
