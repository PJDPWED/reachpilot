'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Rocket, Mail, Shield, Zap, BarChart3 } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

const features = [
  { icon: Mail, text: 'Gmail API integration — no SMTP' },
  { icon: Zap, text: 'AI-generated emails with GPT-4o' },
  { icon: Shield, text: 'Smart scheduling with delays' },
  { icon: BarChart3, text: 'Reply detection & classification' },
]

export default function SignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const handleSignIn = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size={24} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/50">
              <Rocket size={22} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold text-white">ReachPilot</div>
              <div className="text-xs text-brand-300">AI Outreach Automation</div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-8">
            Sign in with Google to access your outreach dashboard and connect your Gmail account.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2.5 text-left"
                >
                  <Icon size={14} className="text-brand-400 shrink-0" />
                  <span className="text-xs text-gray-300">{feature.text}</span>
                </div>
              )
            })}
          </div>

          {/* Sign in button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <Spinner size={18} className="text-gray-600" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="mt-4 text-xs text-gray-500">
            By signing in, you grant ReachPilot access to send and read emails via your Gmail account.
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          ReachPilot — competing with Instantly, Lemlist & Mailshake
        </p>
      </div>
    </div>
  )
}
