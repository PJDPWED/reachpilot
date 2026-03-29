'use client'

import { useEffect, useRef } from 'react'

/**
 * Ambient 3D background — five color orbs drifting with sinusoidal animations,
 * layered over a subtle grid mesh and grain texture.
 * Pure CSS/Canvas — no WebGL dependency, runs at 60fps.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Deep background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #030308 0%, #020203 50%, #04020a 100%)' }} />

      {/* Orb 1 — Indigo, top-left */}
      <div
        className="absolute animate-orb-1"
        style={{
          width: '70vw', height: '70vw',
          maxWidth: '900px', maxHeight: '900px',
          top: '-20%', left: '-15%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0.06) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Orb 2 — Violet, top-right */}
      <div
        className="absolute animate-orb-2"
        style={{
          width: '60vw', height: '60vw',
          maxWidth: '800px', maxHeight: '800px',
          top: '-10%', right: '-10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.05) 50%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Orb 3 — Blue, center */}
      <div
        className="absolute animate-orb-3"
        style={{
          width: '55vw', height: '55vw',
          maxWidth: '700px', maxHeight: '700px',
          top: '25%', left: '20%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.04) 50%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Orb 4 — Purple-pink, bottom-right */}
      <div
        className="absolute animate-orb-4"
        style={{
          width: '50vw', height: '50vw',
          maxWidth: '650px', maxHeight: '650px',
          bottom: '-10%', right: '5%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.16) 0%, rgba(167,139,250,0.04) 50%, transparent 70%)',
          filter: 'blur(65px)',
        }}
      />

      {/* Orb 5 — Cyan accent, bottom-left */}
      <div
        className="absolute animate-orb-5"
        style={{
          width: '40vw', height: '40vw',
          maxWidth: '500px', maxHeight: '500px',
          bottom: '5%', left: '5%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0.03) 50%, transparent 70%)',
          filter: 'blur(55px)',
        }}
      />

      {/* Grid mesh overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(2,2,3,0.7) 100%)',
        }}
      />
    </div>
  )
}
