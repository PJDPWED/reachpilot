'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Upload,
  Send,
  Inbox,
  LogOut,
  FileSearch,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

// ─── Nav Items ──────────────────────────────────────────────────────────────────
const navGroups = [
  {
    label: 'Outreach',
    items: [
      { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard, desc: 'Overview & stats'    },
      { href: '/upload',    label: 'Upload CV',  icon: Upload,          desc: 'Import leads'        },
      { href: '/campaigns', label: 'Campaigns',  icon: Send,            desc: 'Manage sends'        },
      { href: '/replies',   label: 'Replies',    icon: Inbox,           desc: 'AI inbox'            },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { href: '/valuator',    label: 'CV Valuator',    icon: FileSearch, desc: 'Analyze & rewrite'   },
      { href: '/ausbildung',  label: 'Ausbildung AI',  icon: Sparkles,   desc: 'Find leads with AI'  },
    ],
  },
]

// ─── Logo ────────────────────────────────────────────────────────────────────────
function RocketLeadLogo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Pixel rocket mark */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Body */}
        <rect x="11" y="8"  width="6"  height="7"  fill="#ffffff" />
        <rect x="9"  y="11" width="10" height="5"  fill="#ffffff" />
        {/* Nose */}
        <rect x="12" y="5"  width="4"  height="4"  fill="#EAB308" />
        {/* Wings */}
        <rect x="6"  y="14" width="4"  height="4"  fill="#DC2626" />
        <rect x="18" y="14" width="4"  height="4"  fill="#DC2626" />
        {/* Exhaust */}
        <rect x="11" y="16" width="3"  height="4"  fill="#DC2626" />
        <rect x="12" y="19" width="3"  height="3"  fill="#EAB308" />
        {/* Window */}
        <rect x="13" y="11" width="2"  height="2"  fill="#000000" />
      </svg>

      {/* Wordmark */}
      <div>
        <div
          className="leading-none font-semibold tracking-tight"
          style={{
            fontFamily: 'var(--font-geist-sans)',
            fontSize: '15px',
            letterSpacing: '-0.03em',
          }}
        >
          <span style={{ color: '#ffffff' }}>Rocket</span>
          <span style={{ color: '#DC2626', marginLeft: '2px' }}>Lead</span>
        </div>
        <div
          className="leading-none mt-0.5"
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '9px',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.20)',
            textTransform: 'uppercase',
          }}
        >
          Deutschland
        </div>
      </div>
    </div>
  )
}

// ─── Nav Item ────────────────────────────────────────────────────────────────────
function NavItem({
  href,
  label,
  icon: Icon,
  desc,
  isActive,
  index,
}: {
  href: string
  label: string
  icon: React.ElementType
  desc: string
  isActive: boolean
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.30, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className="group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
        style={{
          background: isActive
            ? 'rgba(220, 38, 38, 0.10)'
            : 'transparent',
          border: isActive
            ? '1px solid rgba(220, 38, 38, 0.22)'
            : '1px solid transparent',
        }}
      >
        {/* Active indicator — left bar */}
        {isActive && (
          <motion.div
            layoutId="nav-active-bar"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
            style={{ background: '#DC2626', boxShadow: '0 0 8px rgba(220,38,38,0.70)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}

        {/* Icon container */}
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-all duration-150"
          style={{
            background: isActive
              ? 'rgba(220, 38, 38, 0.18)'
              : 'rgba(255, 255, 255, 0.04)',
            border: isActive
              ? '1px solid rgba(220, 38, 38, 0.35)'
              : '1px solid rgba(255, 255, 255, 0.07)',
            color: isActive ? '#EF4444' : 'rgba(255,255,255,0.35)',
          }}
        >
          <Icon size={13} strokeWidth={isActive ? 2.0 : 1.6} />
        </div>

        {/* Label + desc */}
        <div className="flex-1 min-w-0">
          <div
            className="leading-none font-medium transition-colors duration-150"
            style={{
              fontFamily: 'var(--font-geist-sans)',
              fontSize: '13px',
              letterSpacing: '-0.01em',
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.50)',
            }}
          >
            {label}
          </div>
          <div
            className="leading-none mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '9.5px',
              letterSpacing: '0.02em',
              color: 'rgba(255,255,255,0.22)',
            }}
          >
            {desc}
          </div>
        </div>

        {isActive && (
          <ChevronRight
            size={11}
            strokeWidth={2.5}
            style={{ color: 'rgba(220,38,38,0.60)', flexShrink: 0 }}
          />
        )}
      </Link>
    </motion.div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  let globalIndex = 0

  return (
    <aside
      className="hidden md:flex flex-col w-[220px] min-h-screen fixed left-0 top-0 z-40"
      style={{
        background: 'rgba(6, 6, 8, 0.80)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.40)',
      }}
    >
      {/* Inner sheen — top highlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 30%)',
          borderRadius: 'inherit',
        }}
      />

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div
        className="px-4 py-4 relative"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <RocketLeadLogo />
        </motion.div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 mt-2.5 px-0.5">
          <span
            className="status-dot status-dot-red status-dot-blink"
            style={{ width: '5px', height: '5px' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '9px',
              letterSpacing: '0.10em',
              color: 'rgba(220,38,38,0.55)',
              textTransform: 'uppercase',
            }}
          >
            System active
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            {/* Group label */}
            <div
              className="px-3 mb-1.5"
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.18)',
              }}
            >
              {group.label}
            </div>

            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const idx = globalIndex++
                return (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    desc={item.desc}
                    isActive={isActive}
                    index={idx}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="divider mx-4" />

      {/* ── User Section ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {session && (
          <motion.div
            className="p-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Avatar + info */}
            <div
              className="flex items-center gap-2.5 p-2.5 rounded-lg mb-1"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* Avatar circle */}
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 font-semibold text-xs"
                style={{
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.30), rgba(234,179,8,0.20))',
                  border: '1px solid rgba(220,38,38,0.30)',
                  color: '#EF4444',
                  fontFamily: 'var(--font-geist-sans)',
                }}
              >
                {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="truncate leading-none font-medium"
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    fontSize: '12.5px',
                    letterSpacing: '-0.01em',
                    color: '#ffffff',
                  }}
                >
                  {session.user?.name?.split(' ')[0] || 'Agent'}
                </div>
                <div
                  className="truncate mt-0.5 leading-none"
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.22)',
                    letterSpacing: '0',
                  }}
                >
                  {session.user?.email}
                </div>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="btn-ghost btn-sm w-full justify-start gap-2 mt-0.5"
              style={{ color: 'rgba(255,255,255,0.28)', fontSize: '12px' }}
            >
              <LogOut size={12} strokeWidth={1.8} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
