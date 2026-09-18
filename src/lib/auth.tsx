'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from './supabase'

export type Role = 'formulator' | 'manager' | 'superadmin'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  created_at?: string
}

export const ROLE_LABEL: Record<Role, string> = {
  formulator: 'Formulator R&D',
  manager: 'Manajer R&D',
  superadmin: 'Super Admin',
}

/** The edge function that creates, lists and deletes accounts. Plain fetch so the error body is readable. */
async function adminUsers<T>(body: Record<string, unknown>): Promise<T> {
  const { data } = await supabase().auth.getSession()
  const token = data.session?.access_token ?? SUPABASE_ANON_KEY
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const out = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(out.detail ?? `Gagal (${res.status})`)
  return out as T
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase().auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email atau kata sandi salah' : error.message)
}

/** Self signup is always a Formulator R&D. The function confirms the email so no mail round trip is needed. */
export async function signUpFormulator(email: string, password: string, full_name: string) {
  await adminUsers({ action: 'create', email, password, full_name, role: 'formulator' })
  await signInWithPassword(email, password)
}

interface AuthApi {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: typeof signInWithPassword
  signUp: typeof signUpFormulator
  signOut: () => Promise<void>
  createManager: (email: string, password: string, full_name: string) => Promise<Profile>
  listUsers: () => Promise<Profile[]>
  deleteUser: (id: string) => Promise<void>
}

const Ctx = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (u: User | null) => {
    setUser(u)
    if (!u) return setProfile(null)
    const { data } = await supabase().from('profiles').select('id, email, full_name, role, created_at').eq('id', u.id).maybeSingle()
    setProfile(
      (data as Profile | null) ?? {
        id: u.id,
        email: u.email ?? '',
        full_name: (u.user_metadata?.full_name as string) ?? '',
        role: ((u.user_metadata?.role as Role) ?? 'formulator'),
      },
    )
  }, [])

  useEffect(() => {
    const sb = supabase()
    sb.auth.getUser().then(({ data }) => loadProfile(data.user).finally(() => setLoading(false)))
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      loadProfile(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const value = useMemo<AuthApi>(
    () => ({
      user,
      profile,
      loading,
      signIn: signInWithPassword,
      signUp: signUpFormulator,
      signOut: async () => {
        await supabase().auth.signOut()
        router.push('/login')
      },
      createManager: async (email, password, full_name) => {
        const out = await adminUsers<{ user: Profile }>({ action: 'create', email, password, full_name, role: 'manager' })
        return out.user
      },
      listUsers: async () => (await adminUsers<{ users: Profile[] }>({ action: 'list' })).users,
      deleteUser: async (id) => {
        await adminUsers({ action: 'delete', id })
      },
    }),
    [user, profile, loading, router],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
