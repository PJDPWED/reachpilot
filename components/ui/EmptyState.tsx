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
      transition={{ duration: 0.4, type: 'spring', stiffness: 120, damping: 20 }}
    >
      <motion.div
        className="w-14 h-14 flex items-center justify-center mb-5 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(12px)',
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon size={22} style={{ color: 'rgba(255,255,255,0.45)' }} />
      </motion.div>

      <h3
        className="text-white mb-2"
        style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em' }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="max-w-xs leading-relaxed"
          style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '13px', color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.01em' }}
        >
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}
