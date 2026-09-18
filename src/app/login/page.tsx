'use client'

import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { signInWithPassword, signUpFormulator } from '@/lib/auth'

type Tab = 'masuk' | 'daftar'

/** Login and Formulator R&D self signup. Manager accounts come from the Super Admin. */
function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/overview'
  const [tab, setTab] = useState<Tab>('masuk')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (tab === 'daftar') await signUpFormulator(email, password, name)
      else await signInWithPassword(email, password)
      router.replace(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel w-full max-w-[520px] overflow-hidden">
      <div className="flex border-b-2 border-line" role="tablist" aria-label="Masuk atau daftar">
        {(['masuk', 'daftar'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t)
              setError(null)
            }}
            className={`flex-1 py-4 text-[18px] font-bold ${tab === t ? 'bg-white text-blue' : 'text-grey-text hover:text-navy'}`}
          >
            {t === 'masuk' ? 'Masuk' : 'Daftar Formulator R&D'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-[18px] px-[26px] pb-[26px] pt-[22px]">
        {tab === 'daftar' && (
          <div>
            <label htmlFor="name" className="label">
              Nama lengkap:
            </label>
            <input id="name" name="full_name" className="field" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="label">
            Email:
          </label>
          <input id="email" name="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Kata sandi:
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={tab === 'daftar' ? 'new-password' : 'current-password'}
          />
          {tab === 'daftar' && <p className="mt-1 text-[13px] font-medium text-grey-text">Minimal 8 karakter.</p>}
        </div>
        {error && (
          <p role="alert" className="text-[15px] font-semibold text-bad">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Memproses…' : tab === 'daftar' ? 'Buat akun dan masuk' : 'Masuk'}
        </button>
        <p className="text-center text-[13px] font-medium text-grey-text">
          {tab === 'masuk' ? 'Akun Manajer R&D dibuat oleh Super Admin. Formulator R&D bisa mendaftar sendiri.' : 'Pendaftaran mandiri hanya untuk Formulator R&D.'}
        </p>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-mist to-white px-4 py-10">
      <Link href="/" aria-label="Novagon" className="text-navy">
        <Logo size={40} />
      </Link>
      <p className="mb-8 mt-2 text-center text-[16px] font-semibold text-grey-text">Platform riset dan prediksi formulasi kosmetik</p>
      <Suspense fallback={<div className="text-[16px] font-semibold text-grey-text">Memuat…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
