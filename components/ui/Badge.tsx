'use client'

import { cn } from '@/utils/helpers'

const configs: Record<string, { bg: string; text: string; dot: string; extra?: string }> = {
  pending:   { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', dot: '#94a3b8' },
  queued:    { bg: 'rgba(59,130,246,0.14)',  text: '#60a5fa', dot: '#60a5fa' },
  sending:   { bg: 'rgba(245,158,11,0.14)',  text: '#fbbf24', dot: '#fbbf24', extra: 'animate-pulse' },
  sent:      { bg: 'rgba(16,185,129,0.14)',  text: '#34d399', dot: '#34d399' },
  failed:    { bg: 'rgba(239,68,68,0.14)',   text: '#f87171', dot: '#f87171' },
  replied:   { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', dot: '#a78bfa' },
  running:   { bg: 'rgba(59,130,246,0.14)',  text: '#60a5fa', dot: '#60a5fa', extra: 'animate-pulse' },
  paused:    { bg: 'rgba(245,158,11,0.14)',  text: '#fbbf24', dot: '#fbbf24' },
  completed: { bg: 'rgba(16,185,129,0.14)',  text: '#34d399', dot: '#34d399' },
  YES:       { bg: 'rgba(16,185,129,0.14)',  text: '#34d399', dot: '#34d399' },
  NO:        { bg: 'rgba(239,68,68,0.14)',   text: '#f87171', dot: '#f87171' },
  NEUTRAL:   { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', dot: '#94a3b8' },
}

const defaultConfig = { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', dot: '#94a3b8' }

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, label, className, size = 'md' }: StatusBadgeProps) {
  const cfg = configs[status] ?? defaultConfig

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className
      )}
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.extra)}
        style={{ background: cfg.dot }}
      />
      {label || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  )
}
