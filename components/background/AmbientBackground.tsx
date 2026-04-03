'use client'

import { useEffect, useRef } from 'react'

// ─── Canvas Pixel Particle System — German Flag Palette ───────────────────────

interface Pixel {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  maxOpacity: number
  color: string
  life: number
  maxLife: number
  twinkleOffset: number
}

const PIXEL_COLORS = [
  '#FF0000',
  '#cc0000',
  'rgba(255,0,0,0.7)',
  '#FFCE00',
  '#e6b800',
  'rgba(255,206,0,0.6)',
  'rgba(255,255,255,0.5)',
]

function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const pixels: Pixel[] = []
    const MAX_PIXELS = 55

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function spawnPixel(fromBottom = false): Pixel {
      const size = [2, 2, 4, 4, 6][Math.floor(Math.random() * 5)]
      const maxLife = 160 + Math.random() * 200
      return {
        x: Math.random() * canvas!.width,
        y: fromBottom ? canvas!.height + 10 : Math.random() * canvas!.height,
        size,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: -(Math.random() * 0.35 + 0.12),
        opacity: 0,
        maxOpacity: Math.random() * 0.5 + 0.15,
        color: PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)],
        life: fromBottom ? 0 : Math.random() * maxLife,
        maxLife,
        twinkleOffset: Math.random() * Math.PI * 2,
      }
    }

    for (let i = 0; i < MAX_PIXELS; i++) pixels.push(spawnPixel(false))

    let t = 0

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      // Grid — red tint
      ctx!.strokeStyle = 'rgba(255,0,0,0.022)'
      ctx!.lineWidth = 1
      const gridSize = 48
      for (let gx = 0; gx < canvas!.width; gx += gridSize) {
        ctx!.beginPath(); ctx!.moveTo(gx, 0); ctx!.lineTo(gx, canvas!.height); ctx!.stroke()
      }
      for (let gy = 0; gy < canvas!.height; gy += gridSize) {
        ctx!.beginPath(); ctx!.moveTo(0, gy); ctx!.lineTo(canvas!.width, gy); ctx!.stroke()
      }

      // Grid dots
      for (let gx = 0; gx < canvas!.width; gx += gridSize) {
        for (let gy = 0; gy < canvas!.height; gy += gridSize) {
          ctx!.fillStyle = 'rgba(255,0,0,0.06)'
          ctx!.fillRect(gx - 1, gy - 1, 2, 2)
        }
      }

      // Floating pixels
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i]
        p.x += p.speedX + Math.sin(t * 0.007 + p.twinkleOffset) * 0.12
        p.y += p.speedY
        p.life++

        const lifeRatio = p.life / p.maxLife
        const twinkle = 0.85 + 0.15 * Math.sin(t * 0.04 + p.twinkleOffset)
        let opacity: number
        if (lifeRatio < 0.12) {
          opacity = p.maxOpacity * (lifeRatio / 0.12) * twinkle
        } else if (lifeRatio > 0.78) {
          opacity = p.maxOpacity * ((1 - lifeRatio) / 0.22) * twinkle
        } else {
          opacity = p.maxOpacity * twinkle
        }

        ctx!.globalAlpha = Math.max(0, opacity)
        ctx!.fillStyle = p.color
        ctx!.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)

        if (p.size >= 4 && opacity > 0.12) {
          ctx!.globalAlpha = opacity * 0.25
          ctx!.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, p.size + 2, p.size + 2)
        }

        if (p.life >= p.maxLife || p.y < -20 || p.x < -20 || p.x > canvas!.width + 20) {
          pixels[i] = spawnPixel(true)
        }
      }

      ctx!.globalAlpha = 1
      t++
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Pure black base */}
      <div className="absolute inset-0" style={{ background: '#000000' }} />

      {/* Red orb — top-left */}
      <div
        className="absolute animate-orb-1"
        style={{
          width: '65vw', height: '65vw',
          maxWidth: '800px', maxHeight: '800px',
          top: '-20%', left: '-15%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,0,0,0.15) 0%, rgba(255,0,0,0.04) 50%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Gold orb — bottom-right */}
      <div
        className="absolute animate-orb-2"
        style={{
          width: '55vw', height: '55vw',
          maxWidth: '700px', maxHeight: '700px',
          bottom: '-10%', right: '-10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,206,0,0.10) 0%, rgba(255,206,0,0.02) 50%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Red orb — center */}
      <div
        className="absolute animate-orb-3"
        style={{
          width: '45vw', height: '45vw',
          maxWidth: '600px', maxHeight: '600px',
          top: '30%', left: '30%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,0,0,0.06) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Pixel canvas */}
      <PixelCanvas />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(0,0,0,0.80) 100%)',
        }}
      />
    </div>
  )
}
