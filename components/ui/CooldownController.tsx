'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CooldownControllerProps {
  /** ISO timestamp — when the cooldown clears. Null means no cooldown. */
  cooldownUntil: string | null
  /** Called when user clicks Send while cooldown is clear */
  onSend: () => void
  /** Whether a send is currently in progress */
  isSending?: boolean
  /** Campaign status */
  campaignStatus?: string
}

const COOLDOWN_MS = 8 * 60 * 1000 // 8 minutes

/**
 * CooldownController — visualizes the 8-minute SMTP cooldown gap.
 *
 * Logic:
 *  - Receives `cooldownUntil` timestamp from parent (sourced from DB)
 *  - Polls every second via setInterval to update displayed time
 *  - Progress bar fills as cooldown elapses
 *  - Blocks the send action while `remaining > 0`
 *  - When timer hits 0, the Send button becomes available instantly
 */
export function CooldownController({
  cooldownUntil,
  onSend,
  isSending = false,
  campaignStatus,
}: CooldownControllerProps) {
  const [remaining, setRemaining] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const compute = useCallback(() => {
    if (!cooldownUntil) {
      setRemaining(0)
      setElapsed(COOLDOWN_MS)
      return
    }
    const until = new Date(cooldownUntil).getTime()
    const now = Date.now()
    const rem = Math.max(0, until - now)
    const elap = COOLDOWN_MS - rem
    setRemaining(rem)
    setElapsed(elap)
  }, [cooldownUntil])

  useEffect(() => {
    compute()
    if (!cooldownUntil) return
    const interval = setInterval(compute, 1000)
    return () => clearInterval(interval)
  }, [cooldownUntil, compute])

  const isInCooldown = remaining > 0
  const progressPct = Math.min(100, (elapsed / COOLDOWN_MS) * 100)

  // MM:SS formatter
  const formatTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000)
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0')
    const s = (totalSec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const canSend = !isInCooldown && !isSending && campaignStatus !== 'completed' && campaignStatus !== 'running'

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        padding: '24px',
      }}
    >
      {/* Top row: status pill + percentage */}
      <div className="flex items-center justify-between mb-6">
        {/* Status pill */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Dot */}
          {isInCooldown ? (
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.30)',
              }}
            />
          ) : (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: '#ffffff',
              }}
            />
          )}
          <span
            style={{
              fontFamily: 'var(--font-geist-sans)',
              fontSize: '12px',
              color: isInCooldown ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)',
              fontWeight: 500,
            }}
          >
            {isInCooldown ? 'Cooldown active' : 'Ready to send'}
          </span>
        </div>

        {/* Percentage */}
        <span
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.50)',
          }}
        >
          {Math.round(progressPct)}%
        </span>
      </div>

      {/* Middle: huge timer */}
      <div className="mb-6">
        <AnimatePresence mode="wait">
          {isInCooldown ? (
            <motion.div
              key="counting"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <div
                className="leading-none mb-1"
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '4rem',
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatTime(remaining)}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.30)',
                  letterSpacing: '0.04em',
                }}
              >
                until next batch
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="clear"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <div
                className="leading-none mb-1"
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '4rem',
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                00:00
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.30)',
                  letterSpacing: '0.04em',
                }}
              >
                cooldown cleared
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div
          className="rounded-full overflow-hidden"
          style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isInCooldown ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.80)',
            }}
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Deploy Next Batch button */}
      <motion.button
        onClick={onSend}
        disabled={!canSend}
        className="w-full rounded-xl py-3 flex items-center justify-center gap-2"
        style={{
          background: canSend ? '#ffffff' : 'rgba(255,255,255,0.08)',
          color: canSend ? '#000000' : 'rgba(255,255,255,0.30)',
          fontFamily: 'var(--font-geist-sans)',
          fontWeight: 600,
          fontSize: '14px',
          border: 'none',
          cursor: canSend ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s, color 0.2s',
        }}
        whileHover={canSend ? { scale: 1.01 } : {}}
        whileTap={canSend ? { scale: 0.98 } : {}}
      >
        {isSending ? (
          <>
            <div
              className="rounded-full"
              style={{
                width: 14,
                height: 14,
                border: '2px solid rgba(0,0,0,0.20)',
                borderTopColor: '#000000',
                animation: 'spin 0.6s linear infinite',
              }}
            />
            Sending batch...
          </>
        ) : isInCooldown ? (
          'Cooldown in progress'
        ) : (
          'Deploy Next Batch'
        )}
      </motion.button>
    </div>
  )
}
