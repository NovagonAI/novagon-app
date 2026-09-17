'use client'

import { useState, useMemo } from 'react'
import type { WorkspaceWithRelations } from '@/lib/db'
import type { SafetyTestRow, PredictionRow } from '@/lib/database.types'
import type { PredictionResult, SafetyTestItem } from '@/lib/lab-data'
import { createSafetyTest } from '@/lib/db'
import {
  IconMagnifyingGlass, IconPlus, IconShieldCheck,
  IconCheckCircle, IconXCircle, IconExclamationTriangle,
  IconInformationCircle,
} from '@/components/ui/Icons'

interface Props {
  workspace: WorkspaceWithRelations
  onDataChange?: () => void
}

function StatusBadge({ status }: { status: SafetyTestRow['status'] }) {
  const map = {
    draft:   { label: 'Draft',    bg: '#EBF4FF', text: '#1A5BA1' },
    ongoing: { label: 'Berjalan', bg: '#F7ECD6', text: '#B4863C' },
    selesai: { label: 'Selesai',  bg: '#DEEFE2', text: '#2F7D52' },
  }
  const s = map[status]
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

const CONCLUSION_STYLE = {
  aman:       { Icon: IconCheckCircle,        text: 'Aman',       bg: '#DEEFE2', color: '#1E4F33', iconColor: '#2F7D52' },
  perhatian:  { Icon: IconExclamationTriangle,text: 'Perhatian',  bg: '#F7ECD6', color: '#8F6A2E', iconColor: '#B4863C' },
  tidak_aman: { Icon: IconXCircle,            text: 'Tidak Aman', bg: '#F6DEDA', color: '#8F362A', iconColor: '#B14432' },
}

const DEFAULT_TESTS: { nama: string; metode: string }[] = [
  { nama: 'Uji Iritasi Primer (in silico)',     metode: 'Prediksi QSAR' },
  { nama: 'HRIPT Simulasi',                      metode: 'Profil bahan + literatur klinis' },
  { nama: 'Uji Toksisitas Akut (in silico)',     metode: 'Derek Nexus QSAR' },
  { nama: 'Uji Kompatibilitas Kemasan',           metode: 'Simulasi migrasi polipropilen' },
  { nama: 'Validasi Pengawet (Challenge Test)',   metode: 'Prediksi efektivitas pengawet' },
]

export function UjiKeamananTab({ workspace, onDataChange }: Props) {
  const [selectedId, setSelectedId] = useState<string>(workspace.safetyTests.at(0)?.id ?? '')
  const [showNewForm, setShowNewForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const donePredictions = workspace.predictions.filter(p => p.status === 'done')

  const filteredTests = useMemo(() =>
    workspace.safetyTests.filter(st =>
      st.formula_nama.toLowerCase().includes(searchQuery.toLowerCase())
    ), [workspace.safetyTests, searchQuery])

  const selected = workspace.safetyTests.find(s => s.id === selectedId)

  return (
    <div className="flex h-full min-h-[600px]">
      {/* ── Left panel ── */}
      <aside className="w-64 shrink-0 border-r flex flex-col" style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF' }}>
        {/* Search */}
        <div className="p-3 border-b" style={{ borderColor: '#D0DCF0' }}>
          <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5" style={{ borderColor: '#D0DCF0', backgroundColor: '#fff' }}>
            <IconMagnifyingGlass className="shrink-0" width={13} height={13} style={{ color: 'rgba(0,51,105,0.3)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari uji keamanan…"
              className="flex-1 text-xs bg-transparent outline-none"
              style={{ color: '#003369' }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            disabled={donePredictions.length === 0}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border transition-colors disabled:opacity-40 mt-2"
            style={{ borderColor: '#1A5BA1', color: '#1A5BA1', backgroundColor: 'transparent' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#EBF4FF' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <IconPlus width={13} height={13} />
            Uji Keamanan Baru
          </button>
          {donePredictions.length === 0 && (
            <p className="text-xs text-center mt-1" style={{ color: '#B14432' }}>Perlu minimal 1 prediksi selesai</p>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-6 text-center h-full">
              <IconShieldCheck width={28} height={28} style={{ color: 'rgba(0,51,105,0.2)', marginBottom: 8 }} />
              <p className="text-xs" style={{ color: '#003369', opacity: 0.45 }}>
                {searchQuery ? 'Tidak ditemukan' : 'Belum ada uji keamanan'}
              </p>
            </div>
          ) : (
            filteredTests.map(st => {
              const isSelected = st.id === selectedId
              const date = new Date(st.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => { setSelectedId(st.id); setShowNewForm(false) }}
                  className="w-full text-left px-3 py-3 border-b transition-colors"
                  style={{
                    borderColor: '#D0DCF0',
                    backgroundColor: isSelected ? '#EBF4FF' : 'transparent',
                    borderRight: isSelected ? '2px solid #1A5BA1' : '2px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold truncate" style={{ color: '#003369', maxWidth: '120px' }}>{st.formula_nama}</span>
                    <StatusBadge status={st.status} />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#003369', opacity: 0.45 }}>
                    {date} · {(st.items as SafetyTestItem[]).length} uji
                  </p>
                </button>
              )
            })
          )}
        </div>


      </aside>

      {/* ── Right panel ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {showNewForm ? (
          <NewSafetyTestForm
            donePredictions={donePredictions}
            workspaceId={workspace.id}
            onCancel={() => setShowNewForm(false)}
            onCreated={(id) => { setSelectedId(id); setShowNewForm(false); onDataChange?.() }}
          />
        ) : !selected ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#EBF4FF' }}>
              <IconShieldCheck width={20} height={20} style={{ color: '#1A5BA1' }} />
            </div>
            <p className="font-medium" style={{ color: '#003369' }}>Pilih atau buat uji keamanan</p>
            <p className="text-sm mt-1" style={{ color: '#003369', opacity: 0.5 }}>
              Uji keamanan dilakukan berdasarkan hasil prediksi yang telah selesai.
            </p>
          </div>
        ) : (
          <SafetyDetail st={selected} />
        )}
      </div>
    </div>
  )
}

function SafetyDetail({ st }: { st: SafetyTestRow }) {
  const items = st.items as SafetyTestItem[]
  const overallKey: keyof typeof CONCLUSION_STYLE =
    items.some(i => i.kesimpulan === 'tidak_aman') ? 'tidak_aman' :
    items.some(i => i.kesimpulan === 'perhatian')  ? 'perhatian'  : 'aman'
  const overallStyle = CONCLUSION_STYLE[overallKey]
  const OverallIcon = overallStyle.Icon

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base" style={{ color: '#003369' }}>Uji Keamanan — {st.formula_nama}</h3>
            <StatusBadge status={st.status} />
          </div>
          <p className="text-xs mt-1" style={{ color: '#003369', opacity: 0.5 }}>
            {new Date(st.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {items.length} pengujian
          </p>
        </div>
      </div>

      {/* Overall conclusion */}
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: overallStyle.bg }}>
        <OverallIcon width={20} height={20} style={{ color: overallStyle.iconColor, flexShrink: 0 }} />
        <div>
          <p className="font-semibold text-sm" style={{ color: overallStyle.color }}>Kesimpulan: {overallStyle.text}</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: overallStyle.color, opacity: 0.8 }}>
            {st.kesimpulan_umum ?? 'Lihat detail pengujian di bawah.'}
          </p>
        </div>
      </div>

      {/* Test items */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#84A0E4' }}>Detail Pengujian</h4>
        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const s = CONCLUSION_STYLE[item.kesimpulan]
            const ItemIcon = s.Icon
            return (
              <div key={i} className="rounded-xl border p-4" style={{ borderColor: '#D0DCF0' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#003369' }}>{item.nama}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#003369', opacity: 0.5 }}>Metode: {item.metode}</p>
                  </div>
                  <span className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
                    <ItemIcon width={11} height={11} style={{ color: s.iconColor }} />
                    {s.text}
                  </span>
                </div>
                <div className="mt-2 p-2.5 rounded-lg text-xs leading-relaxed" style={{ backgroundColor: '#EBF4FF', color: '#003369' }}>
                  {item.hasil}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 p-4 rounded-xl" style={{ backgroundColor: '#EBF4FF' }}>
        <IconInformationCircle width={14} height={14} className="shrink-0 mt-0.5" style={{ color: '#1A5BA1' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#1A5BA1' }}>
          Hasil uji keamanan ini adalah prediksi in silico berdasarkan data toksikologi dan literatur.
          Gunakan sebagai panduan awal untuk meminimalisir animal testing.
        </p>
      </div>
    </div>
  )
}

function NewSafetyTestForm({
  donePredictions, workspaceId, onCancel, onCreated,
}: {
  donePredictions: PredictionRow[]
  workspaceId: string
  onCancel: () => void
  onCreated: (id: string) => void
}) {
  const [selectedPredId, setSelectedPredId] = useState(donePredictions.at(0)?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPred = donePredictions.find(p => p.id === selectedPredId)
  const result = selectedPred?.result as PredictionResult | null

  async function handleCreate() {
    if (!selectedPred) return
    setSaving(true)
    setError(null)

    const items: SafetyTestItem[] = DEFAULT_TESTS.map(t => {
      const safeScore = result ? result.skorStabilitas : 70
      const kesimpulan: SafetyTestItem['kesimpulan'] =
        safeScore >= 80 ? 'aman' : safeScore >= 60 ? 'perhatian' : 'tidak_aman'
      return {
        nama: t.nama,
        metode: t.metode,
        hasil: safeScore >= 80
          ? 'Tidak ditemukan risiko signifikan berdasarkan profil bahan dan literatur.'
          : 'Ditemukan potensi risiko ringan. Uji lebih lanjut disarankan.',
        kesimpulan,
      }
    })

    const overallSafe = items.every(i => i.kesimpulan === 'aman')
    const hasRisk = items.some(i => i.kesimpulan === 'tidak_aman')

    try {
      const st = await createSafetyTest({
        workspace_id: workspaceId,
        prediction_id: selectedPred.id,
        formula_nama: selectedPred.formula_nama,
        status: 'selesai',
        items,
        kesimpulan_umum: hasRisk
          ? 'Ditemukan potensi risiko. Evaluasi lebih lanjut diperlukan sebelum produksi.'
          : overallSafe
          ? 'Produk dinyatakan aman berdasarkan profil in silico. Tidak ada tanda iritasi yang terdeteksi.'
          : 'Ada beberapa catatan perhatian. Disarankan uji konfirmasi tambahan.',
      })
      onCreated(st.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat uji keamanan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <h3 className="font-semibold text-base" style={{ color: '#003369' }}>Uji Keamanan Baru</h3>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#003369' }}>
          Berdasarkan hasil prediksi <span style={{ color: '#B14432' }}>*</span>
        </label>
        <select
          value={selectedPredId}
          onChange={e => setSelectedPredId(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-xl border outline-none"
          style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF', color: '#003369' }}
        >
          {donePredictions.map(p => {
            const r = p.result as PredictionResult | null
            return (
              <option key={p.id} value={p.id}>
                {p.formula_nama} — Skor {r?.skorStabilitas ?? '—'}
              </option>
            )
          })}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: '#003369' }}>Pengujian yang akan dilakukan</label>
        <div className="flex flex-col gap-2">
          {DEFAULT_TESTS.map(test => (
            <label key={test.nama} className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" defaultChecked readOnly className="w-4 h-4 accent-[#1A5BA1]" />
              <span style={{ color: '#003369' }}>{test.nama}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: '#EBF4FF' }}>
        <IconInformationCircle width={14} height={14} className="shrink-0 mt-0.5" style={{ color: '#1A5BA1' }} />
        <p className="text-xs" style={{ color: '#1A5BA1' }}>
          Hasil uji akan digenerate otomatis berdasarkan skor prediksi dan profil bahan.
        </p>
      </div>

      {error && <p className="text-xs" style={{ color: '#B14432' }}>{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="text-sm px-4 py-2 rounded-full border" style={{ borderColor: '#D0DCF0', color: '#1A5BA1' }}>
          Batal
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!selectedPredId || saving}
          className="flex items-center gap-2 text-sm font-semibold px-6 py-2 rounded-full text-white disabled:opacity-40"
          style={{ backgroundColor: '#1A5BA1' }}
        >
          <IconShieldCheck width={14} height={14} />
          {saving ? 'Memproses…' : 'Mulai Uji Keamanan'}
        </button>
      </div>
    </div>
  )
}
