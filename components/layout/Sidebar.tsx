'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Upload, Send, Inbox,
  LogOut, ChevronRight,
} from 'lucide-react'
import Image from 'next/image'

const navItems = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard, desc: 'OVERVIEW & STATS' },
  { href: '/upload',    label: 'UPLOAD CV',  icon: Upload,          desc: 'IMPORT LEADS'   },
  { href: '/campaigns', label: 'CAMPAIGNS',  icon: Send,            desc: 'MANAGE SENDS'   },
  { href: '/replies',   label: 'REPLIES',    icon: Inbox,           desc: 'AI INBOX'       },
]

// ─── Rocket Lead Logo SVG ──────────────────────────────────────────────────────
// Text "ROCKET LEAD" on LEFT, minimalist rocket icon on RIGHT.
// Flat, no gradients, Black/Red/Gold palette.
function RocketLeadLogo() {
  return (
    <svg
      width="176"
      height="36"
      viewBox="0 0 176 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* "ROCKET" text — white */}
      <text
        x="0" y="22"
        fontFamily="Inter, sans-serif"
        fontSize="22"
        fill="#FFFFFF"
        letterSpacing="2"
        fontWeight="400"
      >
        ROCKET
      </text>
      {/* "LEAD" text — red */}
      <text
        x="76" y="22"
        fontFamily="Inter, sans-serif"
        fontSize="22"
        fill="#FF0000"
        letterSpacing="2"
        fontWeight="400"
      >
        LEAD
      </text>

      {/* Rocket icon — right side (pixel-art style) */}
      {/* Body */}
      <rect x="152" y="10" width="4" height="8" fill="#FFFFFF" />
      <rect x="150" y="13" width="8" height="6" fill="#FFFFFF" />
      {/* Nose */}
      <rect x="153" y="7"  width="2" height="4" fill="#FFCE00" />
      {/* Wings */}
      <rect x="147" y="17" width="4" height="4" fill="#FF0000" />
      <rect x="157" y="17" width="4" height="4" fill="#FF0000" />
      {/* Flame */}
      <rect x="152" y="19" width="2" height="3" fill="#FF0000" />
      <rect x="153" y="21" width="2" height="2" fill="#FFCE00" />
      {/* Window */}
      <rect x="153" y="13" width="2" height="2" fill="#000000" />
    </svg>
  )
}

// ─── Rocket-Cortex Mascot — mini version for sidebar ──────────────────────────
// Gen Z soft geometry, no antennas, modern delivery agent.
function RocketCortexMini() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
      {/* Head — rounded cube */}
      <rect x="8"  y="6"  width="16" height="14" rx="3" fill="#1a0000" />
      <rect x="8"  y="6"  width="16" height="14" rx="3" stroke="#FF0000" strokeWidth="1.5" />
      {/* Eyes */}
      <rect x="11" y="11" width="3" height="3" rx="1" fill="#FFCE00" />
      <rect x="18" y="11" width="3" height="3" rx="1" fill="#FFCE00" />
      {/* Mouth — pixel smile */}
      <rect x="12" y="16" width="1" height="1" fill="#FF0000" />
      <rect x="13" y="17" width="6" height="1" fill="#FF0000" />
      <rect x="19" y="16" width="1" height="1" fill="#FF0000" />
      {/* Body */}
      <rect x="10" y="21" width="12" height="7" rx="2" fill="#0a0000" stroke="#FF0000" strokeWidth="1.5" />
      {/* Star badge */}
      <rect x="14" y="23" width="4" height="3" rx="0.5" fill="#FFCE00" />
    </svg>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen fixed left-0 top-0 z-40"
      style={{
        background: '#000000',
        borderRight: '2px solid rgba(255,0,0,0.35)',
      }}
    >
      {/* Left accent line */}
      <div
        className="absolute inset-y-0 left-0 w-[2px]"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #FF0000 30%, #FFCE00 70%, transparent 100%)',
        }}
      />

      {/* Logo */}
      <div
        className="px-5 py-4"
        style={{ borderBottom: '2px solid rgba(255,0,0,0.25)' }}
      >
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 140 }}
        >
          <RocketLeadLogo />
        </motion.div>
        <div
          className="mt-2 flex items-center gap-2"
        >
          <div
            className="w-1.5 h-1.5 animate-pixel-blink"
            style={{ background: '#FF0000', imageRendering: 'pixelated' }}
          />
          <span
            className="tracking-widest uppercase font-mono"
            style={{
              fontSize: '11px',
              color: 'rgba(255,0,0,0.55)',
              letterSpacing: '0.14em',
            }}
          >
            DEUTSCHLAND EDITION
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p
          className="px-3 mb-3 tracking-widest uppercase font-sans"
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.20)',
            letterSpacing: '0.14em',
          }}
        >
          // NAVIGATION
        </p>

        <div className="space-y-0.5 relative">
          {navItems.map((item, i) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06, type: 'spring', stiffness: 160, damping: 20 }}
              >
                <Link
                  href={item.href}
                  className="relative flex items-center gap-3 px-3 py-2.5 group block"
                  style={{
                    background: isActive ? 'rgba(255,0,0,0.10)' : 'transparent',
                    borderLeft: isActive ? '2px solid #FF0000' : '2px solid transparent',
                    transition: 'all 0.1s steps(2)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                    }
                  }}
                >
                  {/* Active glow */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      layoutId="sidebar-active"
                      style={{ boxShadow: 'inset 2px 0 12px rgba(255,0,0,0.12)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="w-7 h-7 flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: isActive ? 'rgba(255,0,0,0.18)' : 'rgba(255,255,255,0.04)',
                      border: isActive ? '2px solid rgba(255,0,0,0.5)' : '2px solid rgba(255,255,255,0.06)',
                      color: isActive ? '#FF0000' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    <Icon size={13} />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="leading-none tracking-wider"
                      style={{
                        fontFamily: "'VT323', monospace",
                        fontSize: '17px',
                        color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="text-[10px] mt-0.5 leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        fontFamily: "'VT323', monospace",
                        color: 'rgba(255,255,255,0.20)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>

                  {isActive && (
                    <ChevronRight size={12} style={{ color: '#FF0000' }} />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </nav>

      {/* Divider */}
      <div className="divider mx-4" />

      {/* User section */}
      <AnimatePresence>
        {session && (
          <motion.div
            className="p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 140 }}
          >
            {/* User card */}
            <div
              className="flex items-center gap-2.5 p-2.5 mb-1"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '2px solid rgba(255,255,255,0.06)',
              }}
            >
              <RocketCortexMini />
              <div className="flex-1 min-w-0">
                <div
                  className="text-white truncate leading-none mb-0.5"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '17px', letterSpacing: '0.04em' }}
                >
                  {session.user?.name?.split(' ')[0]?.toUpperCase() || 'AGENT'}
                </div>
                <div
                  className="truncate"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {session.user?.email}
                </div>
              </div>
            </div>

            {/* Sign out */}
            <motion.button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs cursor-pointer"
              style={{
                fontFamily: "'VT323', monospace",
                fontSize: '15px',
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: 'none',
                background: 'transparent',
              }}
              whileHover={{
                color: '#FF0000',
              }}
              whileTap={{ scale: 0.97 }}
            >
              <LogOut size={12} />
              SIGN OUT
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
