'use client'

import { cn } from '@/utils/helpers'
import { motion } from 'framer-motion'

// White/neutral palette — Rocket Lead Deutschland Edition
const configs: Record<string, { bg: string; border: string; text: string; dot: string; pulse?: boolean }> = {
  pending:   { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.45)', dot: 'rgba(255,255,255,0.4)' },
  queued:    { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.20)', text: 'rgba(255,255,255,0.70)', dot: 'rgba(255,255,255,0.65)', pulse: true },
  sending:   { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.25)', text: 'rgba(255,255,255,0.70)', dot: 'rgba(255,255,255,0.70)', pulse: true },
  sent:      { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.22)', text: 'rgba(255,255,255,0.70)', dot: 'rgba(255,255,255,0.65)' },
  failed:    { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.22)', text: 'rgba(255,255,255,0.70)', dot: 'rgba(255,255,255,0.65)' },
  replied:   { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', text: '#fff',                  dot: '#fff' },
  running:   { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.25)', text: 'rgba(255,255,255,0.70)', dot: 'rgba(255,255,255,0.70)', pulse: true },
  paused:    { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.18)', text: 'rgba(255,255,255,0.60)', dot: 'rgba(255,255,255,0.55)' },
  completed: { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.22)', text: 'rgba(255,255,255,0.70)', dot: 'rgba(255,255,255,0.65)' },
  YES:       { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.22)', text: 'rgba(255,255,255,0.70)', dot: 'rgba(255,255,255,0.65)' },
  NO:        { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.20)', text: 'rgba(255,255,255,0.70)', dot: 'rgba(255,255,255,0.65)' },
  NEUTRAL:   { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)', text: 'rgba(255,255,255,0.40)', dot: 'rgba(255,255,255,0.35)' },
}

const defaultConfig = {
  bg: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.10)',
  text: 'rgba(255,255,255,0.40)',
  dot: 'rgba(255,255,255,0.35)',
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, label, className, size = 'md' }: StatusBadgeProps) {
  const cfg = configs[status] ?? defaultConfig
  const displayLabel = label || status.toUpperCase()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1',
        className
      )}
      style={{
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        color: cfg.text,
        fontFamily: 'var(--font-geist-mono)',
        fontSize: size === 'sm' ? '13px' : '14px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        borderRadius: 6,
      }}
    >
      {cfg.pulse ? (
        <motion.span
          style={{
            width: 5, height: 5,
            background: cfg.dot,
            borderRadius: 1,
            display: 'inline-block',
            flexShrink: 0,
          }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      ) : (
        <span
          style={{
            width: 5, height: 5,
            background: cfg.dot,
            borderRadius: 1,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {displayLabel}
    </span>
  )
}
