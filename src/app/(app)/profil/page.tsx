'use client'

import { useEffect, useRef, useState } from 'react'
import { BandHeader } from '@/components/shell/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { Panel } from '@/components/ui/Panel'
import { ROLE_LABEL, useAuth } from '@/lib/auth'

/** Profil: name, photo and bio are editable; email and role are read-only. */
export default function ProfilePage() {
  const { profile, loading, updateProfile, uploadAvatar } = useAuth()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.full_name)
    setBio(profile.bio ?? '')
    setAvatar(profile.avatar_url ?? null)
  }, [profile])

  const pick = async (f: File | undefined) => {
    if (!f) return
    setBusy(true)
    setMsg(null)
    try {
      const url = await uploadAvatar(f)
      await updateProfile({ avatar_url: url })
      setAvatar(url)
      setMsg({ ok: true, text: 'Foto profil diperbarui.' })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Gagal mengunggah foto' })
    } finally {
      setBusy(false)
      if (file.current) file.current.value = ''
    }
  }

  const removePhoto = async () => {
    setBusy(true)
    setMsg(null)
    try {
      await updateProfile({ avatar_url: null })
      setAvatar(null)
      setMsg({ ok: true, text: 'Foto profil dihapus.' })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Gagal menghapus foto' })
    } finally {
      setBusy(false)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await updateProfile({ full_name: name.trim(), bio: bio.trim() || null })
      setMsg({ ok: true, text: 'Profil tersimpan.' })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Gagal menyimpan' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-16">
      <BandHeader title="Profil" subtitle="nama, foto, dan info akun" />
      <div className="mx-auto w-full max-w-[1150px] px-4 lg:px-12">
        {loading || !profile ? (
          <p className="mt-[37px] text-[16px] font-semibold text-grey-text">{loading ? 'Memuat…' : 'Belum masuk.'}</p>
        ) : (
          <form onSubmit={save} className="mt-[37px] grid gap-[21px] lg:grid-cols-[295px_minmax(0,1fr)]">
            <Panel title="Foto" bodyClassName="flex flex-col items-center py-6">
              <Avatar src={avatar} name={name || profile.email} size={160} />
              <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              <button type="button" onClick={() => file.current?.click()} disabled={busy} className="btn-outline mt-5 w-full gap-2 text-[16px]">
                <Icon name="gallery-add" size={20} /> {avatar ? 'Ganti foto' : 'Unggah foto'}
              </button>
              {avatar && (
                <button type="button" onClick={removePhoto} disabled={busy} className="mt-2 text-[14px] font-semibold text-bad hover:underline">
                  Hapus foto
                </button>
              )}
              <p className="mt-3 text-center text-[12px] font-semibold text-grey-text">PNG, JPG, atau WebP. Maksimal 2 MB.</p>
            </Panel>

            <Panel title="Data akun" bodyClassName="pt-[18px] pb-[26px]">
              <label htmlFor="full_name" className="label">
                Nama lengkap
              </label>
              <input id="full_name" name="full_name" className="field" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" />

              <label htmlFor="bio" className="label mt-5">
                Bio
              </label>
              <textarea id="bio" name="bio" className="field min-h-[110px] py-3 text-[16px]" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} placeholder="Fokus riset, brand yang ditangani, atau catatan singkat" />
              <p className="mt-1 text-right text-[12px] font-semibold text-grey-text">{bio.length}/280</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="label">Email</span>
                  <p className="field flex items-center bg-pale text-[16px] text-grey-text">{profile.email}</p>
                </div>
                <div>
                  <span className="label">Peran</span>
                  <p className="field flex items-center bg-pale text-[16px] text-grey-text">{ROLE_LABEL[profile.role]}</p>
                </div>
              </div>
              <p className="mt-2 text-[12px] font-semibold text-grey-text">Email dan peran hanya bisa diubah oleh Super Admin.</p>

              {msg && (
                <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 flex items-center gap-2 text-[16px] font-semibold ${msg.ok ? 'text-ok-dark' : 'text-bad'}`}>
                  <Icon name={msg.ok ? 'tick-square' : 'danger'} size={20} /> {msg.text}
                </p>
              )}
              <div className="mt-6 flex justify-end">
                <button type="submit" disabled={busy} className="btn-primary min-w-[190px]">
                  {busy ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </Panel>
          </form>
        )}
      </div>
    </div>
  )
}
