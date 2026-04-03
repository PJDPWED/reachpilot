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
  /** Show value in pixel/monospace style */
  pixel?: boolean
}

export function CountUp({
  end,
  duration = 1.8,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  pixel = false,
}: CountUpProps) {
  const [count, setCount] = useState(0)
  const [ticking, setTicking] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const frameRef = useRef<number>()

  useEffect(() => {
    if (!isInView) return

    setTicking(true)
    const startTime = performance.now()

    // Stepped ease-out for pixel aesthetic — feels like a digital counter
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const update = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / (duration * 1000)
      const progress = Math.min(elapsed, 1)
      const easedProgress = easeOutCubic(progress)
      const currentVal =
        Math.round(
          (end * easedProgress) * Math.pow(10, decimals)
        ) / Math.pow(10, decimals)

      setCount(currentVal)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(update)
      } else {
        setTicking(false)
      }
    }

    frameRef.current = requestAnimationFrame(update)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [isInView, end, duration, decimals])

  const formatted = count.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span
      ref={ref}
      className={className}
      style={
        pixel
          ? {
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.04em',
              ...(ticking
                ? { filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.6))' }
                : {}),
              transition: 'filter 0.3s ease',
            }
          : { fontVariantNumeric: 'tabular-nums' }
      }
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
