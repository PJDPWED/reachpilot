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
        className="w-16 h-16 flex items-center justify-center mb-5 relative"
        style={{
          background: 'rgba(255,0,0,0.06)',
          border: '2px solid rgba(255,0,0,0.30)',
          boxShadow: '0 0 24px rgba(255,0,0,0.12)',
          imageRendering: 'pixelated',
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon size={26} style={{ color: 'rgba(255,0,0,0.7)' }} className="relative z-10" />
      </motion.div>

      <h3
        className="text-white mb-2"
        style={{ fontFamily: "'VT323', monospace", fontSize: '1.5rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="max-w-xs leading-snug"
          style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}
