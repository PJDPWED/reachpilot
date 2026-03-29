import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          1: 'rgba(255, 255, 255, 0.035)',
          2: 'rgba(255, 255, 255, 0.065)',
          3: 'rgba(255, 255, 255, 0.10)',
        },
      },
      fontFamily: {
        heading: ['Calistoga', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-highlight': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 0 rgba(255,255,255,0.06) inset',
        'glass-lg': '0 16px 64px rgba(0,0,0,0.55), 0 1px 0 0 rgba(255,255,255,0.08) inset',
        'glow-accent': '0 4px 24px rgba(99,102,241,0.35), 0 0 48px rgba(99,102,241,0.15)',
        'glow-success': '0 4px 16px rgba(16,185,129,0.30)',
        'glow-danger': '0 4px 16px rgba(239,68,68,0.30)',
      },
      backdropBlur: {
        xs: '4px',
        glass: '20px',
        heavy: '40px',
      },
      borderColor: {
        glass: 'rgba(255, 255, 255, 0.07)',
        'glass-bright': 'rgba(255, 255, 255, 0.14)',
      },
      animation: {
        'fade-in':     'fadeIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':    'slideUp 0.45s cubic-bezier(0.16,1,0.3,1)',
        'slide-down':  'slideDown 0.45s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':    'scaleIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        'orb-1':       'orb-1 18s ease-in-out infinite',
        'orb-2':       'orb-2 22s ease-in-out infinite',
        'orb-3':       'orb-3 26s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
