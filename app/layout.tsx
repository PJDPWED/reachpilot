import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { SmoothScroll } from '@/components/providers/SmoothScroll'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy } from 'react'

const Dithering = lazy(() =>
  import('@paper-design/shaders-react').then((mod) => ({ default: mod.Dithering }))
)

export const metadata: Metadata = {
  title: 'Rocket Lead | Deutschland Edition',
  description:
    'Automated CV cold-email platform for Moroccan professionals targeting German companies. 8-minute SMTP protection, Gemini AI personalization, Gmail API precision.',
  icons: {
    icon: '/rocket-icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="relative">
        {/* Global Dithering shader */}
        <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
          <div className="fixed inset-0 pointer-events-none z-0">
            <Dithering
              colorBack="#00000000"
              colorFront="#FFCE00"
              shape="warp"
              type="4x4"
              speed={0.18}
              className="w-full h-full"
              minPixelRatio={1}
            />
          </div>
        </Suspense>
        <AuthProvider>
          <SmoothScroll />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0e0000',
                color: '#fff',
                borderRadius: '0px',
                fontSize: '16px',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.04em',
                border: '2px solid rgba(255,0,0,0.5)',
                boxShadow: '0 0 20px rgba(255,0,0,0.2)',
                padding: '10px 16px',
              },
              success: {
                iconTheme: { primary: '#FFCE00', secondary: '#000' },
                style: {
                  border: '2px solid rgba(255,206,0,0.6)',
                  boxShadow: '0 0 20px rgba(255,206,0,0.2)',
                },
              },
              error: {
                iconTheme: { primary: '#FF0000', secondary: '#000' },
                style: {
                  border: '2px solid rgba(255,0,0,0.7)',
                  boxShadow: '0 0 20px rgba(255,0,0,0.3)',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
