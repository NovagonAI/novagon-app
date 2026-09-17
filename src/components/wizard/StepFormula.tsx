'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import type { Ingredient } from '@/lib/api-types'
import { Icon } from '@/components/ui/Icon'
import { Panel } from '@/components/ui/Panel'
import { fmt, headline, titleCase, totalPct } from '@/lib/insight'
import { type LineUI, newLine, useStore } from '@/lib/store'
import dataset from '@/lib/dataset.json'
import type { StepProps } from './Wizard'
import { runAnalysis } from './analysis'

/** Step 3: the ingredient table, then the read-only confirmation before predicting. */
export function StepFormula({ ws, update, next, back }: StepProps) {
  const { addHistory } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lines = ws.formula
  const total = totalPct(lines)
  const confirmed = ws.confirmed

  const setLine = (id: string, patch: Partial<LineUI>) => update((w) => ({ formula: w.formula.map((l) => (l.id === id ? { ...l, ...patch } : l)), confirmed: false }))
  const removeLine = (id: string) => update((w) => ({ formula: w.formula.filter((l) => l.id !== id), confirmed: false }))
  const addLine = () => update((w) => ({ formula: [...w.formula, newLine()], confirmed: false }))

  const predict = async () => {
    setBusy(true)
    setError(null)
    try {
      const analysis = await runAnalysis(ws)
      const score = headline(analysis, ws.productType)?.value ?? null
      const version = { label: `v${ws.versions.length + 1}`, note: ws.versions.length ? 'Revisi formula' : 'Formula awal', lines: ws.formula, at: new Date().toISOString(), score }
      update({ analysis, versions: [...ws.versions, version], candidates: undefined, candidateSummary: undefined, optimiserState: null })
      addHistory({ workspaceId: ws.id, name: ws.name, score, status: analysis.verdict?.status ?? 'n/a' })
      next()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!confirmed) update({ confirmed: true })
        else predict()
      }}
    >
      {!confirmed && <DatasetPicker onAdd={(l) => update((w) => ({ formula: [...w.formula.filter((x) => x.inci_name.trim()), l], confirmed: false }))} onExample={(ls) => update({ formula: ls, confirmed: false })} />}
      <Panel title={confirmed ? 'Konfirmasi Bahan Formula' : 'Daftar Bahan Aktif'} bodyClassName="pt-[16px] pb-[26px]">
        <div className="grid grid-cols-[minmax(0,1fr)_190px_36px] items-center gap-x-[18px] text-[20px] font-bold text-navy">
          <span>Nama Bahan (Inci)</span>
          <span className="text-center">Persentase (%)</span>
          <span />
        </div>
        <ul className="mt-[14px] space-y-[16px]">
          {lines.map((l, i) => (
            <li key={l.id}>
              <div className="grid grid-cols-[minmax(0,1fr)_190px_36px] items-center gap-x-[18px]">
                <IngredientInput line={l} index={i} disabled={confirmed} onChange={(p) => setLine(l.id, p)} />
                <input
                  aria-label={`Persentase ${l.inci_name || `bahan ${i + 1}`}`}
                  name={`wt_pct_${i}`}
                  className="field text-center"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.01"
                  value={l.wt_pct}
                  readOnly={confirmed}
                  onChange={(e) => setLine(l.id, { wt_pct: e.target.value === '' ? '' : Number(e.target.value) })}
                />
                {!confirmed ? (
                  <button type="button" onClick={() => removeLine(l.id)} className="text-navy hover:text-bad" aria-label={`Hapus ${l.inci_name || `bahan ${i + 1}`}`}>
                    <Icon name="close-circle" size={36} />
                  </button>
                ) : (
                  <span />
                )}
              </div>
              <div className="mt-[10px] flex flex-wrap gap-[6px]">
                {(l.function_class ?? []).filter((f) => f !== 'unknown').map((f) => (
                  <span key={f} className="chip capitalize">
                    {f.replace(/_/g, '-')}
                  </span>
                ))}
                {l.eu_max_pct != null && <span className="chip-muted">max {fmt(l.eu_max_pct)}%</span>}
                {l.eu_annex === 'II' && <span className="chip border-bad text-bad">Annex II · dilarang</span>}
                {l.halal_status && l.halal_status !== 'unknown' && <span className="chip-muted">halal: {l.halal_status.replace(/_/g, ' ')}</span>}
                {l.ing_id === null && l.inci_name && <span className="chip border-warn-dark text-warn-dark">tidak ada di registry</span>}
              </div>
            </li>
          ))}
        </ul>
        {!confirmed && (
          <button type="button" onClick={addLine} className="btn-outline mt-[16px] h-[56px] gap-2 pl-[10px] pr-[26px]">
            <Icon name="add-circle" size={32} /> Tambah Bahan
          </button>
        )}
        <p className="mt-[24px] text-[16px] font-bold text-black">Total Persentase</p>
        <div className="mt-[6px] flex items-center gap-4">
          <div className="h-[10px] flex-1 overflow-hidden rounded-[20px] bg-grey-bar" role="progressbar" aria-valuenow={total} aria-valuemin={0} aria-valuemax={100} aria-label="Total persentase">
            <div className={`h-full rounded-[20px] ${total > 100.5 ? 'bg-bad' : 'bg-ok-bar'}`} style={{ width: `${Math.min(100, total)}%` }} />
          </div>
          <span className="w-[70px] text-right text-[16px] font-bold text-black">{fmt(total).replace('.', ',')}%</span>
        </div>
        {Math.abs(total - 100) > 0.5 && (
          <p className="mt-2 text-[14px] font-semibold text-warn-dark">
            {total > 100 ? 'Total melebihi 100%: kurangi salah satu bahan.' : `Sisa ${fmt(100 - total)}% belum ditentukan; model menormalisasi ke komposisi tertutup.`}
          </p>
        )}
      </Panel>
      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 text-[16px] font-semibold text-bad">
          <Icon name="danger" size={20} /> {error}
        </p>
      )}
      <div className="mt-[18px] flex justify-between">
        <button type="button" onClick={confirmed ? () => update({ confirmed: false }) : back} className="btn-outline" enterKeyHint="previous">
          {confirmed ? 'Ubah formula' : 'Kembali'}
        </button>
        <button type="submit" className="btn-primary w-[180px]" disabled={busy || lines.filter((l) => l.inci_name.trim()).length === 0} enterKeyHint="next">
          {busy ? 'Memprediksi…' : confirmed ? 'Prediksi' : 'Konfirmasi'}
        </button>
      </div>
    </form>
  )
}

/**
 * The 18 raw materials the H1/H2 artefacts were trained on (BASF shampoo
 * study, 812 samples) and six measured formulas from that table. Picking
 * from here guarantees the model recognises every line.
 */
function DatasetPicker({ onAdd, onExample }: { onAdd: (l: LineUI) => void; onExample: (ls: LineUI[]) => void }) {
  const byTrade = new Map(dataset.ingredients.map((i) => [i.trade, i]))
  const toLine = (trade: string, wt: number): LineUI => {
    const i = byTrade.get(trade)!
    return { ...newLine(i.inci, wt), ing_id: i.ing_id, function_class: [i.function, i.type].filter(Boolean) }
  }
  return (
    <Panel title="Pilih dari dataset model" className="mb-[18px]" bodyClassName="pt-[14px] pb-[20px]">
      <p className="text-[14px] font-semibold text-grey-text">
        H1 (stabilitas) dan H2 (viskositas) dilatih pada 812 formula sampo dengan 18 bahan baku ini. Bahan di luar daftar tetap bisa diinput, tetapi model mengabaikannya.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Tambah bahan dataset:</span>
          <select
            className="field text-[16px]"
            value=""
            onChange={(e) => {
              if (e.target.value) onAdd(toLine(e.target.value, 5))
            }}
          >
            <option value="">— pilih bahan baku —</option>
            {dataset.ingredients.map((i) => (
              <option key={i.trade} value={i.trade}>
                {titleCase(i.inci)} · {i.trade} ({i.type ?? i.function})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Muat contoh formula terukur:</span>
          <select
            className="field text-[16px]"
            value=""
            onChange={(e) => {
              const ex = dataset.examples.find((x) => String(x.sample_id) === e.target.value)
              if (!ex) return
              const lines = ex.lines.map((l) => toLine(l.trade, l.wt))
              const used = lines.reduce((a, l) => a + (l.wt_pct as number), 0)
              onExample([{ ...newLine('Aqua', +(100 - used).toFixed(2)), ing_id: SERVER_RESOLVES, function_class: ['solvent'] }, ...lines])
            }}
          >
            <option value="">— pilih sampel dataset —</option>
            {dataset.examples.map((x) => (
              <option key={x.sample_id} value={x.sample_id}>
                Sampel #{x.sample_id} · {x.stable ? 'stabil' : 'tidak stabil'}{x.viscosity_class !== 'nan' && x.viscosity_class !== 'None' ? ` · viskositas ${x.viscosity_class.toLowerCase()}` : ''} · {x.lines.length} bahan
              </option>
            ))}
          </select>
        </label>
      </div>
    </Panel>
  )
}

/** ing_id for a name the server resolves itself: truthy so it never reads as unmatched, empty so it is never sent. */
const SERVER_RESOLVES = ''

const SYNONYM: Record<string, string[]> = { AQUA: ['WATER', 'AQUA (WATER)', 'WATER (AQUA)'], WATER: ['AQUA'] }

/** Exact registry name, else a synonym, else the same name behind a prefix like "(ORGANIC)". Anything looser mislabels. */
function bestMatch(q: string, items: Ingredient[]): Ingredient | undefined {
  const Q = q.toUpperCase()
  const clean = (s: string) => s.toUpperCase().replace(/[()]/g, '').replace(/^(INCI|ORGANIC|VEGETABLE)\s+/, '').trim()
  return (
    items.find((i) => i.inci_name.toUpperCase() === Q) ??
    items.find((i) => (SYNONYM[Q] ?? []).includes(i.inci_name.toUpperCase())) ??
    items.find((i) => clean(i.inci_name) === Q && !/^\d/.test(i.inci_name))
  )
}

/** Name field with registry lookup: chips, id and caps come from the match. */
function IngredientInput({ line, index, disabled, onChange }: { line: LineUI; index: number; disabled: boolean; onChange: (p: Partial<LineUI>) => void }) {
  const [options, setOptions] = useState<Ingredient[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const listId = `ing-${line.id}`

  useEffect(() => () => clearTimeout(timer.current), [])

  // a starter or restored line has a name but no registry match yet: settle it once
  useEffect(() => {
    if (line.inci_name.trim() && line.ing_id === undefined) resolve()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lookup = (q: string) => {
    clearTimeout(timer.current)
    if (q.trim().length < 2) return setOptions([])
    timer.current = setTimeout(async () => {
      try {
        const page = await api.ingredients(q, 8)
        setOptions(page.items)
      } catch {
        setOptions([])
      }
    }, 250)
  }

  const apply = (ing: Ingredient, keepName?: string) => {
    onChange({ inci_name: keepName ?? titleCase(ing.inci_name), ing_id: ing.ing_id, function_class: ing.function_class, eu_max_pct: ing.eu_max_pct, eu_annex: ing.eu_annex, halal_status: ing.halal_status })
    setOpen(false)
  }

  const resolve = async () => {
    // on blur: settle the typed name against the registry once, exact match first
    const q = line.inci_name.trim()
    if (!q || line.ing_id) return
    const Q = q.toUpperCase()
    if (Q === 'AQUA' || Q === 'WATER') {
      // the registry lists dozens of water aliases; the server's own cascade
      // resolves the plain name, so the client only labels it
      onChange({ inci_name: titleCase(q), ing_id: SERVER_RESOLVES, function_class: ['solvent'] })
      return
    }
    try {
      const page = await api.ingredients(q, 200)
      const best = bestMatch(q, page.items)
      if (best) apply(best, (SYNONYM[Q] ?? []).includes(best.inci_name.toUpperCase()) ? titleCase(q) : undefined)
      // no exact row: keep the typed name, the server's five-step cascade resolves it
      else onChange({ inci_name: titleCase(q), ing_id: SERVER_RESOLVES })
    } catch {
      /* offline: keep the free text, the server resolves names itself */
    }
  }

  return (
    <div className="relative">
      <input
        aria-label={`Nama bahan ${index + 1}`}
        name={`inci_${index}`}
        className="field"
        value={line.inci_name}
        readOnly={disabled}
        autoComplete="off"
        placeholder="Nama INCI, mis. Niacinamide"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open && options.length > 0}
        onChange={(e) => {
          onChange({ inci_name: e.target.value, ing_id: undefined, function_class: undefined, eu_max_pct: undefined, eu_annex: undefined, halal_status: undefined })
          lookup(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150)
          resolve()
        }}
      />
      {open && options.length > 0 && !disabled && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-[10px] border border-navy bg-white py-1 shadow-card">
          {options.map((o) => (
            <li key={o.ing_id} role="option" aria-selected={false}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => apply(o)} className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-pale">
                <span className="text-[16px] font-semibold text-black">{titleCase(o.inci_name)}</span>
                <span className="truncate text-[13px] font-medium text-grey-text">{o.function_class.filter((f) => f !== 'unknown').join(', ')}{o.eu_max_pct != null ? ` · max ${o.eu_max_pct}%` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
