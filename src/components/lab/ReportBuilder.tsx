'use client'

import { useState } from 'react'
import { ArtIcon, Icon } from '@/components/ui/Icon'
import { Panel, Box } from '@/components/ui/Panel'
import { productType } from '@/lib/catalog'
import { buildCsv, buildPif, candidateScore, downloadText, fmt, headline } from '@/lib/insight'
import type { Workspace } from '@/lib/store'

type Format = 'pdf' | 'csv' | 'pif'

const FORMATS: Array<{ id: Format; icon: string; title: string; text: string }> = [
  { id: 'pdf', icon: 'document-text', title: 'PDF Laporan', text: 'Laporan lengkap yang bisa dicetak dan dibagikan' },
  { id: 'csv', icon: 'chart', title: 'CSV Data', text: 'Data mentah untuk analisis lanjutan di spreadsheet' },
  { id: 'pif', icon: 'folder-open-lg', title: 'PIF (Product Information File)', text: 'Template dokumentasi regulatori EU Cosmetics Regulation' },
]

/** "Buat Laporan": pick a format, tick the sections, export. */
export function ReportBuilder({ ws }: { ws: Workspace }) {
  const [format, setFormat] = useState<Format>('pdf')
  const h = headline(ws.analysis, ws.productType)
  const items = [
    { id: 'qtpp', title: 'QTPP (Quality Target Product Profile)', sub: 'Semua parameter target formulasi' },
    { id: 'safety', title: 'Uji Keamanan', sub: '6 uji in silico' },
    ...ws.versions.map((v, i) => ({ id: `v${i}`, title: `Formula ${v.label}`, sub: v.score != null ? `Skor ${fmt(v.score)}` : v.note, tag: v.label })),
    ...(ws.candidates ?? []).map((c, i) => ({ id: `c${i}`, title: `Kandidat C${i + 1}`, sub: (() => {
      const s = h ? candidateScore(c, h.head) : null
      return s ? `Skor ${fmt(s.value * (h?.unit === 'skor 0–100' ? 100 : 1))}` : 'Usulan optimiser'
    })() })),
  ]
  const [checked, setChecked] = useState<Set<string>>(() => new Set(items.map((i) => i.id)))
  const toggle = (id: string) => setChecked((s) => {
    const n = new Set(s)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })
  const versions = ws.versions.filter((_, i) => checked.has(`v${i}`)).length
  const predictions = (ws.analysis ? 1 : 0) + (ws.candidates ?? []).filter((_, i) => checked.has(`c${i}`)).length
  const summary = [
    <>Workspace: <strong>{ws.name}</strong></>,
    checked.has('qtpp') ? 'QTPP tercakup' : 'QTPP tidak disertakan',
    `${versions} formula tercakup`,
    `${predictions} hasil prediksi`,
  ]
  const slug = ws.name.replace(/[^\w]+/g, '-').toLowerCase()

  const exportNow = () => {
    if (format === 'csv') downloadText(`${slug}.csv`, buildCsv(ws), 'text/csv')
    else if (format === 'pif') downloadText(`${slug}-pif.md`, buildPif(ws), 'text/markdown')
    else window.print()
  }

  return (
    <Panel className="mt-[18px] print:hidden" bodyClassName="pt-[18px] pb-[26px]">
      <h2 className="text-[20px] font-bold text-navy">Buat Laporan</h2>
      <p className="mt-1 text-[16px] font-semibold text-grey-text">Pilih data yang ingin dimasukkan ke dalam laporan, lalu pilih format ekspor.</p>
      <h3 className="mt-[24px] text-[20px] font-bold text-black">Format Laporan</h3>
      <div className="mt-[14px] grid gap-[13px] sm:grid-cols-3" role="radiogroup" aria-label="Format laporan">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={format === f.id}
            onClick={() => setFormat(f.id)}
            className={`${format === f.id ? 'panel-white' : 'panel'} flex h-[173px] flex-col items-center justify-start px-3 pt-[16px] text-center`}
          >
            <ArtIcon name={f.icon} />
            <span className="mt-[14px] text-[16px] font-bold text-navy">{f.title}</span>
            <span className="mt-[6px] text-[13px] font-semibold text-grey-text">{f.text}</span>
          </button>
        ))}
      </div>
      <h3 className="mt-[24px] text-[20px] font-bold text-black">Konten Laporan</h3>
      <ul className="mt-[14px] grid gap-[10px] sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.id}>
            <label className="flex h-[76px] cursor-pointer items-center gap-[19px] rounded-[10px] border border-navy bg-white px-[14px]">
              <input type="checkbox" className="sr-only" checked={checked.has(it.id)} onChange={() => toggle(it.id)} />
              <span className={`flex size-[38px] shrink-0 items-center justify-center rounded-[10px] border border-navy ${checked.has(it.id) ? 'bg-navy text-white' : 'bg-white text-transparent'}`} aria-hidden="true">
                <Icon name="tick-square" size={30} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[16px] font-semibold text-black">
                  <span className="truncate">{it.title}</span>
                  {'tag' in it && it.tag && <span className="rounded-[24px] bg-blue px-3 text-[16px] font-bold text-white">{it.tag}</span>}
                </span>
                <span className="block text-[14px] font-semibold text-grey-text">{it.sub}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <h3 className="mt-[24px] text-[20px] font-bold text-black">Ringkasan Laporan</h3>
      <ul className="mt-[14px] space-y-[10px]">
        {summary.map((s, i) => (
          <li key={i}>
            <Box className="px-5 py-3 text-[16px] font-semibold text-black">{s}</Box>
          </li>
        ))}
      </ul>
      <p className="mt-[14px] text-[16px] font-semibold text-grey-text">
        Total {checked.size} bagian · Format: {FORMATS.find((f) => f.id === format)?.title} · Produk: {productType(ws.productType).label}
      </p>
      <div className="mt-[10px] flex justify-end">
        <button type="button" onClick={exportNow} className="btn-primary h-[57px] min-h-0 min-w-[219px]">
          Ekspor Laporan →
        </button>
      </div>
    </Panel>
  )
}
