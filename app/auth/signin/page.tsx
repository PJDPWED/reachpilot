'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AmbientBackground } from '@/components/background/AmbientBackground'
import { Zap, Shield, BarChart3, ArrowRight, CheckCircle2, Clock, Globe } from 'lucide-react'

const features = [
  { icon: Globe,     text: 'MOROCCAN → GERMAN PIPELINE', sub: 'TARGETED CV DELIVERY' },
  { icon: Zap,       text: 'AI-GENERATED COVER LETTERS', sub: 'GEMINI-POWERED'       },
  { icon: Shield,    text: '8-MIN SMTP PROTECTION',      sub: 'ZERO SPAM RISK'       },
  { icon: BarChart3, text: 'REPLY CLASSIFICATION',       sub: 'YES / NO / NEUTRAL'   },
  { icon: Clock,     text: 'AUTO FOLLOW-UPS',            sub: 'TIMED SEQUENCES'      },
]

const stats = [
  { value: '8 MIN', label: 'COOLDOWN ENGINE'     },
  { value: '3X',    label: 'REPLY RATE'          },
  { value: 'DE',    label: 'MARKET FOCUS'        },
]

// ─── Rocket-Cortex Mascot SVG ─────────────────────────────────────────────────
// Gen Z soft 3D geometry, no antennas, modern delivery agent.
function RocketCortexMascot() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Shadow */}
      <ellipse cx="60" cy="112" rx="28" ry="5" fill="rgba(255,0,0,0.15)" />

      {/* Body — soft cube with round corners */}
      <rect x="28" y="52" width="64" height="52" rx="12" fill="#0a0000" />
      <rect x="28" y="52" width="64" height="52" rx="12" stroke="#FF0000" strokeWidth="2" />

      {/* Body highlight */}
      <rect x="32" y="56" width="56" height="8" rx="4" fill="rgba(255,255,255,0.04)" />

      {/* Badge on body */}
      <rect x="44" y="68" width="32" height="20" rx="4" fill="rgba(255,206,0,0.12)" stroke="#FFCE00" strokeWidth="1.5" />
      <text x="49" y="82" fontFamily="VT323, monospace" fontSize="14" fill="#FFCE00" letterSpacing="1">LEAD</text>

      {/* Head — soft rounded square */}
      <rect x="22" y="12" width="76" height="50" rx="16" fill="#0d0000" />
      <rect x="22" y="12" width="76" height="50" rx="16" stroke="#FF0000" strokeWidth="2" />

      {/* Head highlight */}
      <rect x="28" y="16" width="50" height="6" rx="3" fill="rgba(255,255,255,0.06)" />

      {/* Eyes — rectangular pixel style with glow */}
      <rect x="34" y="26" width="16" height="12" rx="3" fill="#000" stroke="#FFCE00" strokeWidth="1.5" />
      <rect x="38" y="29" width="8" height="6" rx="1" fill="#FFCE00" />

      <rect x="70" y="26" width="16" height="12" rx="3" fill="#000" stroke="#FFCE00" strokeWidth="1.5" />
      <rect x="74" y="29" width="8" height="6" rx="1" fill="#FFCE00" />

      {/* Mouth — pixel smile */}
      <rect x="40" y="44" width="4" height="3" fill="rgba(255,0,0,0.6)" />
      <rect x="44" y="47" width="32" height="3" fill="#FF0000" />
      <rect x="76" y="44" width="4" height="3" fill="rgba(255,0,0,0.6)" />

      {/* Arms */}
      <rect x="6"  y="58" width="20" height="10" rx="5" fill="#0a0000" stroke="#FF0000" strokeWidth="2" />
      <rect x="94" y="58" width="20" height="10" rx="5" fill="#0a0000" stroke="#FF0000" strokeWidth="2" />

      {/* Hands — holding envelope icon on right */}
      <rect x="6"  y="67" width="16" height="12" rx="3" fill="#FF0000" />
      {/* Envelope right hand */}
      <rect x="96" y="67" width="18" height="12" rx="2" fill="rgba(255,206,0,0.15)" stroke="#FFCE00" strokeWidth="1.5" />
      <line x1="96" y1="67" x2="105" y2="75" stroke="#FFCE00" strokeWidth="1" />
      <line x1="114" y1="67" x2="105" y2="75" stroke="#FFCE00" strokeWidth="1" />

      {/* Legs */}
      <rect x="38" y="102" width="18" height="14" rx="5" fill="#0a0000" stroke="#FF0000" strokeWidth="2" />
      <rect x="64" y="102" width="18" height="14" rx="5" fill="#0a0000" stroke="#FF0000" strokeWidth="2" />
    </svg>
  )
}

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
        <AmbientBackground />
        <div className="relative z-10 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{ width: 6, height: 6, background: '#FF0000', imageRendering: 'pixelated' }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex" style={{ background: '#000000' }}>
      <AmbientBackground />

      {/* LEFT — Hero panel */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-[52%] relative z-10 p-12"
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 90, damping: 20 }}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36, height: 36,
              background: '#FF0000',
              border: '2px solid #FF0000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Mini rocket pixel */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ imageRendering: 'pixelated' }}>
              <rect x="7" y="1" width="4" height="6" fill="#fff" />
              <rect x="5" y="6" width="8" height="5" fill="#fff" />
              <rect x="2" y="10" width="4" height="4" fill="#000" />
              <rect x="12" y="10" width="4" height="4" fill="#000" />
              <rect x="7" y="12" width="4" height="4" fill="#FFCE00" />
            </svg>
          </div>
          <div>
            <div
              className="text-white leading-none"
              style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '0.10em', textTransform: 'uppercase' }}
            >
              ROCKET LEAD
            </div>
            <div
              style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: 'rgba(255,0,0,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase' }}
            >
              DEUTSCHLAND EDITION
            </div>
          </div>
        </div>

        {/* Main content */}
        <div>
          {/* Tag */}
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 mb-6"
            style={{ background: 'rgba(255,0,0,0.08)', border: '2px solid rgba(255,0,0,0.35)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-2 h-2 bg-red-500 animate-pixel-blink" style={{ imageRendering: 'pixelated' }} />
            <span style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#FF0000', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              MOROCCAN PROFESSIONALS × GERMAN COMPANIES
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-white leading-none tracking-wide mb-6"
            style={{ fontFamily: "'VT323', monospace", fontSize: 'clamp(3rem, 5vw, 5rem)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          >
            LAUNCH YOUR<br />
            <span className="text-glow-red">CAREER IN DE.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            className="mb-8 max-w-sm leading-snug"
            style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em', textTransform: 'uppercase' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            SEND PERSONALIZED CV EMAILS TO GERMAN COMPANIES AT SCALE. AI-WRITTEN. GMAIL-SENT. SMTP-SAFE.
          </motion.p>

          {/* Features */}
          <div className="space-y-2 mb-10">
            {features.map((feature, i) => {
              const Icon = feature.icon
              const isHov = hoveredFeature === i
              return (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 cursor-default"
                  style={{
                    background: isHov ? 'rgba(255,0,0,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `2px solid ${isHov ? 'rgba(255,0,0,0.45)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.1s steps(2)',
                  }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.07 }}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div
                    style={{
                      width: 28, height: 28,
                      background: isHov ? 'rgba(255,0,0,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${isHov ? 'rgba(255,0,0,0.5)' : 'rgba(255,255,255,0.07)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isHov ? '#FF0000' : 'rgba(255,255,255,0.35)',
                      transition: 'all 0.1s steps(2)',
                    }}
                  >
                    <Icon size={12} />
                  </div>
                  <div>
                    <div
                      className="leading-none"
                      style={{ fontFamily: "'VT323', monospace", fontSize: '17px', color: isHov ? '#fff' : 'rgba(255,255,255,0.65)', letterSpacing: '0.06em' }}
                    >
                      {feature.text}
                    </div>
                    <div
                      style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: isHov ? '#FFCE00' : 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}
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
            transition={{ delay: 0.85 }}
          >
            {stats.map((stat, i) => (
              <div key={i}>
                <div
                  className="text-glow-gold leading-none"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '2.4rem', letterSpacing: '0.06em' }}
                >
                  {stat.value}
                </div>
                <div
                  style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.10em', textTransform: 'uppercase' }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer + mascot */}
        <div className="flex items-end justify-between">
          <p
            style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: 'rgba(255,255,255,0.20)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            VS. INSTANTLY · LEMLIST · MAILSHAKE
          </p>
          <RocketCortexMascot />
        </div>
      </motion.div>

      {/* Vertical separator */}
      <div
        className="hidden lg:block w-[2px] self-stretch my-10 relative z-10"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,0,0,0.4) 30%, rgba(255,206,0,0.3) 70%, transparent 100%)' }}
      />

      {/* RIGHT — Sign in card */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, type: 'spring', stiffness: 100, damping: 20 }}
        >
          {/* Card */}
          <div
            style={{
              background: 'rgba(6,0,0,0.85)',
              border: '2px solid rgba(255,0,0,0.45)',
              boxShadow: '0 0 40px rgba(255,0,0,0.10), inset 0 0 0 1px rgba(255,0,0,0.06)',
            }}
          >
            {/* Top accent bar — German flag colors */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #000 0%, #FF0000 40%, #FFCE00 70%, #000 100%)' }} />

            <div className="p-8">
              {/* Mobile logo */}
              <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
                <div
                  style={{ width: 32, height: 32, background: '#FF0000', border: '2px solid #FF0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ imageRendering: 'pixelated' }}>
                    <rect x="6" y="1" width="4" height="5" fill="#fff" />
                    <rect x="4" y="5" width="8" height="5" fill="#fff" />
                    <rect x="6" y="11" width="4" height="3" fill="#FFCE00" />
                  </svg>
                </div>
                <span
                  className="text-white"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '0.10em', textTransform: 'uppercase' }}
                >
                  ROCKET LEAD
                </span>
              </div>

              <div className="mb-6">
                <h2
                  className="text-white leading-none mb-2 tracking-wide uppercase"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '2.2rem', letterSpacing: '0.06em' }}
                >
                  ACCESS GRANTED
                </h2>
                <p
                  style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: 'rgba(255,255,255,0.40)', letterSpacing: '0.04em', lineHeight: 1.4, textTransform: 'uppercase' }}
                >
                  CONNECT YOUR GMAIL TO LAUNCH CV CAMPAIGNS INTO THE GERMAN JOB MARKET.
                </p>
              </div>

              {/* Permissions info */}
              <div
                className="flex items-start gap-3 p-3 mb-6"
                style={{ background: 'rgba(255,0,0,0.06)', border: '2px solid rgba(255,0,0,0.25)' }}
              >
                <CheckCircle2 size={14} style={{ color: '#FF0000', marginTop: 2, flexShrink: 0 }} />
                <p
                  style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: 'rgba(255,255,255,0.40)', letterSpacing: '0.03em', lineHeight: 1.5, textTransform: 'uppercase' }}
                >
                  GMAIL SEND + READ ACCESS REQUIRED. YOUR DATA NEVER LEAVES YOUR ACCOUNT.
                </p>
              </div>

              {/* Sign in button */}
              <motion.button
                onClick={handleSignIn}
                disabled={loading}
                className="relative w-full flex items-center justify-center gap-3 py-3.5 px-6 overflow-hidden"
                style={{
                  background: loading ? 'rgba(255,255,255,0.85)' : '#ffffff',
                  color: '#111827',
                  border: '2px solid #fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'VT323', monospace",
                  fontSize: '18px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 24px rgba(255,255,255,0.15)',
                }}
                whileHover={!loading ? { scale: 1.02, boxShadow: '0 6px 32px rgba(255,255,255,0.25)' } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div key="loading" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                      AUTHENTICATING...
                    </motion.div>
                  ) : (
                    <motion.div key="default" className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* Google logo */}
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      CONTINUE WITH GOOGLE
                      <ArrowRight size={14} className="ml-auto" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <p
                className="text-center mt-4"
                style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: 'rgba(255,255,255,0.20)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                BY CONTINUING YOU AGREE TO OUR{' '}
                <span style={{ color: 'rgba(255,0,0,0.55)', cursor: 'pointer', textDecoration: 'underline' }}>TERMS</span>
              </p>
            </div>
          </div>

          {/* Gold glow line below card */}
          <div
            className="h-[2px] mt-[1px] mx-6"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,0,0,0.5), transparent)' }}
          />
        </motion.div>
      </div>
    </div>
  )
}
