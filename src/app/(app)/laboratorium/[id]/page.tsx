'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ContributionBars } from '@/components/charts/ContributionBars'
import { OrbitalLegend, OrbitalMap } from '@/components/charts/OrbitalMap'
import { RangeBar } from '@/components/charts/RangeBar'
import { OverviewCard } from '@/components/lab/OverviewCard'
import { PrintReport } from '@/components/lab/PrintReport'
import { ReportBuilder } from '@/components/lab/ReportBuilder'
import { ResultColumn } from '@/components/lab/ResultColumn'
import { SafetyReport } from '@/components/lab/SafetyReport'
import { BandHeader } from '@/components/shell/PageHeader'
import { Stepper } from '@/components/ui/Stepper'
import { Panel, Box } from '@/components/ui/Panel'
import { runAnalysis } from '@/components/wizard/analysis'
import { describeError } from '@/lib/api'
import { productType } from '@/lib/catalog'
import { compositionNodes, contributions, fmt, headline, pct, pickActive, provenanceLine, totalPct } from '@/lib/insight'
import { relativeDate, useStore } from '@/lib/store'

const TABS = ['Formula', 'Prediksi', 'Uji Keamanan', 'Laporan'] as const

/** One saved workspace: overview band, four tabs. */
export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const store = useStore()
  const router = useRouter()
  const search = useSearchParams()
  const initial = Math.max(1, TABS.findIndex((t) => t.toLowerCase() === (search.get('tab') ?? '').toLowerCase()) + 1)
  const [tab, setTab] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ws = store.workspaces.find((w) => w.id === id)

  if (!store.ready) return <div className="px-14 pt-10 text-grey-text">Memuat…</div>
  if (!ws)
    return (
      <div className="px-14 pt-10 text-[16px] font-semibold text-grey-text">
        Workspace tidak ditemukan. <Link href="/laboratorium" className="text-blue underline">Kembali ke Laboratorium</Link>.
      </div>
    )

  const pt = productType(ws.productType)
  const lines = ws.formula.filter((l) => l.inci_name)
  const h = headline(ws.analysis, ws.productType)
  const active = pickActive(lines)
  const version = ws.versions[ws.versions.length - 1]
  const edit = () => {
    store.select(ws.id)
    store.update(ws.id, { step: 3, confirmed: false })
    router.push('/analisis')
  }
  const rerun = async () => {
    setBusy(true)
    setError(null)
    try {
      const analysis = await runAnalysis(ws)
      const score = headline(analysis, ws.productType)?.value ?? null
      store.update(ws.id, { analysis })
      store.addHistory({ workspaceId: ws.id, name: ws.name, score, status: analysis.verdict?.status ?? 'n/a' })
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-16">
      <BandHeader title={ws.name} subtitle={`Diubah terakhir ${relativeDate(ws.updatedAt).toLowerCase()}`} chips={pt.forms} />
      <div className="mx-auto w-full max-w-[1150px] px-4 lg:px-12">
      <div className="mt-[37px]">
        <OverviewCard ws={ws} />
      </div>
      <Stepper steps={TABS} current={tab} reached={TABS.length} onSelect={setTab} className="mt-[18px]" />
      <div className="mt-[12px]">
        {tab === 1 && (
          <Panel bodyClassName="pt-[18px] pb-[26px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[20px] font-bold text-navy">Formula dengan Basis {active?.inci_name ?? '-'}</h2>
                <p className="mt-2 flex items-center gap-[7px] text-[20px] font-bold text-grey-text">
                  Versi:
                  {ws.versions.length === 0 && <span className="rounded-[24px] bg-blue px-[16px] py-[3px] text-[20px] text-white">draft</span>}
                  {ws.versions.map((v, i) => (
                    <span key={v.label} className={`rounded-[24px] px-[16px] py-[3px] text-[20px] text-white ${i === ws.versions.length - 1 ? 'bg-blue' : 'bg-grey-nav'}`}>
                      {v.label}
                    </span>
                  ))}
                </p>
              </div>
              <button type="button" onClick={edit} className="btn-primary h-[45px] min-h-0 w-[190px]">
                Edit Formula
              </button>
            </div>
            <Box className="mt-[14px] bg-pale px-5 py-3 text-[16px] font-semibold text-black">{version?.note ?? 'Formula belum diprediksi'}{version ? ` · ${new Date(version.at).toLocaleString('id-ID')}` : ''}</Box>
            <div className="mt-[24px] grid grid-cols-[minmax(0,1fr)_190px] gap-x-[13px] text-[20px] font-bold text-navy">
              <span>Nama Bahan (Inci)</span>
              <span className="text-center">Persentase (%)</span>
            </div>
            <ul className="mt-[14px] space-y-[15px]">
              {lines.map((l) => (
                <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_190px] gap-x-[13px]">
                  <Box className="flex min-h-[56px] items-center px-4 text-[20px] font-semibold">{l.inci_name}</Box>
                  <Box className="flex min-h-[56px] items-center justify-center text-[20px] font-semibold">{fmt(pct(l))}</Box>
                </li>
              ))}
            </ul>
            <p className="mt-[24px] text-[16px] font-bold text-black">Total Persentase</p>
            <div className="mt-[6px] flex items-center gap-4">
              <div className="h-[10px] flex-1 overflow-hidden rounded-[20px] bg-grey-bar">
                <div className="h-full rounded-[20px] bg-ok-bar" style={{ width: `${Math.min(100, totalPct(lines))}%` }} />
              </div>
              <span className="w-[70px] text-right text-[16px] font-bold">{fmt(totalPct(lines)).replace('.', ',')}%</span>
            </div>
          </Panel>
        )}

        {tab === 2 && (
          <>
            <Panel bodyClassName="pt-[18px] pb-[26px]">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[20px] font-bold text-navy">Nilai Prediksi{h ? ` · ${h.label}` : ''}</h2>
                <button type="button" onClick={rerun} disabled={busy} className="btn-primary h-[45px] min-h-0 min-w-[190px] text-[18px]">
                  {busy ? 'Memprediksi…' : 'Prediksi Ulang'}
                </button>
              </div>
              {h ? (
                <>
                  <p className="mt-2 flex flex-wrap items-baseline gap-x-6">
                    <span className="font-serif text-[70px] font-bold italic leading-none text-navy">{fmt(h.value)}</span>
                    <span className="text-[20px] font-semibold text-grey-text">CI {Math.round(h.raw.uncertainty.level * 100)}%: [{fmt(h.lo)} - {fmt(h.hi)}]</span>
                  </p>
                  <div className="mt-[14px]">
                    <RangeBar value={h.value} min={h.scale[0]} max={h.scale[1]} ariaLabel="Nilai prediksi" />
                  </div>
                  <Box muted className="mt-[18px] px-4 py-4 text-[16px] font-semibold text-grey-text">
                    {provenanceLine(h.raw)}
                  </Box>
                </>
              ) : (
                <p className="mt-3 text-[16px] font-semibold text-grey-text">{error ?? 'Belum ada prediksi untuk formula ini.'}</p>
              )}
              {error && h && <p className="mt-2 text-[14px] font-semibold text-bad">{error}</p>}
            </Panel>
            <Panel
              title="Kontribusi Per Bahan"
              className="mt-[18px]"
              right={
                <span className="flex items-center gap-[10px] text-[16px] font-semibold">
                  <span className="size-[23px] rounded-[3px] bg-sky" /> Positif <span className="ml-3 size-[23px] rounded-[3px] bg-grey-bar" /> Negatif
                </span>
              }
              bodyClassName="pt-[10px] pb-[26px]"
            >
              {contributions(ws.analysis?.explain).length ? <ContributionBars rows={contributions(ws.analysis?.explain)} /> : <p className="py-4 text-[16px] font-semibold text-grey-text">Kontribusi belum dihitung.</p>}
              <Box muted className="mt-[24px] px-[17px] py-[13px] text-[16px] font-semibold text-grey-text">
                Nilai positif menandakan kontribusi meningkatkan performa prediksi, nilai negatif menurunkan. Dihitung dengan permutation importance pada model {ws.analysis?.explain?.head ?? 'H1'}.
              </Box>
            </Panel>
            <div className="mt-[18px] grid gap-[21px] xl:grid-cols-[minmax(0,1fr)_295px]">
              <Panel title="Analisis Formulasi" right={<OrbitalLegend />} bodyClassName="py-6">
                <OrbitalMap active={compositionNodes(lines, ws.analysis).find((n) => n.line === active)} nodes={compositionNodes(lines, ws.analysis)} />
              </Panel>
              <Panel bodyClassName="px-[18px] py-[18px]" className="xl:max-h-[1026px] xl:overflow-y-auto xl:self-start">
                <ResultColumn ws={ws} />
              </Panel>
            </div>
          </>
        )}

        {tab === 3 && <SafetyReport ws={ws} />}
        {tab === 4 && (
          <>
            <ReportBuilder ws={ws} />
            <PrintReport ws={ws} />
          </>
        )}
      </div>
      </div>
    </div>
  )
}
