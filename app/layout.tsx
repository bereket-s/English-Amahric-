'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from 'next-themes'
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
  CreditCard,
  HelpCircle,
  Puzzle,
  NotebookPen,
  Headphones,
  Activity,
  Shield,
  Moon,
  Sun,
  Phone,
  GraduationCap,
  MessageCircle,
} from 'lucide-react'

const navLinks = [
  { href: '/live-assist',     label: 'Live Assist',  icon: Phone          },
  { href: '/glossary',        label: 'Glossary',     icon: BookOpen       },
  { href: '/hub',             label: 'Dev Hub',      icon: GraduationCap  },
  { href: '/pronunciation',   label: 'Pronunciation', icon: MessageCircle  },
  { href: '/lls',             label: 'LLS Training', icon: Shield         },
  { href: '/interpreter',     label: 'Interpreter',  icon: Activity       },
  { href: '/flashcards',      label: 'Flashcards',   icon: CreditCard     },
  { href: '/quiz',            label: 'Quiz',         icon: HelpCircle     },
  { href: '/match',           label: 'Match',        icon: Puzzle         },
  { href: '/notes',           label: 'Notes',        icon: NotebookPen    },
  { href: '/listening-drill', label: 'Listening',    icon: Headphones     },
  { href: '/dashboard',       label: 'Dashboard',    icon: BarChart2      },
  { href: '/history',         label: 'History',      icon: Clock          },
  { href: '/weak-words',      label: 'Weak Words',   icon: AlertTriangle  },
  { href: '/study',           label: 'Upload',       icon: Upload         },
  { href: '/random-practice', label: 'Random',       icon: Shuffle        },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div style={{ width: 36, height: 36 }} />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="btn btn-ghost"
      style={{ padding: 8, borderRadius: '50%', color: 'var(--text-primary)' }}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <Nav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
