'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Clock } from 'lucide-react'

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
 *  - Progress bar fills from RED (full cooldown) → GOLD (clearing)
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

  // Color interpolation: RED (0%) → GOLD (100%)
  const barColor = isInCooldown
    ? `rgba(255,${Math.round(progressPct * 2.06)},0,0.9)` // red → orange
    : '#FFCE00'

  const canSend = !isInCooldown && !isSending && campaignStatus !== 'completed' && campaignStatus !== 'running'

  return (
    <div
      className="pixel-surface relative overflow-hidden"
      style={{ padding: '20px 24px' }}
    >
      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2 h-2 animate-pixel-blink"
          style={{
            background: isInCooldown ? '#FF0000' : '#FFCE00',
            imageRendering: 'pixelated',
          }}
        />
        <Shield size={13} style={{ color: isInCooldown ? '#FF0000' : '#FFCE00' }} />
        <span
          className="tracking-widest uppercase"
          style={{
            fontFamily: "'VT323', monospace",
            fontSize: '14px',
            color: isInCooldown ? '#FF0000' : '#FFCE00',
            letterSpacing: '0.10em',
          }}
        >
          {isInCooldown ? 'SMTP COOLDOWN ACTIVE' : 'SMTP CLEAR — READY TO SEND'}
        </span>
      </div>

      <div className="flex items-end justify-between gap-6 flex-wrap">
        {/* Countdown display */}
        <div>
          <AnimatePresence mode="wait">
            {isInCooldown ? (
              <motion.div
                key="counting"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <div
                  className="text-glow-red leading-none mb-1"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '5rem', letterSpacing: '0.08em' }}
                >
                  {formatTime(remaining)}
                </div>
                <div
                  className="uppercase tracking-widest"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: 'rgba(255,0,0,0.55)' }}
                >
                  UNTIL NEXT BATCH WINDOW
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
                  className="text-glow-gold leading-none mb-1"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '5rem', letterSpacing: '0.08em' }}
                >
                  00:00
                </div>
                <div
                  className="uppercase tracking-widest"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: 'rgba(255,206,0,0.55)' }}
                >
                  COOLDOWN CLEARED
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress + Send button */}
        <div className="flex-1 min-w-[200px] space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="uppercase tracking-widest"
                style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}
              >
                SMTP HEALTH
              </span>
              <span
                style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: isInCooldown ? '#FF0000' : '#FFCE00' }}
              >
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="pixel-progress">
              <motion.div
                className="h-full"
                style={{ background: barColor, imageRendering: 'pixelated' }}
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'linear' }}
              />
            </div>
          </div>

          {/* 8 min blocks visualization */}
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => {
              const blockPct = (i + 1) / 8 * 100
              const filled = progressPct >= blockPct
              const partial = progressPct >= i / 8 * 100 && progressPct < blockPct
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '8px',
                    imageRendering: 'pixelated',
                    background: filled
                      ? '#FFCE00'
                      : partial
                      ? '#FF0000'
                      : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'background 0.3s',
                  }}
                />
              )
            })}
          </div>

          {/* Info row */}
          <div className="flex items-center gap-2">
            <Clock size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span
              style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: 'rgba(255,255,255,0.30)', letterSpacing: '0.04em' }}
            >
              8-MIN GAP BETWEEN BATCHES · GMAIL DELIVERABILITY PROTECTION
            </span>
          </div>

          {/* Send button */}
          <motion.button
            onClick={onSend}
            disabled={!canSend}
            className={canSend ? 'btn-gold w-full justify-center text-lg py-3' : 'btn-pixel w-full justify-center text-lg py-3'}
            style={{ opacity: canSend ? 1 : 0.45 }}
            whileHover={canSend ? { scale: 1.01 } : {}}
            whileTap={canSend ? { scale: 0.98 } : {}}
          >
            {isSending ? (
              <>
                <div
                  className="w-3.5 h-3.5 border-2 border-current"
                  style={{ borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }}
                />
                SENDING BATCH...
              </>
            ) : isInCooldown ? (
              <>
                <Shield size={14} />
                COOLDOWN IN PROGRESS
              </>
            ) : (
              <>
                <Zap size={14} />
                DEPLOY NEXT BATCH
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Scanline overlay on surface */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
          zIndex: 1,
        }}
      />
    </div>
  )
}
