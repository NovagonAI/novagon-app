'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { CostResponse, PredictResponse, Verdict } from './api-types'
import type { AskCandidate, ExplainOut } from './api'
import { EMPTY_QTPP, type ProductTypeId, type Qtpp, productType } from './catalog'

export interface LineUI {
  id: string
  inci_name: string
  wt_pct: number | ''
  ing_id?: string | null
  function_class?: string[]
  eu_max_pct?: number | null
  eu_annex?: string
  halal_status?: string
}

export interface SkinReport {
  image?: string
  /** Verdict from the skin-vision service (skin type + Fitzpatrick with confidences). */
  verdict?: import('./skin').SkinVerdict
  concerns?: Array<{ name: string; p: number }>
  tone?: { label: string; p: number }
  type?: 'oily' | 'dry' | 'sensitive' | 'normal'
  detail?: string
  note?: string
}

export interface Analysis {
  ranAt: string
  /** Every head answer keyed by head id; a problem string when the head declined. */
  heads: Record<string, PredictResponse>
  problems: Record<string, string>
  verdict?: Verdict & { certifiable?: boolean }
  explain?: ExplainOut
  cost?: CostResponse
}

export interface FormulaVersion {
  label: string
  note: string
  lines: LineUI[]
  score?: number | null
  at: string
}

export interface Workspace {
  id: string
  name: string
  productType: ProductTypeId
  createdAt: string
  updatedAt: string
  step: number
  qtpp: Qtpp
  skin: SkinReport
  formula: LineUI[]
  confirmed: boolean
  versions: FormulaVersion[]
  analysis?: Analysis
  candidates?: AskCandidate[]
  optimiserState?: string | null
  candidateSummary?: string[]
}

export interface HistoryEntry {
  id: string
  workspaceId: string
  name: string
  at: string
  score: number | null
  status: string
}

interface StoreState {
  workspaces: Workspace[]
  currentId: string | null
  history: HistoryEntry[]
}

const KEY = 'novagon.store.v1'
const uid = () => Math.random().toString(36).slice(2, 10)

export const newLine = (inci_name = '', wt_pct: number | '' = ''): LineUI => ({ id: uid(), inci_name, wt_pct })

/**
 * Starter formulas so the demo has something to predict. Leave-on types use
 * the Figma example; rinse-off types use the surfactant system the current
 * H1/H2 artefacts were trained on, which is what makes their numbers move.
 */
const STARTERS: Partial<Record<ProductTypeId, () => LineUI[]>> = {
  shampoo: () => [newLine('Aqua', 74.3), newLine('Cocamidopropyl Betaine', 10.9), newLine('Coco-Glucoside', 10), newLine('Polyquaternium-16', 1.9), newLine('Laureth-2', 2.9)],
  bodywash: () => [newLine('Aqua', 72.4), newLine('Cocamidopropyl Betaine', 12), newLine('Coco-Glucoside', 8), newLine('Glycerin', 3), newLine('Sodium Chloride', 1.2), newLine('Laureth-2', 2.4), newLine('Phenoxyethanol', 1)],
  facewash: () => [newLine('Aqua', 78.2), newLine('Cocamidopropyl Betaine', 8), newLine('Coco-Glucoside', 6), newLine('Glycerin', 4), newLine('Panthenol', 1), newLine('Laureth-2', 1.8), newLine('Phenoxyethanol', 1)],
}
const STARTER_LINES = (type: ProductTypeId): LineUI[] =>
  STARTERS[type]?.() ?? [newLine('Aqua', 74.1), newLine('Glycerin', 8), newLine('Hyaluronic Acid', 1.5), newLine('Panthenol', 3)]

export const defaultName = (type: ProductTypeId) =>
  `${productType(type).label.split('/')[0].trim()} ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`

export function createWorkspace(type: ProductTypeId = 'moisturizer'): Workspace {
  const pt = productType(type)
  const now = new Date().toISOString()
  return {
    id: uid(),
    name: defaultName(type),
    productType: type,
    createdAt: now,
    updatedAt: now,
    step: 1,
    qtpp: { ...EMPTY_QTPP, ...pt.qtpp },
    skin: {},
    formula: STARTER_LINES(type),
    confirmed: false,
    versions: [],
  }
}

interface StoreApi extends StoreState {
  ready: boolean
  current: Workspace | null
  select: (id: string | null) => void
  create: (type?: ProductTypeId) => Workspace
  update: (id: string, patch: Partial<Workspace> | ((w: Workspace) => Partial<Workspace>)) => void
  remove: (id: string) => void
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'at'>) => void
}

const Ctx = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>({ workspaces: [], currentId: null, history: [] })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setState(JSON.parse(raw))
    } catch {
      /* corrupt or blocked storage: start empty */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* quota or private mode: the session still works in memory */
    }
  }, [state, ready])

  const select = useCallback((id: string | null) => setState((s) => ({ ...s, currentId: id })), [])

  const create = useCallback((type: ProductTypeId = 'moisturizer') => {
    const w = createWorkspace(type)
    setState((s) => ({ ...s, workspaces: [w, ...s.workspaces], currentId: w.id }))
    return w
  }, [])

  const update = useCallback<StoreApi['update']>((id, patch) => {
    setState((s) => ({
      ...s,
      workspaces: s.workspaces.map((w) => {
        if (w.id !== id) return w
        const p = typeof patch === 'function' ? patch(w) : patch
        return { ...w, ...p, updatedAt: new Date().toISOString() }
      }),
    }))
  }, [])

  const remove = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      workspaces: s.workspaces.filter((w) => w.id !== id),
      currentId: s.currentId === id ? null : s.currentId,
    }))
  }, [])

  const addHistory = useCallback<StoreApi['addHistory']>((entry) => {
    setState((s) => ({
      ...s,
      history: [{ ...entry, id: uid(), at: new Date().toISOString() }, ...s.history].slice(0, 200),
    }))
  }, [])

  const value = useMemo<StoreApi>(
    () => ({
      ...state,
      ready,
      current: state.workspaces.find((w) => w.id === state.currentId) ?? null,
      select,
      create,
      update,
      remove,
      addHistory,
    }),
    [state, ready, select, create, update, remove, addHistory],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside StoreProvider')
  return v
}

/** "Kemarin", "18/08/26": the relative date the Figma cards show. */
export function relativeDate(iso: string): string {
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days <= 0) return 'Hari ini'
  if (days === 1) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
