'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/helpers'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  hover?: boolean
  glow?: boolean
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
}

export function GlassCard({
  children,
  hover = true,
  glow = false,
  className,
  padding = 'md',
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'glass-card',
        paddings[padding],
        glow && 'border-[rgba(99,102,241,0.25)] shadow-glow-accent',
        className
      )}
      whileHover={hover ? { y: -2, scale: 1.003 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  iconBg: string
  iconColor?: string
  subtitle?: string
  trend?: { value: number; label: string }
  delay?: number
}

export function StatCard({ label, value, icon, iconBg, subtitle, trend, delay = 0 }: StatCardProps) {
  return (
    <GlassCard
      padding="md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 120, damping: 18 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trend.value >= 0
                ? 'text-emerald-400 bg-emerald-400/10'
                : 'text-red-400 bg-red-400/10'
            )}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div className="text-[28px] font-heading leading-none mb-1 text-white tabular-nums">
        {value}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {subtitle && (
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</div>
      )}
    </GlassCard>
  )
}
