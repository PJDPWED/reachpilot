'use client'

import { motion, type MotionProps } from 'framer-motion'

interface FadeInProps extends MotionProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
  once?: boolean
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  className,
  once = true,
  ...props
}: FadeInProps) {
  const offsets = {
    up:    { y: 18, x: 0 },
    down:  { y: -12, x: 0 },
    left:  { y: 0, x: 18 },
    right: { y: 0, x: -18 },
    none:  { y: 0, x: 0 },
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{
        duration,
        delay,
        type: 'spring',
        stiffness: 100,
        damping: 18,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/* Staggered list container */
export function StaggerList({
  children,
  stagger = 0.06,
  className,
}: {
  children: React.ReactNode
  stagger?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden:  { opacity: 0, y: 16, scale: 0.98 },
        visible: {
          opacity: 1, y: 0, scale: 1,
          transition: { type: 'spring', stiffness: 120, damping: 18 },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
