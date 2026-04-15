'use client'

import React from 'react'

export default function NotFound() {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>404 - Not Found</h1>
      <p style={{ color: 'var(--text-muted)' }}>The page you are looking for does not exist.</p>
    </div>
  )
}
