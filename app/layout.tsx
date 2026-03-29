import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { SmoothScroll } from '@/components/providers/SmoothScroll'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'ReachPilot — AI Cold Outreach Automation',
  description:
    'AI-powered cold email platform with Gmail integration, smart scheduling, reply detection, and automated follow-ups.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <SmoothScroll />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(10,10,20,0.92)',
                backdropFilter: 'blur(20px)',
                color: '#f1f5f9',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '500',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#34d399', secondary: '#020203' },
                style: {
                  background: 'rgba(10,10,20,0.92)',
                  border: '1px solid rgba(52,211,153,0.25)',
                },
              },
              error: {
                iconTheme: { primary: '#f87171', secondary: '#020203' },
                style: {
                  background: 'rgba(10,10,20,0.92)',
                  border: '1px solid rgba(248,113,113,0.25)',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
