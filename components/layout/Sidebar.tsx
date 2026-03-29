'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Upload, Send, Inbox,
  LogOut, Rocket, ChevronRight,
} from 'lucide-react'
import { cn } from '@/utils/helpers'
import Image from 'next/image'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & stats' },
  { href: '/upload',     label: 'Upload',     icon: Upload,          desc: 'Import leads'    },
  { href: '/campaigns',  label: 'Campaigns',  icon: Send,            desc: 'Manage sends'    },
  { href: '/replies',    label: 'Replies',    icon: Inbox,           desc: 'AI inbox'        },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside
      className="flex flex-col w-64 min-h-screen fixed left-0 top-0 z-40"
      style={{
        background: 'rgba(4,4,10,0.75)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '1px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Top edge highlight */}
      <div className="absolute inset-y-0 left-0 w-px" style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.4) 30%, rgba(139,92,246,0.3) 70%, transparent 100%)'
      }} />

      {/* Logo */}
      <div className="px-5 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
        >
          {/* Logo mark */}
          <motion.div
            className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.45), 0 1px 0 rgba(255,255,255,0.2) inset',
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
            <Rocket size={17} className="text-white relative z-10" />
          </motion.div>

          <div>
            <div className="font-heading text-[17px] text-white leading-none tracking-tight">
              ReachPilot
            </div>
            <div className="text-[11px] mt-0.5 tracking-wide uppercase font-medium" style={{ color: 'var(--accent-light)', opacity: 0.7 }}>
              AI Outreach
            </div>
          </div>
        </motion.div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-3" style={{ color: 'var(--text-muted)' }}>
          Navigation
        </p>

        <div className="space-y-1 relative">
          {navItems.map((item, i) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, type: 'spring', stiffness: 140, damping: 18 }}
              >
                <Link href={item.href} className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl group block">
                  {/* Active background */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        layoutId="sidebar-active"
                        style={{
                          background: 'rgba(99,102,241,0.12)',
                          border: '1px solid rgba(99,102,241,0.25)',
                          boxShadow: '0 0 20px rgba(99,102,241,0.15)',
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Hover background */}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="relative z-10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                    style={{
                      background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                    }}
                  >
                    <Icon size={15} />
                  </div>

                  {/* Label */}
                  <div className="relative z-10 flex-1 min-w-0">
                    <div
                      className="text-sm font-medium leading-none"
                      style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {item.label}
                    </div>
                    <div className="text-[10px] mt-0.5 leading-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                      {item.desc}
                    </div>
                  </div>

                  {/* Active indicator chevron */}
                  {isActive && (
                    <motion.div
                      className="relative z-10"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <ChevronRight size={13} style={{ color: 'var(--accent-light)' }} />
                    </motion.div>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </nav>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      {/* User section */}
      <AnimatePresence>
        {session && (
          <motion.div
            className="p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
          >
            {/* User card */}
            <div
              className="flex items-center gap-2.5 p-2.5 rounded-xl mb-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="avatar"
                  width={28}
                  height={28}
                  className="rounded-full"
                  style={{ boxShadow: '0 0 0 2px rgba(99,102,241,0.35)' }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {session.user?.name?.split(' ')[0] || 'User'}
                </div>
                <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {session.user?.email}
                </div>
              </div>
            </div>

            {/* Sign out */}
            <motion.button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-200"
              style={{ color: 'var(--text-muted)' }}
              whileHover={{
                background: 'rgba(239,68,68,0.10)',
                color: '#f87171',
              }}
              whileTap={{ scale: 0.97 }}
            >
              <LogOut size={13} />
              Sign out
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
