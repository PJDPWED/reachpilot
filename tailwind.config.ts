import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Typography ───────────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      // ─── Color System ─────────────────────────────────────────────────────────
      colors: {
        // Base surfaces — pure black to deep charcoal
        base: {
          0:   '#000000',
          50:  '#060608',
          100: '#0c0c0e',
          150: '#111114',
          200: '#17171b',
          300: '#1e1e24',
          400: '#28282f',
        },

        // Accent — Red (primary brand)
        red: {
          dim:    'rgba(220, 38, 38, 0.12)',
          low:    'rgba(220, 38, 38, 0.25)',
          mid:    'rgba(220, 38, 38, 0.45)',
          full:   '#DC2626',
          bright: '#EF4444',
          glow:   'rgba(220, 38, 38, 0.30)',
        },

        // Accent — Gold (secondary brand)
        gold: {
          dim:    'rgba(234, 179, 8, 0.12)',
          low:    'rgba(234, 179, 8, 0.25)',
          mid:    'rgba(234, 179, 8, 0.45)',
          full:   '#EAB308',
          bright: '#FDE047',
          glow:   'rgba(234, 179, 8, 0.28)',
        },

        // Glass surfaces — white at very low opacity
        glass: {
          1:  'rgba(255, 255, 255, 0.03)',
          2:  'rgba(255, 255, 255, 0.055)',
          3:  'rgba(255, 255, 255, 0.09)',
          4:  'rgba(255, 255, 255, 0.13)',
          5:  'rgba(255, 255, 255, 0.20)',
        },

        // Text
        text: {
          primary:   '#FFFFFF',
          secondary: 'rgba(255, 255, 255, 0.60)',
          muted:     'rgba(255, 255, 255, 0.28)',
          disabled:  'rgba(255, 255, 255, 0.14)',
        },

        // Status
        success: { DEFAULT: '#10b981', glow: 'rgba(16, 185, 129, 0.25)' },
        warning: { DEFAULT: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)' },
        danger:  { DEFAULT: '#ef4444', glow: 'rgba(239, 68, 68, 0.25)' },
      },

      // ─── Borders ──────────────────────────────────────────────────────────────
      borderColor: {
        'glass':        'rgba(255, 255, 255, 0.07)',
        'glass-bright': 'rgba(255, 255, 255, 0.13)',
        'glass-heavy':  'rgba(255, 255, 255, 0.20)',
        'red-dim':      'rgba(220, 38, 38, 0.20)',
        'red-mid':      'rgba(220, 38, 38, 0.45)',
        'red-full':     'rgba(220, 38, 38, 0.80)',
        'gold-dim':     'rgba(234, 179, 8, 0.20)',
        'gold-mid':     'rgba(234, 179, 8, 0.45)',
      },

      // ─── Border Radius — smooth, not boxy ────────────────────────────────────
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '14px',
        xl:   '18px',
        '2xl':'24px',
        '3xl':'32px',
      },

      // ─── Box Shadows ──────────────────────────────────────────────────────────
      boxShadow: {
        // Glass elevation layers
        'glass-sm':   '0 2px 8px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass':      '0 4px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.07)',
        'glass-lg':   '0 8px 48px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.09)',
        'glass-xl':   '0 16px 80px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.10)',

        // Brand glows — used sparingly on active/focus states
        'glow-red':   '0 0 20px rgba(220,38,38,0.35), 0 0 60px rgba(220,38,38,0.12)',
        'glow-gold':  '0 0 20px rgba(234,179,8,0.35), 0 0 60px rgba(234,179,8,0.12)',
        'glow-white': '0 0 16px rgba(255,255,255,0.10)',

        // Inset highlight — top sheen on glass cards
        'sheen':      'inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.30)',

        // Focus ring
        'focus-red':  '0 0 0 2px rgba(220,38,38,0.40)',
        'focus-gold': '0 0 0 2px rgba(234,179,8,0.40)',
      },

      // ─── Backdrop Blur ────────────────────────────────────────────────────────
      backdropBlur: {
        xs:     '4px',
        sm:     '8px',
        md:     '16px',
        lg:     '24px',
        xl:     '40px',
        glass:  '20px',
        heavy:  '48px',
      },

      // ─── Background Images ────────────────────────────────────────────────────
      backgroundImage: {
        'gradient-radial':     'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':      'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-sheen':         'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 60%)',
        'glass-sheen-bottom':  'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.20) 100%)',
        'red-radial':          'radial-gradient(circle at 50% 0%, rgba(220,38,38,0.15) 0%, transparent 70%)',
        'gold-radial':         'radial-gradient(circle at 50% 100%, rgba(234,179,8,0.12) 0%, transparent 70%)',
        'noise':               "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },

      // ─── Animations ───────────────────────────────────────────────────────────
      animation: {
        'fade-in':      'fadeIn 0.30s cubic-bezier(0.16,1,0.3,1)',
        'fade-up':      'fadeUp 0.40s cubic-bezier(0.16,1,0.3,1)',
        'fade-down':    'fadeDown 0.40s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':     'scaleIn 0.30s cubic-bezier(0.16,1,0.3,1)',
        'slide-right':  'slideRight 0.35s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':      'shimmer 2.2s linear infinite',
        'pulse-glow':   'pulseGlow 3s ease-in-out infinite',
        'pulse-slow':   'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':    'spin 8s linear infinite',
        'blink':        'blink 1.2s step-end infinite',
        'orb-1':        'orb1 20s ease-in-out infinite',
        'orb-2':        'orb2 26s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition:  '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        orb1: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%':      { transform: 'translate(40px,-30px) scale(1.06)' },
          '66%':      { transform: 'translate(-25px,35px) scale(0.94)' },
        },
        orb2: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%':      { transform: 'translate(-55px,25px) scale(1.08)' },
        },
      },

      // ─── Transitions ──────────────────────────────────────────────────────────
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      transitionDuration: {
        '50':  '50ms',
        '150': '150ms',
        '250': '250ms',
      },
    },
  },
  plugins: [],
}

export default config
