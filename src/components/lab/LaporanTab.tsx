'use client'

import { useState } from 'react'
import type { WorkspaceWithRelations } from '@/lib/db'
import type { PredictionResult } from '@/lib/lab-data'

interface Props {
  workspace: WorkspaceWithRelations
}

type ExportFormat = 'pdf' | 'csv' | 'pif'

const FORMAT_OPTIONS: { value: ExportFormat; label: string; desc: string; icon: string }[] = [
  { value: 'pdf', label: 'PDF Laporan', desc: 'Laporan lengkap yang bisa dicetak dan dibagikan', icon: '📄' },
  { value: 'csv', label: 'CSV Data', desc: 'Data mentah untuk analisis lanjutan di spreadsheet', icon: '📊' },
  { value: 'pif', label: 'PIF (Product Information File)', desc: 'Template dokumentasi regulatori EU Cosmetics Regulation', icon: '🗂️' },
]

export function LaporanTab({ workspace }: Props) {
  const [selectedPredIds, setSelectedPredIds] = useState<string[]>(
    workspace.predictions.filter(p => p.status === 'done').map(p => p.id)
  )
  const [selectedSafetyIds, setSelectedSafetyIds] = useState<string[]>(
    workspace.safetyTests.map(s => s.id)
  )
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [includeQTPP, setIncludeQTPP] = useState(true)
  const [includeFormulas, setIncludeFormulas] = useState(true)
  const [exported, setExported] = useState(false)

  const donePredictions = workspace.predictions.filter(p => p.status === 'done')

  function togglePred(id: string) {
    setSelectedPredIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleSafety(id: string) {
    setSelectedSafetyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function handleExport() {
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  const totalSections =
    (includeQTPP ? 1 : 0) +
    (includeFormulas ? 1 : 0) +
    selectedPredIds.length +
    selectedSafetyIds.length

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div>
        <h3 className="font-semibold text-base" style={{ color: '#003369' }}>Buat Laporan</h3>
        <p className="text-sm mt-1" style={{ color: '#003369', opacity: 0.55 }}>
          Pilih data yang ingin dimasukkan ke dalam laporan, lalu pilih format ekspor.
        </p>
      </div>

      {/* Format selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#84A0E4' }}>
          Format Laporan
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FORMAT_OPTIONS.map(f => (
            <button
              key={f.value}
              onClick={() => setSelectedFormat(f.value)}
              className="text-left p-3 rounded-xl border-2 transition-colors"
              style={{
                borderColor: selectedFormat === f.value ? '#1A5BA1' : '#D0DCF0',
                backgroundColor: selectedFormat === f.value ? '#EBF4FF' : '#fff',
              }}
            >
              <span className="text-xl">{f.icon}</span>
              <p className="text-xs font-semibold mt-1" style={{ color: '#003369' }}>{f.label}</p>
              <p className="text-xs mt-0.5 leading-snug" style={{ color: '#003369', opacity: 0.5 }}>{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Section: include/exclude */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#84A0E4' }}>
          Konten Laporan
        </p>
        <div className="flex flex-col gap-3">

          {/* QTPP */}
          <SectionToggle
            checked={includeQTPP}
            onChange={setIncludeQTPP}
            icon="🎯"
            label="QTPP (Quality Target Product Profile)"
            desc="Semua parameter target formulasi"
          />

          {/* Formulas */}
          <SectionToggle
            checked={includeFormulas}
            onChange={setIncludeFormulas}
            icon="🧬"
            label="Daftar Formula"
            desc={`${workspace.formulas.length} formula, semua versi`}
          />

          {/* Predictions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold" style={{ color: '#003369' }}>🔮 Hasil Prediksi</p>
              {donePredictions.length > 0 && (
                <button
                  onClick={() => {
                    const allSelected = donePredictions.every(p => selectedPredIds.includes(p.id))
                    setSelectedPredIds(allSelected ? [] : donePredictions.map(p => p.id))
                  }}
                  className="text-xs"
                  style={{ color: '#1A5BA1' }}
                >
                  {donePredictions.every(p => selectedPredIds.includes(p.id)) ? 'Hapus semua' : 'Pilih semua'}
                </button>
              )}
            </div>
            {donePredictions.length === 0 ? (
              <p className="text-xs" style={{ color: '#003369', opacity: 0.4 }}>Belum ada prediksi selesai</p>
            ) : (
              <div className="flex flex-col gap-1.5 pl-2">
                {donePredictions.map(p => (
                  <label key={p.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPredIds.includes(p.id)}
                      onChange={() => togglePred(p.id)}
                      className="w-4 h-4 accent-[#1A5BA1]"
                    />
                    <span style={{ color: '#003369' }}>
                      {p.formula_nama}
                    </span>
                    <span className="text-xs ml-auto" style={{ color: '#2F7D52' }}>
                      Skor {(p.result as PredictionResult | null)?.skorStabilitas ?? '—'}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Safety tests */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold" style={{ color: '#003369' }}>🛡️ Uji Keamanan</p>
              {workspace.safetyTests.length > 0 && (
                <button
                  onClick={() => {
                    const allSelected = workspace.safetyTests.every(s => selectedSafetyIds.includes(s.id))
                    setSelectedSafetyIds(allSelected ? [] : workspace.safetyTests.map(s => s.id))
                  }}
                  className="text-xs"
                  style={{ color: '#1A5BA1' }}
                >
                  {workspace.safetyTests.every(s => selectedSafetyIds.includes(s.id)) ? 'Hapus semua' : 'Pilih semua'}
                </button>
              )}
            </div>
            {workspace.safetyTests.length === 0 ? (
              <p className="text-xs" style={{ color: '#003369', opacity: 0.4 }}>Belum ada uji keamanan</p>
            ) : (
              <div className="flex flex-col gap-1.5 pl-2">
                {workspace.safetyTests.map(st => (
                  <label key={st.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSafetyIds.includes(st.id)}
                      onChange={() => toggleSafety(st.id)}
                      className="w-4 h-4 accent-[#1A5BA1]"
                    />
                    <span style={{ color: '#003369' }}>{st.formula_nama}</span>
                    <span className="text-xs ml-auto" style={{ color: '#1A5BA1' }}>
                      {(st.items as unknown[]).length} uji
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview summary */}
      <div className="p-4 rounded-xl" style={{ backgroundColor: '#EBF4FF' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: '#003369' }}>Ringkasan Laporan</p>
        <ul className="text-xs space-y-1" style={{ color: '#1A5BA1' }}>
          <li>📁 Workspace: <strong>{workspace.nama}</strong></li>
          {includeQTPP && <li>🎯 QTPP tercakup</li>}
          {includeFormulas && <li>🧬 {workspace.formulas.length} formula tercakup</li>}
          {selectedPredIds.length > 0 && <li>🔮 {selectedPredIds.length} hasil prediksi</li>}
          {selectedSafetyIds.length > 0 && <li>🛡️ {selectedSafetyIds.length} laporan uji keamanan</li>}
        </ul>
        <p className="text-xs mt-2" style={{ color: '#003369', opacity: 0.55 }}>
          Total {totalSections} bagian · Format: {FORMAT_OPTIONS.find(f => f.value === selectedFormat)?.label}
        </p>
      </div>

      {/* Export button */}
      <div>
        {exported ? (
          <div
            className="flex items-center gap-2 p-4 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#DEEFE2', color: '#1E4F33' }}
          >
            ✅ Laporan berhasil dibuat! (Demo — unduhan tidak tersedia)
          </div>
        ) : (
          <button
            onClick={handleExport}
            disabled={totalSections === 0}
            className="w-full text-sm font-semibold py-3 rounded-full text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: '#1A5BA1' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#003369' }}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1A5BA1')}
          >
            Ekspor Laporan →
          </button>
        )}
      </div>
    </div>
  )
}

function SectionToggle({
  checked, onChange, icon, label, desc,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  icon: string
  label: string
  desc: string
}) {
  return (
    <label
      className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors"
      style={{
        borderColor: checked ? '#AAD3FF' : '#D0DCF0',
        backgroundColor: checked ? '#EBF4FF' : '#fff',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#1A5BA1]"
      />
      <span className="text-lg leading-none">{icon}</span>
      <div>
        <p className="text-sm font-medium" style={{ color: '#003369' }}>{label}</p>
        <p className="text-xs" style={{ color: '#003369', opacity: 0.5 }}>{desc}</p>
      </div>
    </label>
  )
}
