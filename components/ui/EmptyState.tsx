'use client'

import { motion } from 'framer-motion'
import { cn } from '@/utils/helpers'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      className={cn('flex flex-col items-center justify-center py-20 text-center', className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100, damping: 18 }}
    >
      <motion.div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
        style={{
          background: 'rgba(99,102,241,0.10)',
          border: '1px solid rgba(99,102,241,0.20)',
          boxShadow: '0 0 32px rgba(99,102,241,0.15)',
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Inner glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-40"
          style={{ background: 'radial-gradient(circle at 40% 30%, rgba(99,102,241,0.3), transparent 70%)' }}
        />
        <Icon size={26} style={{ color: 'var(--accent-light)' }} className="relative z-10" />
      </motion.div>

      <h3 className="font-heading text-lg text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}
