'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QtppModal } from '@/components/lab/QtppModal'
import { Topbar } from '@/components/dashboard/Topbar'
import { LabSidebar } from '@/components/dashboard/Sidebar'
import { getWorkspaces } from '@/lib/db'
import type { WorkspaceRow } from '@/lib/database.types'
import type { QTPP } from '@/lib/lab-data'
import { IconPlus } from '@/components/ui/Icons'

function WorkspaceCard({ ws }: { ws: WorkspaceRow }) {
  const qtpp = ws.qtpp as QTPP
  const dosageLabel = qtpp.bentukSediaan
    ? qtpp.bentukSediaan.charAt(0).toUpperCase() + qtpp.bentukSediaan.slice(1)
    : '—'

  const updatedDate = new Date(ws.updated_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <Link
      href={`/lab/${ws.id}`}
      className="group bg-card rounded-2xl border p-5 flex flex-col gap-4 hover:shadow-md transition-all"
      style={{ borderColor: '#D0DCF0' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#AAD3FF')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#D0DCF0')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink truncate group-hover:text-ocean-600 transition-colors">
            {ws.nama}
          </h3>
          <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed text-ink/55">
            {ws.deskripsi || 'Tidak ada deskripsi'}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#EBF4FF', color: '#1A5BA1' }}>
          {dosageLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        {[
          { label: 'Dibuat',     value: new Date(ws.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) },
          { label: 'Diperbarui', value: updatedDate },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl py-2 px-1 bg-paper">
            <p className="text-sm font-bold" style={{ color: '#1A5BA1' }}>{value}</p>
            <p className="text-xs text-ink/50">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: '#D0DCF0' }}>
        <span className="text-xs text-ink/45">Diperbarui {updatedDate}</span>
        <span className="text-xs font-medium" style={{ color: '#1A5BA1' }}>Buka →</span>
      </div>
    </Link>
  )
}

export default function LabPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  async function loadWorkspaces() {
    setLoading(true)
    setError(null)
    try {
      const data = await getWorkspaces()
      setWorkspaces(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat workspace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadWorkspaces() }, [])

  return (
    <div className="h-screen flex flex-col bg-paper overflow-hidden">
      <Topbar health={null} />

      <div className="flex flex-1 min-h-0">
        <LabSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="font-serif text-3xl font-semibold italic text-ink">Lab Saya</h1>
                <p className="mt-1 text-sm text-ink/55">
                  Kelola workspace formulasi dan prediksi AI Anda
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full text-white transition-colors"
                style={{ backgroundColor: '#1A5BA1' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#003369')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1A5BA1')}
              >
                <IconPlus width={14} height={14} />
                Buat Workspace
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border bg-card p-5 h-44 animate-pulse" style={{ borderColor: '#D0DCF0' }} />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-danger-100 bg-danger-100/40 p-6 text-center">
                <p className="text-danger-600 font-medium">{error}</p>
                <button onClick={loadWorkspaces} className="mt-3 text-sm text-ocean-600 underline">
                  Coba lagi
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && workspaces.length === 0 && (
              <div className="text-center py-24 rounded-2xl border-2 border-dashed" style={{ borderColor: '#D0DCF0' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EBF4FF' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#1A5BA1" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 0 1 .45 1.317C20.25 17.773 19.128 19 17.7 19H6.3c-1.428 0-2.55-1.227-2.55-2.683a2.25 2.25 0 0 1 .45-1.317L5 14.5m14.8.5-1.41-.47M5 14.5l1.41-.47" />
                  </svg>
                </div>
                <p className="font-medium text-ink">Belum ada workspace</p>
                <p className="text-sm mt-1 text-ink/50">Buat workspace baru untuk mulai merencanakan formulasi Anda.</p>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full text-white"
                  style={{ backgroundColor: '#1A5BA1' }}
                >
                  <IconPlus width={14} height={14} />
                  Buat Workspace Pertama
                </button>
              </div>
            )}

            {/* Grid */}
            {!loading && !error && workspaces.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {workspaces.map(ws => (
                  <WorkspaceCard key={ws.id} ws={ws} />
                ))}
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[180px] transition-colors hover:border-ocean-400 hover:bg-card"
                  style={{ borderColor: '#D0DCF0' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EBF4FF' }}>
                    <IconPlus width={16} height={16} style={{ color: '#1A5BA1' }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#1A5BA1' }}>Workspace Baru</span>
                </button>
              </div>
            )}

          </div>
        </main>
      </div>

      {showModal && (
        <QtppModal
          onClose={() => setShowModal(false)}
          onCreated={(newWs) => {
            setWorkspaces(prev => [newWs, ...prev])
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
