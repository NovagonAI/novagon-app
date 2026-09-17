'use client'

import { useState } from 'react'
import { ProductVisual } from '@/components/charts/ProductVisual'
import { Field } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Panel'
import { QTPP_FIELDS, productType } from '@/lib/catalog'
import { SkinScanner } from './SkinScanner'
import type { StepProps } from './Wizard'

/** Step 2: QTPP fields, live product picture, and the skin scanner. */
export function StepQtpp({ ws, update, next, back }: StepProps) {
  const pt = productType(ws.productType)
  const [more, setMore] = useState(false)
  const set = (k: keyof typeof ws.qtpp) => (v: string) => update((w) => ({ qtpp: { ...w.qtpp, [k]: v } }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        next()
      }}
    >
      <Panel title="Spesifikasi Mutu & Kualitas Produk" bodyClassName="pt-[20px] pb-[26px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <fieldset className="space-y-[18px]">
            <legend className="sr-only">Parameter QTPP utama</legend>
            {QTPP_FIELDS.filter((f) => f.group === 'utama').map((f) => (
              <Field key={f.key} label={f.label} value={ws.qtpp[f.key]} onChange={set(f.key)} hint={f.hint} name={f.key} />
            ))}
            <button type="button" onClick={() => setMore((m) => !m)} className="text-[16px] font-bold text-blue underline-offset-4 hover:underline" aria-expanded={more}>
              {more ? '− Sembunyikan parameter tambahan' : '+ Parameter tambahan (bentuk sediaan, rute, aroma, partikel, bahan aktif, keamanan)'}
            </button>
            {more && (
              <div className="grid gap-[18px] sm:grid-cols-2">
                {QTPP_FIELDS.filter((f) => f.group === 'tambahan').map((f) => (
                  <Field key={f.key} label={f.label} value={ws.qtpp[f.key]} onChange={set(f.key)} hint={f.hint} name={f.key} />
                ))}
              </div>
            )}
          </fieldset>
          <Panel title="Gambaran Produk" white className="self-start" titleClassName="text-[18px]">
            <ProductVisual qtpp={ws.qtpp} image={pt.image} bentuk={ws.qtpp.bentuk || pt.label} />
          </Panel>
        </div>
      </Panel>

      <SkinScanner ws={ws} update={update} />

      <div className="mt-[18px] flex justify-between">
        <button type="button" onClick={back} className="btn-outline" enterKeyHint="previous">
          Kembali
        </button>
        <button type="submit" className="btn-primary w-[190px]" enterKeyHint="next">
          Selanjutnya
        </button>
      </div>
    </form>
  )
}
