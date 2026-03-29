'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AmbientBackground } from '@/components/background/AmbientBackground'
import { Rocket, Mail, Shield, Zap, BarChart3, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

const features = [
  { icon: Mail,       text: 'Gmail API integration',      sub: 'No SMTP limitations' },
  { icon: Zap,        text: 'AI-generated emails',         sub: 'Powered by GPT-4o' },
  { icon: Shield,     text: 'Smart scheduling',            sub: '8–10 min delays' },
  { icon: BarChart3,  text: 'Reply classification',        sub: 'YES / NO / NEUTRAL' },
]

const stats = [
  { value: '10x', label: 'Faster outreach' },
  { value: '3x',  label: 'Higher reply rates' },
  { value: '∞',   label: 'Scale potential' },
]

export default function SignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const handleSignIn = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <AmbientBackground />
        <motion.div
          className="relative z-10 flex gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--accent)' }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex" style={{ background: 'var(--bg-deep)' }}>
      <AmbientBackground />

      {/* LEFT — Hero panel */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-[52%] relative z-10 p-14"
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 80, damping: 20 }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
            }}
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
            <Rocket size={16} className="text-white relative z-10" />
          </div>
          <span className="font-heading text-[17px] text-white tracking-tight">ReachPilot</span>
        </div>

        {/* Main copy */}
        <div>
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles size={12} style={{ color: 'var(--accent-light)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--accent-light)' }}>
              AI-Powered Cold Outreach Platform
            </span>
          </motion.div>

          <motion.h1
            className="font-heading text-5xl text-white leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          >
            Send smarter.<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Close faster.
            </span>
          </motion.h1>

          <motion.p
            className="text-base leading-relaxed max-w-sm mb-10"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Automate cold outreach at scale with GPT-4o email generation, Gmail API sending, and AI reply classification.
          </motion.p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl cursor-default"
                  style={{
                    background: hoveredFeature === i ? 'rgba(99,102,241,0.10)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${hoveredFeature === i ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.2s ease',
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.07 }}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(99,102,241,0.15)' }}
                  >
                    <Icon size={13} style={{ color: 'var(--accent-light)' }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white leading-snug">{feature.text}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{feature.sub}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Stats row */}
          <motion.div
            className="flex items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
          >
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="font-heading text-2xl text-white">{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer note */}
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Competing with Instantly · Lemlist · Mailshake
        </p>
      </motion.div>

      {/* Vertical separator */}
      <div
        className="hidden lg:block w-px self-stretch my-12 relative z-10"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent 100%)' }}
      />

      {/* RIGHT — Sign in card */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 100, damping: 20 }}
        >
          {/* Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10,10,22,0.7)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 40px 100px rgba(0,0,0,0.6)',
            }}
          >
            {/* Top highlight */}
            <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

            <div className="p-8">
              {/* Mobile logo */}
              <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
                  }}
                >
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
                  <Rocket size={16} className="text-white relative z-10" />
                </div>
                <span className="font-heading text-[17px] text-white tracking-tight">ReachPilot</span>
              </div>

              <div className="mb-8">
                <h2 className="font-heading text-2xl text-white mb-2">Welcome back</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Sign in with Google to access your outreach dashboard and connect your Gmail account.
                </p>
              </div>

              {/* Permissions info */}
              <div
                className="flex items-start gap-3 p-3.5 rounded-xl mb-6"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.18)',
                }}
              >
                <CheckCircle2 size={15} style={{ color: 'var(--accent-light)' }} className="mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  We request Gmail send/read access to power your outreach campaigns. Your data stays private.
                </p>
              </div>

              {/* Sign in button */}
              <motion.button
                onClick={handleSignIn}
                disabled={loading}
                className="relative w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl text-sm font-semibold overflow-hidden"
                style={{
                  background: loading ? 'rgba(255,255,255,0.85)' : '#ffffff',
                  color: '#111827',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.4) inset',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                whileHover={!loading ? { scale: 1.02, boxShadow: '0 6px 32px rgba(0,0,0,0.3)' } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      className="flex items-center gap-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                      <ArrowRight size={14} className="ml-auto" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
                By continuing, you agree to our{' '}
                <span className="underline" style={{ color: 'var(--accent-light)', cursor: 'pointer' }}>
                  Terms of Service
                </span>
              </p>
            </div>
          </div>

          {/* Glow under card */}
          <div
            className="h-px mt-px mx-8"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }}
          />
        </motion.div>
      </div>
    </div>
  )
}
