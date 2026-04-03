'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { AmbientBackground } from '@/components/background/AmbientBackground'
import { motion } from 'framer-motion'

// ─── Pixel Rocket — Loading Screen ────────────────────────────────────────────
// Black/Red/Gold — Rocket Lead Deutschland palette

const PIXEL_MAP: string[] = [
  '000010000',
  '000121000',
  '001212100',
  '011222110',
  '011212110',
  '001212100',
  '010000010',
  '100333001',
  '000333000',
]
const PIXEL_COLORS: Record<string, string> = {
  '0': 'transparent',
  '1': '#FF0000',   // red body
  '2': '#ffffff',   // white highlight
  '3': '#FFCE00',   // gold flame
}

function LoadingRocket() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 7px)',
          gridTemplateRows: 'repeat(9, 7px)',
          imageRendering: 'pixelated',
          gap: 0,
          filter: 'drop-shadow(0 0 14px rgba(255,0,0,0.9))',
        }}
      >
        {PIXEL_MAP.flatMap((row, y) =>
          row.split('').map((cell, x) => (
            <div
              key={`${y}-${x}`}
              style={{ width: 7, height: 7, background: PIXEL_COLORS[cell] ?? 'transparent' }}
            />
          ))
        )}
      </div>
    </motion.div>
  )
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

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
          className="flex flex-col items-center gap-6 relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <LoadingRocket />

          {/* Brand name */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="text-white mb-1 font-mono"
              style={{ fontSize: '2rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              ROCKET LEAD
            </div>
            <div
              className="tracking-widest uppercase animate-pixel-flicker font-mono"
              style={{
                fontSize: '14px',
                color: '#FF0000',
                letterSpacing: '0.16em',
              }}
            >
              INITIALIZING SYSTEM...
            </div>
          </motion.div>

          {/* Pixel loading bar */}
          <div
            style={{
              width: 140,
              height: 6,
              background: 'rgba(255,0,0,0.08)',
              border: '2px solid rgba(255,0,0,0.35)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'repeating-linear-gradient(90deg, #FF0000 0px, #FF0000 6px, #FFCE00 6px, #FFCE00 12px)',
                backgroundSize: '12px 100%',
              }}
              animate={{ width: ['0%', '100%'], backgroundPosition: ['0% 0%', '100% 0%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
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
      <main className="flex-1 ml-64 min-h-dvh relative z-10">
        <div className="w-full px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
