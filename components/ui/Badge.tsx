'use client'

import { cn } from '@/utils/helpers'

// Red/Gold palette — Rocket Lead Deutschland Edition
const configs: Record<string, { bg: string; border: string; text: string; dot: string; extra?: string }> = {
  pending:   { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.45)', dot: 'rgba(255,255,255,0.4)' },
  queued:    { bg: 'rgba(255,206,0,0.08)',   border: 'rgba(255,206,0,0.30)',   text: '#FFCE00',               dot: '#FFCE00',   extra: 'animate-pulse' },
  sending:   { bg: 'rgba(255,0,0,0.08)',     border: 'rgba(255,0,0,0.35)',     text: '#FF0000',               dot: '#FF0000',   extra: 'animate-pixel-blink' },
  sent:      { bg: 'rgba(255,206,0,0.10)',   border: 'rgba(255,206,0,0.35)',   text: '#FFCE00',               dot: '#FFCE00' },
  failed:    { bg: 'rgba(255,0,0,0.10)',     border: 'rgba(255,0,0,0.40)',     text: '#FF0000',               dot: '#FF0000' },
  replied:   { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', text: '#fff',                  dot: '#fff' },
  running:   { bg: 'rgba(255,0,0,0.10)',     border: 'rgba(255,0,0,0.40)',     text: '#FF0000',               dot: '#FF0000',   extra: 'animate-pixel-blink' },
  paused:    { bg: 'rgba(255,206,0,0.08)',   border: 'rgba(255,206,0,0.30)',   text: '#FFCE00',               dot: '#FFCE00' },
  completed: { bg: 'rgba(255,206,0,0.10)',   border: 'rgba(255,206,0,0.40)',   text: '#FFCE00',               dot: '#FFCE00' },
  YES:       { bg: 'rgba(255,206,0,0.10)',   border: 'rgba(255,206,0,0.35)',   text: '#FFCE00',               dot: '#FFCE00' },
  NO:        { bg: 'rgba(255,0,0,0.10)',     border: 'rgba(255,0,0,0.35)',     text: '#FF0000',               dot: '#FF0000' },
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
        fontFamily: "'VT323', monospace",
        fontSize: size === 'sm' ? '13px' : '14px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        imageRendering: 'pixelated',
      }}
    >
      <span
        className={cn('shrink-0', cfg.extra)}
        style={{
          width: 5, height: 5,
          background: cfg.dot,
          imageRendering: 'pixelated',
          display: 'inline-block',
        }}
      />
      {displayLabel}
    </span>
  )
}
