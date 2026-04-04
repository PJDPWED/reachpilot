import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { SmoothScroll } from '@/components/providers/SmoothScroll'
import { Toaster } from 'react-hot-toast'
import { EtheralShadow } from '@/components/ui/etheral-shadow'

export const metadata: Metadata = {
  title: 'Rocket Lead | Deutschland Edition',
  description:
    'AI-powered cold outreach platform for Moroccan professionals targeting German Ausbildung companies. 8-minute send protection, Gemini AI personalization, Gmail API precision.',
  icons: {
    icon: '/rocket-icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="relative antialiased" style={{ background: '#0a0a0f' }}>

        {/* ── Global Animated Background ───────────────────────────────────────── */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <EtheralShadow
            color="rgba(160, 160, 160, 1)"
            animation={{ scale: 100, speed: 90 }}
            noise={{ opacity: 1, scale: 1.2 }}
            sizing="fill"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* ── App Content ───────────────────────────────────────────────────── */}
        <AuthProvider>
          <SmoothScroll />
          {children}

          <Toaster
            position="top-right"
            gutter={10}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(12, 12, 14, 0.92)',
                color: '#ffffff',
                borderRadius: '10px',
                fontSize: '13px',
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontWeight: '450',
                letterSpacing: '-0.01em',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow:
                  '0 8px 32px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.07)',
                padding: '11px 16px',
                maxWidth: '360px',
              },
              success: {
                iconTheme: { primary: '#ffffff', secondary: '#000' },
                style: {
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow:
                    '0 8px 32px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.07)',
                },
              },
              error: {
                iconTheme: { primary: '#DC2626', secondary: '#fff' },
                style: {
                  border: '1px solid rgba(220, 38, 38, 0.35)',
                  boxShadow:
                    '0 8px 32px rgba(0,0,0,0.60), 0 0 16px rgba(220,38,38,0.15), inset 0 1px 0 rgba(255,255,255,0.07)',
                },
              },
              loading: {
                iconTheme: { primary: 'rgba(255,255,255,0.50)', secondary: 'transparent' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
