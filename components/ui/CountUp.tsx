'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface CountUpProps {
  end: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function CountUp({
  end,
  duration = 1.8,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const frameRef = useRef<number>()

  useEffect(() => {
    if (!isInView) return

    const startTime = performance.now()
    const startVal = 0

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const update = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / (duration * 1000)
      const progress = Math.min(elapsed, 1)
      const easedProgress = easeOutCubic(progress)
      const currentVal = Math.round((startVal + (end - startVal) * easedProgress) * Math.pow(10, decimals)) / Math.pow(10, decimals)

      setCount(currentVal)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(update)
      }
    }

    frameRef.current = requestAnimationFrame(update)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [isInView, end, duration, decimals])

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}
