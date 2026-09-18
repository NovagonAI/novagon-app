import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Publishable values: the anon key only opens what RLS allows.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ogqaxlrmmrrokqvxanam.supabase.co'
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncWF4bHJtbXJyb2txdnhhbmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDg5MjgsImV4cCI6MjEwNDcyNDkyOH0.o_cP-MO-oyrZiYapyFQjQJZDcXeqX2U3ex9vIKz8dO8'

let client: SupabaseClient | null = null

/** One browser client per tab. Sessions live in cookies so middleware can read them. */
export function supabase(): SupabaseClient {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}
