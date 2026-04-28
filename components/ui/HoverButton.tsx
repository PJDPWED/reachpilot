'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'ghost'
}

const HoverButton = React.forwardRef<HTMLButtonElement, HoverButtonProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const [isListening, setIsListening] = React.useState(false)
    const [circles, setCircles] = React.useState<Array<{
      id: number
      x: number
      y: number
      fadeState: 'in' | 'out' | null
    }>>([])
    const lastAddedRef = React.useRef(0)

    const createCircle = React.useCallback((x: number, y: number) => {
      setCircles((prev) => [...prev, { id: Date.now(), x, y, fadeState: null }])
    }, [])

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!isListening) return
        const now = Date.now()
        if (now - lastAddedRef.current > 100) {
          lastAddedRef.current = now
          const rect = event.currentTarget.getBoundingClientRect()
          createCircle(event.clientX - rect.left, event.clientY - rect.top)
        }
      },
      [isListening, createCircle]
    )

    React.useEffect(() => {
      circles.forEach((circle) => {
        if (!circle.fadeState) {
          setTimeout(() => setCircles((prev) => prev.map((c) => c.id === circle.id ? { ...c, fadeState: 'in' } : c)), 0)
          setTimeout(() => setCircles((prev) => prev.map((c) => c.id === circle.id ? { ...c, fadeState: 'out' } : c)), 1000)
          setTimeout(() => setCircles((prev) => prev.filter((c) => c.id !== circle.id)), 2200)
        }
      })
    }, [circles])

    return (
      <button
        ref={buttonRef}
        className={cn(
          'relative isolate px-6 py-2.5 rounded-xl overflow-hidden cursor-pointer',
          'text-white font-medium text-sm leading-5 tracking-tight',
          'backdrop-blur-xl',
          'transition-all duration-200',
          variant === 'default' && [
            'bg-white/10',
            'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),inset_0_0_16px_0_rgba(255,255,255,0.06),0_1px_3px_0_rgba(0,0,0,0.50),0_4px_12px_0_rgba(0,0,0,0.40)]',
            'hover:bg-white/15 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28),0_1px_3px_0_rgba(0,0,0,0.50),0_4px_20px_0_rgba(0,0,0,0.45)]',
            'active:scale-[0.975]',
          ],
          variant === 'ghost' && [
            'bg-transparent',
            'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]',
            'hover:bg-white/08',
          ],
          className
        )}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setIsListening(true)}
        onPointerLeave={() => setIsListening(false)}
        {...props}
      >
        {circles.map(({ id, x, y, fadeState }) => (
          <div
            key={id}
            className={cn(
              'absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full',
              'blur-xl pointer-events-none z-[-1] transition-opacity duration-300',
              fadeState === 'in' && 'opacity-60',
              fadeState === 'out' && 'opacity-0 duration-[1.2s]',
              !fadeState && 'opacity-0'
            )}
            style={{ left: x, top: y, background: 'radial-gradient(circle, rgba(255,255,255,0.8), rgba(255,255,255,0.1))' }}
          />
        ))}
        {children}
      </button>
    )
  }
)

HoverButton.displayName = 'HoverButton'
export { HoverButton }
