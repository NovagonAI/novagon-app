'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getWorkspaceWithRelations } from '@/lib/db'
import type { WorkspaceWithRelations } from '@/lib/db'
import { FormulaTab } from '@/components/lab/FormulaTab'
import { PrediksiTab } from '@/components/lab/PrediksiTab'
import { UjiKeamananTab } from '@/components/lab/UjiKeamananTab'
import { LaporanTab } from '@/components/lab/LaporanTab'
import { SimulasiTab } from '@/components/lab/SimulasiTab'
import { Topbar } from '@/components/dashboard/Topbar'
import { LabSidebar } from '@/components/dashboard/Sidebar'
import {
  IconBeaker, IconSparkles, IconShieldCheck, IconDocumentText,
  IconArrowLeft,
} from '@/components/ui/Icons'
import type { QTPP } from '@/lib/lab-data'

// Simulasi icon — cube/3D
function IconSimulasi(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

type Tab = 'formula' | 'prediksi' | 'uji' | 'simulasi' | 'laporan'

const TABS: { id: Tab; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'formula',   label: 'Formula',      Icon: IconBeaker },
  { id: 'prediksi',  label: 'Prediksi',      Icon: IconSparkles },
  { id: 'uji',       label: 'Uji Keamanan', Icon: IconShieldCheck },
  { id: 'simulasi',  label: 'Simulasi',      Icon: IconSimulasi },
  { id: 'laporan',   label: 'Laporan',       Icon: IconDocumentText },
]

export default function WorkspacePage({ params }: { params: { workspaceId: string } }) {
  const { workspaceId } = params
  const [workspace, setWorkspace] = useState<WorkspaceWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('formula')

  const loadWorkspace = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getWorkspaceWithRelations(workspaceId)
      if (!data) setError('not_found')
      else setWorkspace(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat workspace')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { loadWorkspace() }, [loadWorkspace])

  // ── Loading ──
  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-paper overflow-hidden">
        <Topbar health={null} />
        <div className="flex flex-1 min-h-0">
          <LabSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-ocean-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-ink/50">Memuat workspace…</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // ── Not found ──
  if (error === 'not_found' || !workspace) {
    return (
      <div className="h-screen flex flex-col bg-paper overflow-hidden">
        <Topbar health={null} />
        <div className="flex flex-1 min-h-0">
          <LabSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="font-semibold text-ink mb-3">Workspace tidak ditemukan</p>
              <Link href="/lab" className="flex items-center gap-1.5 text-sm font-medium justify-center" style={{ color: '#1A5BA1' }}>
                <IconArrowLeft width={14} height={14} />
                Kembali ke Lab
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="h-screen flex flex-col bg-paper overflow-hidden">
        <Topbar health={null} />
        <div className="flex flex-1 min-h-0">
          <LabSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="font-semibold text-ink mb-2">{error}</p>
              <button onClick={loadWorkspace} className="text-sm font-medium" style={{ color: '#1A5BA1' }}>
                Coba lagi
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const qtpp = workspace.qtpp as QTPP

  return (
    <div className="h-screen flex flex-col bg-paper overflow-hidden">
      <Topbar health={null} />

      <div className="flex flex-1 min-h-0">
        <LabSidebar />

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">

            {/* Workspace header */}
            <div className="bg-card rounded-2xl border p-5" style={{ borderColor: '#D0DCF0' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-serif text-2xl font-semibold italic text-ink">{workspace.nama}</h1>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#EBF4FF', color: '#1A5BA1' }}>
                      {qtpp.bentukSediaan
                        ? qtpp.bentukSediaan.charAt(0).toUpperCase() + qtpp.bentukSediaan.slice(1)
                        : '—'}
                    </span>
                  </div>
                  <p className="text-sm mt-1 text-ink/55">{workspace.deskripsi}</p>
                </div>
                <p className="text-xs shrink-0 text-ink/40">
                  Diperbarui {new Date(workspace.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* QTPP summary — Overview grid */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#EBF4FF' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#1A5BA1' }}>
                  QTPP — Quality Target Product Profile
                </p>

                <div className="rounded-2xl p-4" style={{ backgroundColor: '#EBF4FF' }}>
                  {/* Row 1: 3 kolom — parameter fisikokimia utama */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <QtppCard icon={<IconPH />}         label="Derajat Keasaman (pH)"  value={qtpp.phMin && qtpp.phMax ? `${qtpp.phMin}–${qtpp.phMax}` : '—'} />
                    <QtppCard icon={<IconViskositas />}  label="Kekentalan"              value={qtpp.viskositasMin && qtpp.viskositasMax ? `${qtpp.viskositasMin.toLocaleString('id-ID')}–${qtpp.viskositasMax.toLocaleString('id-ID')} ${qtpp.viskositasUnit ?? 'cPs'}` : '—'} />
                    <QtppCard icon={<IconPartikel />}    label="Ukuran Partikel Maks"    value={qtpp.ukuranPartikelMax ? `≤ ${qtpp.ukuranPartikelMax} nm` : '—'} />
                  </div>

                  {/* Row 2: 2 kolom — organoleptis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <QtppCard icon={<IconWarna />}      label="Warna / Penampilan"      value={[qtpp.warna, qtpp.penampilan].filter(Boolean).join(' · ') || '—'} />
                    <QtppCard icon={<IconAroma />}      label="Aroma"                   value={qtpp.aroma || '—'} />
                  </div>

                  {/* Row 3: 2 kolom — target & stabilitas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <QtppCard icon={<IconStabilitas />} label="Stabilitas & Masa Simpan" value={[qtpp.stabilitasTarget, qtpp.umurSimpan].filter(Boolean).join(' · ') || '—'} />
                    <QtppCard icon={<IconRute />}       label="Rute Penggunaan"          value={qtpp.rutePenggunaan || '—'} />
                  </div>

                  {/* Row 4: full width — bahan aktif & keamanan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <QtppCard icon={<IconBahanAktif />} label="Bahan Aktif Target"      value={qtpp.bahanAktifTarget || '—'} />
                    <QtppCard icon={<IconKeamanan />}   label="Keamanan Target"          value={qtpp.keamananTarget || '—'} />
                  </div>

                  {/* Narasi ringkasan */}
                  {(qtpp.penampilan || qtpp.bahanAktifTarget || qtpp.stabilitasTarget) && (
                    <div className="rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ backgroundColor: 'rgba(255,255,255,0.7)', color: '#003369' }}>
                      {[
                        qtpp.penampilan && `Formulasi ini berpenampilan ${qtpp.penampilan.toLowerCase()}.`,
                        qtpp.bahanAktifTarget && `Bahan aktif target: ${qtpp.bahanAktifTarget}.`,
                        qtpp.stabilitasTarget,
                        qtpp.keamananTarget,
                      ].filter(Boolean).join(' ')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tab container */}
            <div className="bg-card rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: '#D0DCF0', minHeight: 600 }}>
              {/* Tab bar */}
              <div className="flex items-center border-b overflow-x-auto" style={{ borderColor: '#D0DCF0' }}>
                {TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2"
                    style={{
                      borderColor: activeTab === id ? '#1A5BA1' : 'transparent',
                      color: activeTab === id ? '#1A5BA1' : '#003369',
                      backgroundColor: activeTab === id ? '#EBF4FF' : 'transparent',
                      opacity: activeTab === id ? 1 : 0.55,
                    }}
                  >
                    <Icon width={14} height={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1">
                {activeTab === 'formula'   && <FormulaTab workspace={workspace} onDataChange={loadWorkspace} />}
                {activeTab === 'prediksi'  && <PrediksiTab workspace={workspace} onDataChange={loadWorkspace} />}
                {activeTab === 'uji'       && <UjiKeamananTab workspace={workspace} onDataChange={loadWorkspace} />}
                {activeTab === 'simulasi'  && <SimulasiTab workspace={workspace} />}
                {activeTab === 'laporan'   && <LaporanTab workspace={workspace} />}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// QTPP Overview card + icons
// ---------------------------------------------------------------------------

function QtppCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ backgroundColor: '#fff', border: '1px solid #D0DCF0' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: '#EBF4FF' }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold" style={{ color: '#1A5BA1' }}>{label}</p>
        <p className="text-sm mt-0.5 leading-snug" style={{ color: '#003369', opacity: 0.75 }}>{value}</p>
      </div>
    </div>
  )
}

function IconWarna() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      <path d="M12 2a10 10 0 0 1 0 20" fill="#AAD3FF" strokeWidth="0" />
      <path d="M7 15.5c1.5-2 5.5-2 5.5 0" />
      <circle cx="9" cy="10" r="1" fill="#1A5BA1" />
      <circle cx="15" cy="10" r="1" fill="#1A5BA1" />
    </svg>
  )
}

function IconPH() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12h4M18 12h4M6 8c0-2.21 1.343-4 3-4s3 1.79 3 4v8c0 2.21-1.343 4-3 4S6 18.21 6 16V8z" />
      <path d="M12 12h6M18 8v8" />
    </svg>
  )
}

function IconViskositas() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12a4 4 0 0 1 8 0" />
      <path d="M12 8v1M8.5 9.5l.7.7M15.5 9.5l-.7.7" />
      <circle cx="12" cy="13" r="1.5" fill="#1A5BA1" strokeWidth="0" />
    </svg>
  )
}

function IconStabilitas() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function IconPartikel() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <circle cx="5" cy="7" r="1.5" />
      <circle cx="19" cy="7" r="1.5" />
      <circle cx="5" cy="17" r="1.5" />
      <circle cx="19" cy="17" r="1.5" />
      <path d="M7 8.5l3.5 2M16.5 8.5L13 10.5M7 15.5l3.5-2M16.5 15.5L13 13.5" />
    </svg>
  )
}

function IconAroma() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 21c0-3 2-5 2-8" />
      <path d="M12 21c0-3 2-5 2-8" />
      <path d="M16 21c0-3 2-5 2-8" />
      <path d="M7 11c-1-2 0-4 2-5" />
      <path d="M11 11c-1-2 0-4 2-5" />
      <path d="M15 11c-1-2 0-4 2-5" />
    </svg>
  )
}

function IconRute() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s-8-5.5-8-11a8 8 0 0 1 16 0c0 5.5-8 11-8 11z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  )
}

function IconBahanAktif() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
    </svg>
  )
}

function IconKeamanan() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}
