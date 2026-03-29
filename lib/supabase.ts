import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ─── Client-side Supabase (lazy) ──────────────────────────────────────────

let _clientInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_clientInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    _clientInstance = createClient(url, key)
  }
  return _clientInstance
}

// Legacy named export for client components
export const supabase = {
  get client() {
    return getSupabaseClient()
  },
}

// ─── Server-side Supabase (service role, NEVER expose to browser) ─────────

export function createServerSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
