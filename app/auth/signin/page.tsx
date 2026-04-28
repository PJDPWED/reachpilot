'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EtheralShadow } from '@/components/ui/etheral-shadow'
import { Zap, Shield, BarChart3, ArrowRight, CheckCircle2, Clock, Globe } from 'lucide-react'

const features = [
  { icon: Globe,     text: 'CV → German job market',   sub: 'Targeted delivery'      },
  { icon: Zap,       text: 'AI-written cover letters',  sub: 'Gemini-powered'          },
  { icon: Shield,    text: '8-min SMTP protection',     sub: 'Zero spam risk'          },
  { icon: BarChart3, text: 'Reply classification',      sub: 'Yes / No / Neutral'      },
  { icon: Clock,     text: 'Auto follow-ups',           sub: 'Timed sequences'         },
]

const stats = [
  { value: '8 min', label: 'Cooldown engine' },
  { value: '3×',    label: 'Reply rate'      },
  { value: 'DE',    label: 'Market focus'    },
]

export default function SignInPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard')
  }, [status, router])

  const handleSignIn = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <EtheralShadow color="rgba(255,255,255,0.09)" animation={{ scale: 55, speed: 25 }} noise={{ opacity: 0.5, scale: 1.0 }} />
        <div className="relative z-10 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{ width: 5, height: 5, borderRadius: 9999, background: 'rgba(255,255,255,0.50)' }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex" style={{ background: '#000000' }}>
      <EtheralShadow color="rgba(255,255,255,0.09)" animation={{ scale: 55, speed: 25 }} noise={{ opacity: 0.55, scale: 1.0 }} />

      {/* LEFT — Hero panel */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-[52%] relative z-10 p-12"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 90, damping: 22 }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 select-none">
          <div>
            <div
              style={{
                fontFamily: 'var(--font-geist-sans)',
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              <span style={{ color: '#ffffff' }}>Rocket</span>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Lead</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '8px',
                letterSpacing: '0.16em',
                color: 'rgba(255,255,255,0.18)',
                textTransform: 'uppercase',
                marginTop: '3px',
              }}
            >
              Deutschland
            </div>
          </div>
        </div>

        {/* Main content */}
        <div>
          {/* Tag */}
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.55)' }}
            />
            <span
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Moroccan professionals × German companies
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-white leading-none mb-5"
            style={{
              fontFamily: 'var(--font-geist-sans)',
              fontSize: 'clamp(2.8rem, 4.5vw, 4.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          >
            Launch your<br />
            <span style={{ color: 'rgba(255,255,255,0.50)' }}>career in DE.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            className="mb-8 max-w-sm leading-relaxed"
            style={{
              fontFamily: 'var(--font-geist-sans)',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.38)',
              letterSpacing: '-0.01em',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            Send personalized CV emails to German companies at scale.
            AI-written, Gmail-sent, SMTP-safe.
          </motion.p>

          {/* Features */}
          <div className="space-y-1.5 mb-10">
            {features.map((feature, i) => {
              const Icon = feature.icon
              const isHov = hoveredFeature === i
              return (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-default transition-all duration-150"
                  style={{
                    background: isHov ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: `1px solid ${isHov ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'}`,
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.32 + i * 0.06 }}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
                    style={{
                      background: isHov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isHov ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}`,
                      color: isHov ? '#ffffff' : 'rgba(255,255,255,0.30)',
                    }}
                  >
                    <Icon size={12} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-geist-sans)',
                        fontSize: '13px',
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                        color: isHov ? '#ffffff' : 'rgba(255,255,255,0.60)',
                      }}
                    >
                      {feature.text}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-geist-mono)',
                        fontSize: '10px',
                        color: isHov ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.20)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {feature.sub}
                    </div>
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
            transition={{ delay: 0.70 }}
          >
            {stats.map((stat, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    fontSize: '2rem',
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    color: '#ffffff',
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.28)',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    marginTop: '4px',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <p
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.16)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          vs. Instantly · Lemlist · Mailshake
        </p>
      </motion.div>

      {/* Vertical separator */}
      <div
        className="hidden lg:block w-px self-stretch my-12 relative z-10"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.10) 70%, transparent 100%)' }}
      />

      {/* RIGHT — Sign-in card */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, type: 'spring', stiffness: 100, damping: 22 }}
        >
          {/* Card */}
          <div
            style={{
              background: 'rgba(10,10,12,0.85)',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '16px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Top sheen */}
            <div
              style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
              }}
            />

            <div className="p-8">
              {/* Mobile logo */}
              <div className="flex lg:hidden items-center justify-center gap-2 mb-8 select-none">
                <div
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    fontSize: '17px',
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                  }}
                >
                  <span style={{ color: '#ffffff' }}>Rocket</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>Lead</span>
                </div>
              </div>

              <div className="mb-6">
                <h2
                  className="leading-none mb-2"
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    color: '#ffffff',
                  }}
                >
                  Welcome back.
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    fontSize: '13.5px',
                    color: 'rgba(255,255,255,0.40)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.5,
                  }}
                >
                  Connect your Gmail to launch CV campaigns into the German job market.
                </p>
              </div>

              {/* Permissions info */}
              <div
                className="flex items-start gap-3 p-3 rounded-lg mb-6"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <CheckCircle2 size={13} style={{ color: 'rgba(255,255,255,0.45)', marginTop: 2, flexShrink: 0 }} />
                <p
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    fontSize: '12.5px',
                    color: 'rgba(255,255,255,0.38)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.5,
                  }}
                >
                  Gmail send + read access required. Your data never leaves your account.
                </p>
              </div>

              {/* Sign in button */}
              <motion.button
                onClick={handleSignIn}
                disabled={loading}
                className="relative w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl overflow-hidden"
                style={{
                  background: loading ? 'rgba(255,255,255,0.88)' : '#ffffff',
                  color: '#0a0a0c',
                  border: '1px solid rgba(255,255,255,0.90)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-geist-sans)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  boxShadow: '0 4px 20px rgba(255,255,255,0.12)',
                }}
                whileHover={!loading ? { boxShadow: '0 6px 28px rgba(255,255,255,0.22)' } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
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
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                      Authenticating…
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      className="flex items-center gap-3 w-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Google logo */}
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span className="flex-1 text-left">Continue with Google</span>
                      <ArrowRight size={13} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <p
                className="text-center mt-4"
                style={{
                  fontFamily: 'var(--font-geist-sans)',
                  fontSize: '11.5px',
                  color: 'rgba(255,255,255,0.18)',
                  letterSpacing: '-0.01em',
                }}
              >
                By continuing you agree to our{' '}
                <span style={{ color: 'rgba(255,255,255,0.38)', cursor: 'pointer', textDecoration: 'underline' }}>
                  Terms
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
