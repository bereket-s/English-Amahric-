'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '../src/lib/supabase/client'
import { ThemeProvider, useTheme } from 'next-themes'
import {
  BookOpen,
  BarChart2,
  Clock,
  AlertTriangle,
  Upload,
  Menu,
  X,
  CreditCard,
  HelpCircle,
  Headphones,
  Activity,
  Shield,
  Moon,
  Sun,
  Phone,
  GraduationCap,
  MessageCircle,
  PhoneCall,
} from 'lucide-react'

const navLinks = [
  { href: '/live-assist',     label: 'Live Assist',   icon: Phone         },
  { href: '/mock-call',       label: 'Mock Call',     icon: PhoneCall     },
  { href: '/interpreter',     label: 'Interpreter',   icon: Activity      },
  { href: '/glossary',        label: 'Glossary',      icon: BookOpen      },
  { href: '/pronunciation',   label: 'Pronunciation', icon: MessageCircle },
  { href: '/flashcards',      label: 'Flashcards',    icon: CreditCard    },
  { href: '/quiz',            label: 'Quiz',          icon: HelpCircle    },
  { href: '/listening-drill', label: 'Listening',     icon: Headphones    },
  { href: '/lls',             label: 'LLS Suite',     icon: Shield        },
  { href: '/hub',             label: 'Dev Hub',       icon: GraduationCap },
  { href: '/dashboard',       label: 'Dashboard',     icon: BarChart2     },
  { href: '/weak-words',      label: 'Weak Words',    icon: AlertTriangle },
  { href: '/study',           label: 'Import Files',  icon: Upload        },
  { href: '/history',         label: 'History',       icon: Clock         },
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
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

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

      {/* Auth & Mobile hamburger */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <button onClick={handleSignOut} className="btn btn-ghost btn-sm" style={{ padding: '6px 12px', borderRadius: 99, fontSize: 13 }}>
              Sign Out
            </button>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm" style={{ padding: '6px 14px', borderRadius: 99, fontSize: 13, textDecoration: 'none' }}>
              Sign In
            </Link>
          )}
        </div>

        <button
          onClick={() => setOpen(o => !o)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'none' }}
          id="hamburger-btn"
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

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
          
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          {user ? (
            <button onClick={() => { handleSignOut(); setOpen(false); }} className="btn btn-ghost" style={{ justifyContent: 'center', marginTop: 4, width: '100%' }}>
              Sign Out
            </button>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="btn btn-primary" style={{ justifyContent: 'center', marginTop: 4, width: '100%', textDecoration: 'none' }}>
              Sign In
            </Link>
          )}
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
