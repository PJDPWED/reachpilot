'use client'

import { ArrowRight } from 'lucide-react'
import { useState, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const Dithering = lazy(() =>
  import('@paper-design/shaders-react').then((mod) => ({ default: mod.Dithering }))
)

/**
 * RocketHero — Full-width CTA hero card with dithering shader.
 * The dithering effect speeds up on hover, giving a live "signal lock" feel.
 * Gold dithering on pure black with red accents — German flag palette.
 */
export function RocketHero() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.section
      className="w-full mb-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 120, damping: 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative overflow-hidden"
        style={{
          border: '2px solid rgba(255,0,0,0.45)',
          minHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          transition: 'border-color 0.2s',
          borderColor: isHovered ? 'rgba(255,206,0,0.6)' : 'rgba(255,0,0,0.45)',
        }}
      >
        {/* Dithering shader layer */}
        <Suspense fallback={<div className="absolute inset-0" style={{ background: 'rgba(255,206,0,0.03)' }} />}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: 0.35, mixBlendMode: 'screen', zIndex: 0 }}
          >
            <Dithering
              colorBack="#00000000"
              colorFront="#FFCE00"
              shape="warp"
              type="4x4"
              speed={isHovered ? 0.65 : 0.18}
              className="size-full"
              minPixelRatio={1}
            />
          </div>
        </Suspense>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500" />

        {/* Content */}
        <div className="relative z-10 px-8 text-center flex flex-col items-center gap-5">
          {/* Status badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1"
            style={{ border: '2px solid rgba(255,0,0,0.55)', background: 'rgba(255,0,0,0.08)' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-red-500" />
            </span>
            <span
              className="text-red-400 tracking-widest font-mono"
              style={{ fontSize: '15px', letterSpacing: '0.12em' }}
            >
              8-MIN SMTP PROTECTION ACTIVE
            </span>
          </div>

          {/* Headline */}
          <div>
            <h2
              className="text-white leading-none tracking-wide font-sans"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              ROCKET LEAD
            </h2>
            <div
              className="text-glow-red leading-none tracking-wide font-sans"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              DEUTSCHLAND EDITION
            </div>
          </div>

          {/* Sub */}
          <p
            className="max-w-xl leading-snug"
            style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}
          >
            LAUNCH YOUR CAREER IN GERMANY. AUTOMATED, TIMED, AND PRECISE CV DELIVERY FOR MOROCCAN PROFESSIONALS.
          </p>

          {/* CTA */}
          <Link
            href="/upload"
            className="group relative inline-flex h-12 items-center gap-3 px-10 overflow-hidden"
            style={{
              background: '#FF0000',
              border: '2px solid #FF0000',
              color: '#000',
              fontFamily: "'VT323', monospace",
              fontSize: '20px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
              transition: 'all 0.1s steps(2)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#FFCE00'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#FFCE00'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#FF0000'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#FF0000'
            }}
          >
            DEPLOY CV NOW
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
