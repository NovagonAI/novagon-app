'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BandHeader } from '@/components/shell/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Panel, Box } from '@/components/ui/Panel'
import { api, apiBase, describeError, setApiBase } from '@/lib/api'
import type { Health, Scoreboard } from '@/lib/api-types'
import { HEAD_LABEL, productType } from '@/lib/catalog'
import { fmt, headline } from '@/lib/insight'
import { relativeDate, useStore } from '@/lib/store'

/** Workspace counts, latest work, and the model scoreboard from /v1/heads. */
export default function OverviewPage() {
  const store = useStore()
  const router = useRouter()
  const [health, setHealth] = useState<Health | null>(null)
  const [heads, setHeads] = useState<Scoreboard | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [base, setBase] = useState('')

  useEffect(() => {
    setBase(apiBase())
    let alive = true
    Promise.all([api.health(), api.heads()])
      .then(([h, s]) => {
        if (!alive) return
        setHealth(h)
        setHeads(s)
        setErr(null)
      })
      .catch((e) => alive && setErr(describeError(e)))
    return () => {
      alive = false
    }
  }, [])

  const latest = store.workspaces[0]
  const analysed = store.workspaces.filter((w) => w.analysis).length
  const available = heads?.heads.filter((h) => h.available).length ?? 0

  return (
    <div className="mx-auto w-full max-w-[1150px] px-4 lg:px-12 pb-16">
      <BandHeader title="Overview" subtitle={health ? `endpoint ${health.status} · core ${health.core_tag}` : err ? 'endpoint tidak terhubung' : 'menghubungi endpoint…'} />
      <div className="mt-[37px] grid gap-[13px] sm:grid-cols-3">
        <Stat label="Workspace" value={store.workspaces.length} hint="formulasi tersimpan" />
        <Stat label="Sudah diprediksi" value={analysed} hint="formula dengan hasil model" />
        <Stat label="Head tersedia" value={heads ? `${available}/13` : '—'} hint={health ? `resident ${health.resident_head ?? '—'} · registry ${health.registry_version}` : ''} />
      </div>

      <div className="mt-[18px] grid gap-[18px] lg:grid-cols-2">
        <Panel title="Lanjutkan pekerjaan" bodyClassName="pt-[16px] pb-[22px]">
          {latest ? (
            <>
              <p className="text-[20px] font-bold text-navy">{latest.name}</p>
              <p className="text-[14px] font-semibold text-grey-text">
                {productType(latest.productType).label} · langkah {latest.step} dari 6 · {relativeDate(latest.updatedAt)}
              </p>
              {latest.analysis && headline(latest.analysis, latest.productType) && (
                <p className="mt-2 font-serif text-[40px] font-bold italic leading-none text-navy">{fmt(headline(latest.analysis, latest.productType)!.value)}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-primary h-[45px] min-h-0 text-[16px]"
                  onClick={() => {
                    store.select(latest.id)
                    router.push('/analisis')
                  }}
                >
                  Lanjutkan analisis
                </button>
                <Link href={`/laboratorium/${latest.id}`} className="btn-outline h-[45px] min-h-0 text-[16px]">
                  Buka di Laboratorium
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-[16px] font-semibold text-grey-text">Belum ada workspace.</p>
              <button
                type="button"
                className="btn-primary mt-4 h-[45px] min-h-0 text-[16px]"
                onClick={() => {
                  store.create('moisturizer')
                  router.push('/analisis')
                }}
              >
                Mulai analisis formulasi
              </button>
            </>
          )}
        </Panel>
        <Panel title="Endpoint" bodyClassName="pt-[16px] pb-[22px]">
          <label htmlFor="api-base" className="label">
            Base URL API
          </label>
          <div className="flex gap-2">
            <input id="api-base" className="field text-[16px]" value={base} onChange={(e) => setBase(e.target.value)} placeholder="/api/v1 (proxy Vercel) atau https://…/v1" />
            <button
              type="button"
              className="btn-outline h-[56px] min-h-0 text-[16px]"
              onClick={() => {
                setApiBase(base)
                location.reload()
              }}
            >
              Simpan
            </button>
          </div>
          <p className="mt-2 text-[13px] font-medium text-grey-text">Container gratis atau laptop twin: gambar Docker yang sama, ganti alamat di sini bila salah satunya dingin.</p>
          {err && <p className="mt-2 text-[14px] font-semibold text-bad">{err}</p>}
          {health && (
            <p className="mt-2 text-[13px] font-medium text-grey-text">
              build {health.endpoint_build} · uptime {Math.round(health.uptime_s / 3600)} jam · auth {String((health as unknown as { auth?: string }).auth ?? '—')}
            </p>
          )}
        </Panel>
      </div>

      <Panel title="Model (13 head)" className="mt-[18px]" bodyClassName="pt-[10px] pb-[22px]">
        {heads ? (
          <ul className="divide-y divide-line">
            {heads.heads.map((h) => (
              <li key={h.head} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-[10px]">
                <span className="w-[44px] text-[16px] font-bold text-navy">{h.head}</span>
                <span className="min-w-[220px] flex-1 text-[16px] font-semibold text-black">{HEAD_LABEL[h.head] ?? h.name}</span>
                <span className="text-[13px] font-medium text-grey-text">
                  {h.metric ?? '—'} {h.value != null ? fmt(h.value, 3) : ''} {h.threshold != null ? `(gerbang ${h.threshold})` : ''} · {h.train_rows ?? '—'} baris
                </span>
                <Badge tone={!h.available ? 'grey' : h.gate === 'pass' ? 'ok' : h.gate === 'fail' ? 'warn' : 'info'}>{!h.available ? 'tidak ada artefak' : h.gate === 'pass' ? 'lolos gerbang' : h.gate === 'fail' ? 'di bawah gerbang' : 'belum diukur'}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-[16px] font-semibold text-grey-text">{err ?? 'Memuat scoreboard…'}</p>
        )}
        <Box muted className="mt-3 px-4 py-3 text-[13px] font-medium text-grey-text">
          Head di bawah gerbang tetap dilayani; nilainya ditampilkan bersama interval dan catatan asal data. Head tanpa artefak menjawab 503 dan dua belas lainnya tetap berjalan.
        </Box>
      </Panel>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <Panel bodyClassName="py-5">
      <p className="text-[16px] font-bold text-navy">{label}</p>
      <p className="font-serif text-[48px] font-bold italic leading-none text-navy">{value}</p>
      <p className="mt-1 text-[13px] font-semibold text-grey-text">{hint}</p>
    </Panel>
  )
}
