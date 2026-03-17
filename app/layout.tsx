'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  BookOpen,
  BarChart2,
  Clock,
  AlertTriangle,
  Upload,
  Shuffle,
  Menu,
  X,
  Layers,
} from 'lucide-react'

const navLinks = [
  { href: '/glossary',        label: 'Glossary',       icon: BookOpen       },
  { href: '/scenarios',       label: 'Scenarios',      icon: Layers         },
  { href: '/dashboard',       label: 'Dashboard',      icon: BarChart2      },
  { href: '/history',         label: 'History',        icon: Clock          },
  { href: '/weak-words',      label: 'Weak Words',     icon: AlertTriangle  },
  { href: '/study',           label: 'Upload',         icon: Upload         },
  { href: '/random-practice', label: 'Random',         icon: Shuffle        },
]

function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 'var(--nav-height)',
      zIndex: 100,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '12px',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '22px' }}>🇪🇹</span>
        <span style={{ fontWeight: 800, fontSize: '17px', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          EngAmh
        </span>
      </Link>

      {/* Desktop nav */}
      <nav style={{ display: 'flex', gap: '4px', flex: 1, flexWrap: 'nowrap', overflow: 'auto' }} className="desktop-nav">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13.5px',
                fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                color: active ? 'var(--brand-600)' : 'var(--text-secondary)',
                background: active ? 'var(--brand-50)' : 'transparent',
                transition: 'all 0.18s',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="btn btn-secondary btn-sm"
        style={{ marginLeft: 'auto', display: 'none' }}
        id="hamburger-btn"
        aria-label="Toggle menu"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'var(--nav-height)',
          left: 0, right: 0,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: active ? 'var(--brand-600)' : 'var(--text-primary)',
                  background: active ? 'var(--brand-50)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 680px) {
          .desktop-nav { display: none !important; }
          #hamburger-btn { display: flex !important; }
        }
      `}</style>
    </header>
  )
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <title>EngAmh Trainer 🇪🇹</title>
        <meta name="description" content="Practice English and Amharic vocabulary, pronunciation, and sentences." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  )
}
