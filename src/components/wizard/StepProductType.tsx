'use client'

import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { EMPTY_QTPP, PRODUCT_TYPES, type ProductTypeId, type Qtpp, productType } from '@/lib/catalog'
import { createWorkspace, defaultName } from '@/lib/store'
import type { StepProps } from './Wizard'

/** Step 1: the free text field from the Figma frame plus the eight picker cards. */
export function StepProductType({ ws, update, next }: StepProps) {
  const [query, setQuery] = useState(productType(ws.productType).label)
  const [name, setName] = useState(ws.name)

  const choose = (id: ProductTypeId) => {
    const pt = productType(id)
    setQuery(pt.label)
    const renamed = ws.name === defaultName(ws.productType) ? defaultName(id) : ws.name
    setName(renamed)
    update((w) => {
      // keep what the formulator typed, refresh only the fields still at their defaults
      const prev: Qtpp = { ...EMPTY_QTPP, ...productType(w.productType).qtpp }
      const kept = Object.fromEntries(Object.entries(w.qtpp).filter(([k, v]) => v && v !== prev[k as keyof Qtpp]))
      // an untouched starter formula follows the dosage form; edited lines stay
      const untouched = JSON.stringify(w.formula.map((l) => [l.inci_name, l.wt_pct])) === JSON.stringify(createWorkspace(w.productType).formula.map((l) => [l.inci_name, l.wt_pct]))
      return { productType: id, name: renamed, qtpp: { ...EMPTY_QTPP, ...pt.qtpp, ...kept }, ...(untouched && !w.analysis ? { formula: createWorkspace(id).formula, confirmed: false } : {}) }
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const match = PRODUCT_TYPES.find((p) => p.label.toLowerCase().includes(query.toLowerCase().split('/')[0].trim()) || query.toLowerCase().includes(p.label.toLowerCase().split('/')[0]))
    if (match && match.id !== ws.productType) choose(match.id)
    update({ name: name.trim() || ws.name })
    next()
  }

  return (
    <form onSubmit={submit}>
      <Panel bodyClassName="pt-[18px] pb-[26px]">
        <label htmlFor="product-type" className="block text-[20px] font-bold text-navy">
          Masukkan jenis produk yang ingin dianalisis
        </label>
        <input
          id="product-type"
          name="product_type"
          list="product-types"
          className="field mt-[13px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          enterKeyHint="next"
        />
        <datalist id="product-types">
          {PRODUCT_TYPES.map((p) => (
            <option key={p.id} value={p.label}>
              {p.sub}
            </option>
          ))}
        </datalist>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-[26px] lg:grid-cols-4" role="radiogroup" aria-label="Tipe produk">
          {PRODUCT_TYPES.map((p) => {
            const active = p.id === ws.productType
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(p.id)}
                className={`panel flex min-h-[241px] flex-col items-center overflow-hidden px-2 pb-4 pt-[21px] text-center transition ${active ? 'ring-4 ring-blue ring-offset-2' : 'hover:brightness-[0.98]'}`}
              >
                <span className="flex size-[130px] items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-tile">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={p.image} className="size-full object-cover" />
                </span>
                <span className="mt-[20px] break-words px-2 text-[16px] font-bold text-navy">{p.label}</span>
                <span className="mt-[6px] px-2 text-[13px] font-semibold text-black">{p.sub}</span>
              </button>
            )
          })}
        </div>
        <label htmlFor="ws-name" className="label mt-6">
          Nama workspace:
        </label>
        <input id="ws-name" name="workspace" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Moisturizer Tipe A" />
      </Panel>
      <div className="mt-[18px] flex justify-end">
        <button type="submit" className="btn-primary w-[190px]" enterKeyHint="next">
          Selanjutnya
        </button>
      </div>
    </form>
  )
}
