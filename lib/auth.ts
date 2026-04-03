import GoogleProvider from 'next-auth/providers/google'
import { saveGmailTokens } from './gmail'
import type { NextAuthOptions } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    userEmail: string
    accessToken: string
    refreshToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    refreshToken: string
    expiryDate: number
    userEmail: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
          response_type: 'code',
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && account.access_token) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token!
        token.expiryDate = (account.expires_at ?? 0) * 1000
        token.userEmail = (profile as { email?: string })?.email || ''

        try {
          await saveGmailTokens(
            token.userEmail,
            token.accessToken,
            token.refreshToken,
            token.expiryDate
          )
        } catch (err) {
          console.error('[Auth] Failed to save tokens:', err)
        }
      }

      // Handle token rotation
      if (token.expiryDate && Date.now() > token.expiryDate - 5 * 60 * 1000) { // Refresh 5 minutes before expiry
        try {
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken,
            }),
          })

          const data = await response.json()

          if (data.access_token) {
            token.accessToken = data.access_token
            token.expiryDate = Date.now() + (data.expires_in ?? 3600) * 1000

            // Save updated tokens
            await saveGmailTokens(
              token.userEmail,
              token.accessToken,
              token.refreshToken,
              token.expiryDate
            )
          }
        } catch (err) {
          console.error('[Auth] Failed to refresh token:', err)
        }
      }

      return token
    },

    async session({ session, token }) {
      session.userEmail = token.userEmail
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
}
