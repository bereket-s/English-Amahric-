'use client'

import { Shield, CheckCircle2, ChevronRight, AlertCircle, FileText, Phone } from 'lucide-react'
import Link from 'next/link'

export default function LLSHandbookPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/lls" className="btn btn-ghost btn-sm" style={{ padding: 0, color: 'var(--brand-600)', marginBottom: 8 }}>← LLS Training Suite</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Shield size={26} color="var(--brand-500)" /> The LLS Protocol Handbook
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>
          Master the exact scripts and protocols required by Language Line Solutions.
        </p>
      </div>

      {/* Intro Script */}
      <section className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--brand-500)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Phone size={20} color="var(--brand-500)" />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>1. The Standard Introduction</h2>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          You must start <strong>every single call</strong> using this exact scripted greeting. Do not deviate or add extra conversational phrases.
        </p>
        <div style={{ background: 'var(--surface-alt)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            "Hello, I am Amharic interpreter ID <span style={{ color: 'var(--brand-600)' }}>[Your ID]</span>. How may I help you?"
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          <em>Note: Wait for the agent to brief you before doing a translated introduction to the LEP (Limited English Proficient client).</em>
        </p>
      </section>

      {/* First Person Protocol */}
      <section className="card" style={{ marginBottom: 24, borderLeft: '4px solid #f59e0b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AlertCircle size={20} color="#f59e0b" />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>2. First-Person Interpretation</h2>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          You must always speak in the exact voice of the person speaking. Never use third-person reporting (e.g., "He said he has a fever").
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px 16px', borderRadius: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>❌ Strictly Prohibited</span>
            <p style={{ fontSize: 14, marginTop: 4, fontWeight: 600, color: '#991b1b' }}>"The doctor wants to know if you took your medicine."</p>
          </div>
          <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', padding: '12px 16px', borderRadius: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>✅ Required Form</span>
            <p style={{ fontSize: 14, marginTop: 4, fontWeight: 600, color: '#065f46' }}>"Did you take your medicine?"</p>
          </div>
        </div>
      </section>

      {/* Intervening */}
      <section className="card" style={{ marginBottom: 24, borderLeft: '4px solid #8b5cf6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <FileText size={20} color="#8b5cf6" />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>3. How to Intervene</h2>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          If you didn't hear something, need clarification, or need to explain a cultural concept, you must step out of the first-person role by identifying yourself as the interpreter.
        </p>
        <ul style={{ paddingLeft: 20, fontSize: 14, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <li>
            <strong>To ask for a repeat:</strong> <br/>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>"The interpreter requests that you repeat the last sentence."</span>
          </li>
          <li>
            <strong>To clarify a term:</strong> <br/>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>"The interpreter requests clarification on the term 'deductible'."</span>
          </li>
          <li>
            <strong>To explain a cultural note:</strong> <br/>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>"The interpreter would like to provide a cultural note regarding this tradition."</span>
          </li>
        </ul>
      </section>

      {/* The 4 Pillars */}
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <CheckCircle2 size={20} color="#10b981" />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>4. The Four Pillars</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--surface-alt)', padding: 16, borderRadius: 12 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Accuracy</strong>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Translate everything exactly as said. No adding, omitting, or summarizing.</p>
          </div>
          <div style={{ background: 'var(--surface-alt)', padding: 16, borderRadius: 12 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Confidentiality</strong>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Never disclose any information from the call. Destroy notes immediately.</p>
          </div>
          <div style={{ background: 'var(--surface-alt)', padding: 16, borderRadius: 12 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Impartiality</strong>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Do not give advice, express opinions, or take sides. Remain a neutral conduit.</p>
          </div>
          <div style={{ background: 'var(--surface-alt)', padding: 16, borderRadius: 12 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Professionalism</strong>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Maintain a polite, calm, and respectful tone at all times.</p>
          </div>
        </div>
      </section>

    </main>
  )
}
