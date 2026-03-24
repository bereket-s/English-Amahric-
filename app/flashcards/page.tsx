'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { Layers, RotateCcw, ChevronRight, ChevronLeft, Star, Zap, Trophy, BookOpen, Image as ImageIcon, Volume2 } from 'lucide-react'
import { useWikiImage } from '../../src/lib/useWikiImage'

type Glossary = { id: string; english_term: string; amharic_term: string }

type CardState = 'idle' | 'flipped' | 'know' | 'learning'

export default function FlashcardsPage() {
  const [terms, setTerms] = useState<Glossary[]>([])
  const [deck, setDeck] = useState<Glossary[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [xp, setXp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [known, setKnown] = useState(0)
  const [learning, setLearning] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [showCombo, setShowCombo] = useState(false)

  // Framer Motion physics for swiping
  const controls = useAnimation()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-10, 10])

  // Confetti overlay state
  const [swipeState, setSwipeState] = useState<'know' | 'learning' | null>(null)
  
  // Transform background purely for visual feedback during swipe
  const dragBackground = useTransform(
    x,
    [-150, 0, 150],
    ['rgba(239, 68, 68, 0.2)', 'rgba(0, 0, 0, 0)', 'rgba(16, 185, 129, 0.2)']
  )

  useEffect(() => {
    fetch('/api/glossary?limit=40')
      .then(r => r.json())
      .then(d => {
        const t = d.entries || []
        const shuffled = [...t].sort(() => Math.random() - 0.5)
        setTerms(shuffled)
        setDeck(shuffled)
        setLoading(false)
      })
  }, [])

  const card = deck[index]
  const { imageUrl, loading: imageLoading } = useWikiImage(card?.english_term || '')

  const handleClick = (e?: React.MouseEvent) => {
    // If the click was on the volume button, do not flip the card
    if ((e?.target as Element)?.closest('.volume-btn')) return
    
    setFlipped(f => !f)
  }

  const playAudio = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-US'
    utt.rate = 0.9
    window.speechSynthesis.speak(utt)
  }

  const next = async (outcome: 'know' | 'learning') => {
    if (!deck[index]) return
    const id = deck[index].id
    
    // Animate out
    await controls.start({ 
      x: outcome === 'know' ? 300 : -300, 
      opacity: 0, 
      transition: { duration: 0.2 } 
    })

    if (outcome === 'know') {
      const dbStr = localStorage.getItem('known_terms')
      const knownIds = dbStr ? JSON.parse(dbStr) : []
      if (!knownIds.includes(id)) {
        localStorage.setItem('known_terms', JSON.stringify([...knownIds, id]))
        setKnown(k => k + 1)
      }
      setXp(x => x + 10 + (streak > 1 ? streak * 2 : 0))
      setStreak(s => s + 1)
      if (streak + 1 >= 3 && (streak + 1) % 5 !== 0) {
        setShowCombo(true)
        setTimeout(() => setShowCombo(false), 1500)
      }
    } else {
      setLearning(l => l + 1)
      setStreak(0)
      setShowCombo(false)
    }

    setFlipped(false)
    
    // Check if there are more cards or if the session is finished
    if (index + 1 >= deck.length) {
      setFinished(true)
    } else {
      setIndex(index + 1)
      // Reset position for next card
      x.set(0)
      controls.set({ x: 0, opacity: 1, scale: 0.9 })
      controls.start({ scale: 1, transition: { duration: 0.15 } })
    }
  }

  const handleDragEnd = (event: any, info: any) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    if (offset > 100 || velocity > 500) {
      setSwipeState('know')
      next('know')
    } else if (offset < -100 || velocity < -500) {
      setSwipeState('learning')
      next('learning')
    } else {
      // Snap back if not swiped far enough
      controls.start({ x: 0, opacity: 1 })
    }
  }

  const restart = () => {
    const shuffled = [...terms].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setIndex(0)
    setFlipped(false)
    setXp(0)
    setStreak(0)
    setKnown(0)
    setLearning(0)
    setFinished(false)
  }

  const drillLearning = () => {
    const shuffled = [...terms].sort(() => Math.random() - 0.5).slice(0, 20)
    setDeck(shuffled)
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }

  if (loading) return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px 80px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 320, borderRadius: 24 }} />
    </main>
  )

  if (!loading && deck.length === 0) return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Your glossary is empty</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Upload a document or add terms to your glossary to start practicing.</p>
    </main>
  )

  if (finished) return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px 80px', textAlign: 'center' }}>
      <div className="card animate-bounceIn" style={{ padding: '48px 32px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Session Complete!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>You went through all {deck.length} cards</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>{known}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Know It ✓</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{learning}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Still Learning</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#6366f1' }}>{xp}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>XP earned</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={restart} className="btn btn-primary btn-lg">
            <RotateCcw size={17} /> Restart All
          </button>
          {learning > 0 && (
            <button onClick={drillLearning} className="btn btn-secondary btn-lg">
              <Star size={17} /> Drill Weak Cards
            </button>
          )}
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={22} color="var(--brand-500)" /> Flashcards
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-warning" style={{ fontSize: 13, padding: '4px 12px' }}>
            <Zap size={13} /> {xp} XP
          </span>
          {streak >= 2 && (
            <span className="badge badge-danger" style={{ fontSize: 13, padding: '4px 12px' }}>
              🔥 {streak} streak
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
          <span>{index + 1} / {deck.length}</span>
          <span style={{ color: '#10b981' }}>{known} ✓ <span style={{ color: '#f59e0b', marginLeft: 8 }}>{learning} ↺</span></span>
        </div>
        <div style={{ height: 6, background: 'var(--surface-alt)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((index) / deck.length) * 100}%`, background: 'linear-gradient(90deg, var(--brand-500), var(--brand-700))', borderRadius: 999, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Combo burst */}
      {showCombo && (
        <div className="animate-bounceIn" style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#f59e0b', marginBottom: 12 }}>
          🔥 {streak}× COMBO! +{streak * 2} XP!
        </div>
      )}

      {/* Card */}
      {card && (
        <motion.div
          animate={controls}
          style={{ 
            x, 
            rotate,
            perspective: 1000, 
            cursor: 'grab', 
            marginBottom: 24,
            width: '100%',
            maxWidth: 400,
            margin: '0 auto 24px auto',
            touchAction: 'none'
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
        >
          <motion.div style={{
            background: flipped
              ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
              : 'var(--surface)',
            borderRadius: 24,
            border: '2px solid var(--border)',
            boxShadow: flipped ? '0 12px 24px -10px rgba(79, 70, 229, 0.4)' : '0 12px 24px -10px rgba(0,0,0,0.1)',
            minHeight: '60vh',
            maxHeight: 400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            textAlign: 'center',
            userSelect: 'none',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Swipe hint overlay */}
            <motion.div 
              style={{ position: 'absolute', inset: 0, background: dragBackground, zIndex: 10, pointerEvents: 'none' }} 
            />
            
            {!flipped && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, var(--surface-alt) 0%, var(--surface) 100%)', zIndex: 0 }} />
            )}
            
            <div 
              style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}
              onClick={handleClick}
            >
              {!flipped && (
                <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'var(--surface)', border: '4px solid var(--surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, overflow: 'hidden', flexShrink: 0 }}>
                  {imageLoading ? (
                    <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                  ) : imageUrl ? (
                    <img src={imageUrl} alt={card.english_term} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand-200)' }}>
                      {card.english_term.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: flipped ? 'rgba(255,255,255,0.7)' : 'var(--brand-600)', marginBottom: 12 }}>
                {flipped ? '🇪🇹 Amharic' : '🇬🇧 English'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 800, color: flipped ? '#fff' : 'var(--text-primary)', lineHeight: 1.25, padding: '0 10px' }}>
                  {flipped ? card.amharic_term : card.english_term}
                </div>
                {!flipped && (
                  <button 
                    className="volume-btn btn-ghost" 
                    onClick={(e) => playAudio(card.english_term, e)}
                    style={{ padding: 8, borderRadius: '50%', color: 'var(--brand-500)', flexShrink: 0, background: 'var(--brand-50)' }}
                  >
                    <Volume2 size={24} />
                  </button>
                )}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 24, fontSize: 13, fontWeight: 600, color: flipped ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                {flipped ? 'Tap to flip back' : 'Tap to reveal Amharic ▾'}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', maxWidth: 400, margin: '0 auto' }}>
        <button
          onClick={() => next('learning')}
          className="btn btn-secondary btn-lg"
          style={{ flex: 1, justifyContent: 'center', borderColor: '#fecaca', color: '#ef4444', height: 64, borderRadius: 20 }}
        >
          <ChevronLeft size={20} /> Still Learning
        </button>
        <button
          onClick={() => next('know')}
          className="btn btn-primary btn-lg"
          style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', height: 64, borderRadius: 20, border: 'none' }}
        >
          Know It <ChevronRight size={20} />
        </button>
      </div>
      <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginTop: 20 }}>
        Tap card to reveal · Navigate below
      </p>
    </main>
  )
}
