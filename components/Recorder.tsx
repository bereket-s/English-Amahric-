'use client'

import { useRef, useState, useEffect } from 'react'
import { Mic, Square } from 'lucide-react'

type RecorderProps = {
  onRecorded: (blob: Blob) => void
}

export default function Recorder({ onRecorded }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [status, setStatus] = useState<'idle' | 'recording' | 'done'>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRecording) {
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRecording])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onRecorded(blob)
        stream.getTracks().forEach(t => t.stop())
        setStatus('done')
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setStatus('recording')
    } catch {
      alert('Microphone access failed. Please allow microphone access and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const statusText = {
    idle: 'Ready to record',
    recording: `Recording ${formatTime(seconds)}`,
    done: 'Recording complete ✓',
  }[status]

  const statusColor = {
    idle: 'var(--text-muted)',
    recording: 'var(--danger)',
    done: 'var(--success)',
  }[status]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px 0' }}>
      {/* Mic button */}
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
          aria-label="Start recording"
        >
          <Mic size={26} />
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--danger)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse-ring 1.4s ease-out infinite',
          }}
          aria-label="Stop recording"
        >
          <Square size={22} fill="#fff" />
        </button>
      )}

      {/* Status label */}
      <span style={{ fontSize: '13px', fontWeight: 500, color: statusColor }}>
        {statusText}
      </span>
    </div>
  )
}
