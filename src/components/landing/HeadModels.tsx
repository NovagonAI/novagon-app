'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { HeadId, HeadStatus } from '@/lib/api-types'
import { HEAD_LABEL } from '@/lib/catalog'
import { fmt } from '@/lib/insight'
import { Reveal, Wave } from './Motion'

const HEADS: HeadId[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'H11', 'H12', 'H13']

const ABOUT: Record<HeadId, string> = {
  H1: 'Probabilitas sediaan tetap homogen dan tidak memisah.',
  H2: 'Kekentalan sediaan pada laju geser 10 per detik.',
  H3: 'Nilai SPF dari kombinasi filter UV.',
  H4: 'Kesan spreadability dan rasa di kulit.',
  H5: 'Mengenali jenis sediaan dari komposisinya.',
  H6: 'Prior misel dan keseimbangan surfaktan.',
  H7: 'Kandidat bahan aktif dari sinyal transkriptomik.',
  H8: 'Kelas khasiat bahan alam dan jamu.',
  H9: 'Kondisi kulit yang terlihat dari foto wajah.',
  H10: 'Kelas warna kulit ITA dari gambar dan spektrum.',
  H11: 'Tanda pemisahan fase dari foto mikroskop.',
  H12: 'Membaca tabel formula dari dokumen.',
  H13: 'Model cepat dari tabel yang diunggah sendiri.',
}

/** Metrics where a smaller number is better, so the gauge compares threshold to value. */
const LOWER_IS_BETTER = /rmse|mae|error|loss/i

function ratio(h: HeadStatus | undefined): number | null {
  if (!h || h.value == null || h.threshold == null || h.threshold === 0) return null
  const r = LOWER_IS_BETTER.test(h.metric ?? '') ? h.threshold / Math.max(h.value, 1e-9) : h.value / h.threshold
  return Math.max(0, Math.min(1, r))
}

/** Half ring: grey track, blue progress, no verdict, just the numbers under it. */
function Arc({ value }: { value: number | null }) {
  const r = 40
  const half = Math.PI * r
  const d = `M 10 52 A ${r} ${r} 0 0 1 90 52`
  return (
    <svg viewBox="0 0 100 56" className="w-full max-w-[160px]" aria-hidden="true">
      <path d={d} fill="none" stroke="#d9d9d9" strokeWidth="9" strokeLinecap="round" />
      {value != null && <path d={d} fill="none" stroke="#1a5ba1" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${half * value} ${half}`} />}
    </svg>
  )
}

/** Item 4: one card per head with its metric against the threshold, read live from the endpoint. */
export function HeadModels() {
  const [heads, setHeads] = useState<Record<string, HeadStatus>>({})
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .heads()
      .then((s) => alive && setHeads(Object.fromEntries(s.heads.map((h) => [h.head, h]))))
      .catch(() => alive && setOffline(true))
    return () => {
      alive = false
    }
  }, [])

  return (
    <section id="innovation" className="scroll-mt-4 bg-mist">
      <div className="mx-auto max-w-[1150px] px-4 pb-[clamp(48px,7vw,96px)] pt-[clamp(16px,3vw,40px)] sm:px-8">
        <Reveal className="text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-blue">Innovation</p>
          <h2 className="mt-2 font-serif text-[clamp(28px,3vw,40px)] font-bold italic text-navy">13 Head Model</h2>
          <p className="mx-auto mt-2 max-w-[720px] text-[15px] font-medium text-black">
            Satu endpoint, tiga belas kepala prediksi. Tiap kartu menunjukkan metrik model saat ini terhadap ambang yang ditetapkan.
          </p>
        </Reveal>
        <ul className="mt-[clamp(20px,3vw,40px)] grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {HEADS.map((id, i) => {
            const h = heads[id]
            const r = ratio(h)
            return (
              <Reveal key={id} delay={(i % 4) * 60}>
                <li className="panel-white flex h-full flex-col items-center p-5 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src="/figma/formulabot.svg" width={64} height={64} className="size-16" />
                  <p className="mt-3 text-[13px] font-bold uppercase tracking-[0.15em] text-blue">{id}</p>
                  <p className="text-[18px] font-bold leading-tight text-navy">{HEAD_LABEL[id]}</p>
                  <p className="mt-1 min-h-[40px] text-[13px] font-medium text-grey-text">{ABOUT[id]}</p>
                  <div className="mt-3 w-full">
                    <Arc value={r} />
                  </div>
                  <p className="-mt-1 text-[16px] font-bold text-navy">
                    {h && h.value != null ? `${fmt(h.value, 3)} / ${h.threshold ?? '-'}` : offline ? 'belum terhubung' : h ? 'belum diukur' : '...'}
                  </p>
                  {h?.metric && <p className="text-[11px] font-semibold text-grey-text">{h.metric}</p>}
                </li>
              </Reveal>
            )
          })}
        </ul>
      </div>
      <Wave fill="#ffffff" />
    </section>
  )
}
