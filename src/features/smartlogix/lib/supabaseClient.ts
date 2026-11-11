import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

export type SupabaseConnectionCheck = {
  ok: boolean
  message: string
}

export async function checkSupabaseConnection(): Promise<SupabaseConnectionCheck> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase environment variables are not configured. No tables created.' }
  }
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { ok: false, message: 'Supabase client could not be initialized from configured environment variables. No tables created.' }
  }
  try {
    const { error } = await supabase.auth.getSession()
    if (error) {
      return {
        ok: false,
        message: 'Supabase auth endpoint responded with an error. Check project URL/key configuration. Schema/RLS not verified and no tables created.',
      }
    }
    return {
      ok: true,
      message: 'Supabase auth endpoint reachable (safe runtime check). Database schema/RLS not verified and no tables created in Stage 1.',
    }
  } catch {
    return {
      ok: false,
      message: 'Unable to reach Supabase auth endpoint. Check network and project configuration. Schema/RLS not verified and no tables created.',
    }
  }
}