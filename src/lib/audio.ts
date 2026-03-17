// Lightweight Web Audio API synthesizer for gamification sound effects

export const playSound = (type: 'success' | 'perfect' | 'neutral' | 'tryAgain') => {
  if (typeof window === 'undefined') return
  
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    const now = ctx.currentTime

    switch (type) {
      case 'perfect':
        // A magical rising arpeggio
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, now)       // A4
        osc.frequency.setValueAtTime(554.37, now + 0.1) // C#5
        osc.frequency.setValueAtTime(659.25, now + 0.2) // E5
        osc.frequency.setValueAtTime(880, now + 0.3)    // A5
        gainNode.gain.setValueAtTime(0, now)
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
        osc.start(now)
        osc.stop(now + 0.8)
        break
        
      case 'success':
        // A simple happy double-chime
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(523.25, now) // C5
        osc.frequency.setValueAtTime(659.25, now + 0.15) // E5
        gainNode.gain.setValueAtTime(0, now)
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
        osc.start(now)
        osc.stop(now + 0.5)
        break

      case 'neutral':
        // A soft single pop
        osc.type = 'sine'
        osc.frequency.setValueAtTime(400, now)
        gainNode.gain.setValueAtTime(0, now)
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
        osc.start(now)
        osc.stop(now + 0.2)
        break

      case 'tryAgain':
        // A gentle, slightly descending boop
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.3)
        gainNode.gain.setValueAtTime(0, now)
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        osc.start(now)
        osc.stop(now + 0.4)
        break
    }
  } catch (err) {
    console.error('Audio playback failed', err)
  }
}
