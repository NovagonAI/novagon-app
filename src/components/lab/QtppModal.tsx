'use client'

import { useState } from 'react'
import { DOSAGE_FORM_OPTIONS, type DosageForm } from '@/lib/lab-data'
import { createWorkspace } from '@/lib/db'
import type { WorkspaceRow } from '@/lib/database.types'

interface Props {
  onClose: () => void
  onCreated: (workspace: WorkspaceRow) => void
}

interface FormState {
  nama: string
  deskripsi: string
  bentukSediaan: DosageForm
  rutePenggunaan: string
  penampilan: string
  warna: string
  aroma: string
  phMin: string
  phMax: string
  viskositasMin: string
  viskositasMax: string
  viskositasUnit: string
  ukuranPartikelMax: string
  stabilitasTarget: string
  bahanAktifTarget: string
  keamananTarget: string
  umurSimpan: string
}

const INITIAL_FORM: FormState = {
  nama: '',
  deskripsi: '',
  bentukSediaan: 'serum',
  rutePenggunaan: 'Topikal',
  penampilan: '',
  warna: '',
  aroma: '',
  phMin: '',
  phMax: '',
  viskositasMin: '',
  viskositasMax: '',
  viskositasUnit: 'cPs',
  ukuranPartikelMax: '',
  stabilitasTarget: '',
  bahanAktifTarget: '',
  keamananTarget: '',
  umurSimpan: '',
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold mb-1" style={{ color: '#003369' }}>
      {children}
      {required && <span className="ml-0.5 text-danger-500">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full text-sm px-3 py-2 rounded-xl border outline-none transition-colors focus:border-ocean-500 ${props.className ?? ''}`}
      style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF', color: '#003369', ...props.style }}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full text-sm px-3 py-2 rounded-xl border outline-none transition-colors focus:border-ocean-500 resize-none ${props.className ?? ''}`}
      style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF', color: '#003369', ...props.style }}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full text-sm px-3 py-2 rounded-xl border outline-none transition-colors focus:border-ocean-500 ${props.className ?? ''}`}
      style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF', color: '#003369', ...props.style }}
    />
  )
}

export function QtppModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  async function handleCreate() {
    setSaving(true)
    setSaveError(null)
    try {
      const workspace = await createWorkspace({
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim(),
        qtpp: {
          bentukSediaan: form.bentukSediaan,
          rutePenggunaan: form.rutePenggunaan,
          penampilan: form.penampilan,
          warna: form.warna,
          aroma: form.aroma,
          phMin: parseFloat(form.phMin) || 0,
          phMax: parseFloat(form.phMax) || 0,
          viskositasMin: parseFloat(form.viskositasMin) || 0,
          viskositasMax: parseFloat(form.viskositasMax) || 0,
          viskositasUnit: form.viskositasUnit,
          ukuranPartikelMax: parseFloat(form.ukuranPartikelMax) || 0,
          stabilitasTarget: form.stabilitasTarget,
          bahanAktifTarget: form.bahanAktifTarget,
          keamananTarget: form.keamananTarget,
          umurSimpan: form.umurSimpan,
        },
      })
      onCreated(workspace)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal membuat workspace')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,51,105,0.35)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10" style={{ borderColor: '#D0DCF0' }}>
          <div>
            <h2 className="font-serif text-lg font-semibold italic" style={{ color: '#003369' }}>
              Buat Workspace Baru
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#1A5BA1' }}>
              Langkah {step} dari 2 — {step === 1 ? 'Informasi Workspace' : 'Quality Target Product Profile (QTPP)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-ink/40 hover:bg-slate2 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {([1, 2] as const).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={step >= s
                  ? { backgroundColor: '#1A5BA1', color: '#fff' }
                  : { backgroundColor: '#EBF4FF', color: '#84A0E4' }}
              >
                {s}
              </div>
              {s < 2 && <div className="w-10 h-0.5 rounded" style={{ backgroundColor: step > s ? '#1A5BA1' : '#D0DCF0' }} />}
            </div>
          ))}
        </div>

        {/* Form body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {step === 1 ? (
            <>
              <div>
                <Label required>Nama Workspace</Label>
                <Input placeholder="cth. Serum Anti Jerawat, Krim Pelembap Malam…" value={form.nama} onChange={set('nama')} />
              </div>
              <div>
                <Label>Deskripsi singkat</Label>
                <Textarea rows={2} placeholder="Jelaskan tujuan formulasi ini…" value={form.deskripsi} onChange={set('deskripsi')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Bentuk Sediaan</Label>
                  <Select value={form.bentukSediaan} onChange={set('bentukSediaan')}>
                    {DOSAGE_FORM_OPTIONS.map(d => (
                      <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Rute Penggunaan</Label>
                  <Input value={form.rutePenggunaan} onChange={set('rutePenggunaan')} placeholder="Topikal" />
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#84A0E4' }}>Organoleptis</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Penampilan</Label><Input placeholder="cth. Cairan bening homogen" value={form.penampilan} onChange={set('penampilan')} /></div>
                <div><Label>Warna</Label><Input placeholder="cth. Bening kekuningan" value={form.warna} onChange={set('warna')} /></div>
                <div><Label>Aroma</Label><Input placeholder="cth. Sedikit fragrance" value={form.aroma} onChange={set('aroma')} /></div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#84A0E4' }}>Parameter Fisikokimia</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>pH Minimum</Label><Input type="number" step="0.1" placeholder="4.5" value={form.phMin} onChange={set('phMin')} /></div>
                <div><Label>pH Maksimum</Label><Input type="number" step="0.1" placeholder="6.0" value={form.phMax} onChange={set('phMax')} /></div>
                <div><Label>Viskositas Min</Label><Input type="number" placeholder="300" value={form.viskositasMin} onChange={set('viskositasMin')} /></div>
                <div><Label>Viskositas Maks</Label><Input type="number" placeholder="800" value={form.viskositasMax} onChange={set('viskositasMax')} /></div>
                <div>
                  <Label>Satuan Viskositas</Label>
                  <Select value={form.viskositasUnit} onChange={set('viskositasUnit')}>
                    <option>cPs</option><option>mPa·s</option><option>Pa·s</option>
                  </Select>
                </div>
                <div><Label>Ukuran Partikel Maks (nm)</Label><Input type="number" placeholder="200" value={form.ukuranPartikelMax} onChange={set('ukuranPartikelMax')} /></div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#84A0E4' }}>Target Kualitas</p>
              <div className="flex flex-col gap-4">
                <div><Label>Target Stabilitas</Label><Input placeholder="cth. Stabil pada 40°C/75% RH selama 6 bulan" value={form.stabilitasTarget} onChange={set('stabilitasTarget')} /></div>
                <div><Label>Kandungan Bahan Aktif Target</Label><Input placeholder="cth. Niacinamide 5%, Salicylic Acid 0.5–1%" value={form.bahanAktifTarget} onChange={set('bahanAktifTarget')} /></div>
                <div><Label>Keamanan Target</Label><Input placeholder="cth. Tidak menimbulkan iritasi, HRIPT negatif" value={form.keamananTarget} onChange={set('keamananTarget')} /></div>
                <div><Label>Umur Simpan</Label><Input placeholder="cth. 24 bulan pada suhu kamar" value={form.umurSimpan} onChange={set('umurSimpan')} /></div>
              </div>

              {saveError && (
                <div className="rounded-xl border border-danger-100 bg-danger-100/40 px-4 py-2">
                  <p className="text-xs text-danger-600">{saveError}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t sticky bottom-0 bg-white rounded-b-2xl" style={{ borderColor: '#D0DCF0' }}>
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="text-sm font-medium px-4 py-2 rounded-full border transition-colors"
            style={{ borderColor: '#D0DCF0', color: '#1A5BA1' }}
          >
            {step === 1 ? 'Batal' : '← Kembali'}
          </button>
          <button
            onClick={step === 1 ? () => setStep(2) : handleCreate}
            disabled={(step === 1 && !form.nama.trim()) || saving}
            className="text-sm font-semibold px-6 py-2 rounded-full text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: '#1A5BA1' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#003369' }}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1A5BA1')}
          >
            {saving ? 'Menyimpan…' : step === 1 ? 'Lanjut →' : 'Buat Workspace'}
          </button>
        </div>
      </div>
    </div>
  )
}
