'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { AmbientBackground } from '@/components/background/AmbientBackground'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  LayoutDashboard, Upload, Send, Inbox, FileSearch, Sparkles,
} from 'lucide-react'

// ─── AppShell ─────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/upload',    label: 'Upload',    icon: Upload },
    { href: '/campaigns', label: 'Campaigns', icon: Send },
    { href: '/replies',   label: 'Replies',   icon: Inbox },
    { href: '/valuator',  label: 'CV',        icon: FileSearch },
    { href: '/ausbildung', label: 'AI Lead',  icon: Sparkles },
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div
        className="flex items-center justify-center min-h-dvh"
        style={{ background: '#000000' }}
      >
        <AmbientBackground />
        <motion.div
          className="flex flex-col items-center gap-5 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Wordmark */}
          <div className="select-none" style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.04em' }}>
            <span style={{ color: '#ffffff' }}>Rocket</span>
            <span style={{ color: 'rgba(255,255,255,0.30)' }}>Lead</span>
          </div>
          {/* Dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{ width: 4, height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.45)' }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div
      className="relative min-h-dvh"
      style={{ background: '#000000' }}
    >
      <AmbientBackground />
      <Sidebar />
      <main className="flex-1 md:ml-[220px] min-h-dvh relative z-10 pb-20 md:pb-0">
        <div className="w-full px-4 md:px-8 py-8">
          {children}
        </div>
      </main>
      {/* Mobile Bottom Nav — scrollable so all 6 items fit */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        aria-label="Mobile navigation"
        style={{
          background: 'rgba(6, 6, 8, 0.92)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderTop: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        <div className="flex items-center overflow-x-auto scrollbar-none py-1.5 px-2 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all shrink-0 min-w-[52px]"
                style={{
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.35)',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.14)' : '1px solid transparent',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.6} />
                <span
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    fontSize: '10px',
                    letterSpacing: '-0.01em',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
