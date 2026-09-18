'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { BandHeader } from '@/components/shell/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Panel } from '@/components/ui/Panel'
import { type Profile, ROLE_LABEL, useAuth } from '@/lib/auth'

/** Account management: Super Admin creates Manajer R&D accounts, managers may look. */
export default function AdminPage() {
  const { profile, loading, createManager, listUsers, deleteUser } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean, text: string } | null>(null)
  const role = profile?.role
  const staff = role === 'manager' || role === 'superadmin'

  const refresh = useCallback(async () => {
    try {
      setUsers(await listUsers())
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) })
    }
  }, [listUsers])

  useEffect(() => {
    if (staff) refresh()
  }, [staff, refresh])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const u = await createManager(email, password, name)
      setMsg({ ok: true, text: `Akun Manajer R&D ${u.email} dibuat.` })
      setName('')
      setEmail('')
      setPassword('')
      refresh()
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (u: Profile) => {
    if (!confirm(`Hapus akun ${u.email}?`)) return
    try {
      await deleteUser(u.id)
      refresh()
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : String(err) })
    }
  }

  return (
    <div className="pb-16">
      <BandHeader title="Manajemen Akun" subtitle={profile ? `${profile.full_name || profile.email} · ${ROLE_LABEL[profile.role]}` : ''} />
      <div className="mx-auto w-full max-w-[1150px] px-4 lg:px-12">
        {loading ? (
          <p className="mt-[37px] text-[16px] font-semibold text-grey-text">Memuat…</p>
        ) : !staff ? (
          <Panel className="mt-[37px]" bodyClassName="py-6">
            <p className="text-[16px] font-semibold text-black">Halaman ini untuk Manajer R&D dan Super Admin. Akun Anda adalah Formulator R&D.</p>
            <Link href="/overview" className="btn-outline mt-4 h-[45px] min-h-0 text-[16px]">
              Kembali ke Overview
            </Link>
          </Panel>
        ) : (
          <>
            {role === 'superadmin' && (
              <Panel title="Buat akun Manajer R&D" className="mt-[37px]" bodyClassName="pt-[18px] pb-[26px]">
                <form onSubmit={submit} className="grid gap-[18px] sm:grid-cols-3">
                  <div>
                    <label htmlFor="m-name" className="label">
                      Nama:
                    </label>
                    <input id="m-name" className="field text-[16px]" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label htmlFor="m-email" className="label">
                      Email:
                    </label>
                    <input id="m-email" type="email" className="field text-[16px]" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label htmlFor="m-pass" className="label">
                      Kata sandi:
                    </label>
                    <input id="m-pass" type="password" className="field text-[16px]" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
                  </div>
                  <div className="sm:col-span-3">
                    <button type="submit" disabled={busy} className="btn-primary h-[50px] min-h-0 text-[16px]">
                      {busy ? 'Membuat…' : 'Buat akun Manajer R&D'}
                    </button>
                  </div>
                </form>
              </Panel>
            )}
            {msg && (
              <p role="status" className={`mt-4 text-[15px] font-semibold ${msg.ok ? 'text-ok-dark' : 'text-bad'}`}>
                {msg.text}
              </p>
            )}
            <Panel title="Daftar akun" className="mt-[18px]" bodyClassName="py-2">
              <ul className="divide-y divide-line">
                {users.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                    <span className="min-w-[200px] flex-1 text-[16px] font-bold text-navy">{u.full_name || u.email}</span>
                    <span className="text-[14px] font-semibold text-grey-text">{u.email}</span>
                    <Badge tone={u.role === 'superadmin' ? 'gradient' : u.role === 'manager' ? 'blue' : 'grey'}>{ROLE_LABEL[u.role]}</Badge>
                    {role === 'superadmin' && u.id !== profile?.id && (
                      <button type="button" onClick={() => remove(u)} className="text-[14px] font-semibold text-bad hover:underline">
                        Hapus
                      </button>
                    )}
                  </li>
                ))}
                {users.length === 0 && <li className="py-4 text-[16px] font-semibold text-grey-text">Belum ada akun terdaftar.</li>}
              </ul>
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}
