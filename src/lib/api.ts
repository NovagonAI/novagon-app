import type {
  CostResponse,
  ExplainResponse,
  HeadId,
  Health,
  IngredientPage,
  PredictRequest,
  PredictResponse,
  Scoreboard,
  Verdict,
} from './api-types'

/**
 * Client for the formulation inference endpoint (formulation-endpoint, /v1).
 *
 * The base URL is a runtime value: the hosted container may be cold or blocked
 * at the venue, so it can be switched to the laptop twin from the browser
 * without a rebuild (localStorage key `novagon.apiBase`).
 */
// Same-origin path by default: next.config.js rewrites it to API_UPSTREAM.
const DEFAULT_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api/v1'
const BASE_KEY = 'novagon.apiBase'

export function apiBase(): string {
  try {
    return localStorage.getItem(BASE_KEY) || DEFAULT_BASE
  } catch {
    return DEFAULT_BASE
  }
}

export function setApiBase(url: string) {
  try {
    if (url.trim()) localStorage.setItem(BASE_KEY, url.trim().replace(/\/$/, ''))
    else localStorage.removeItem(BASE_KEY)
  } catch {
    /* private mode: nothing to persist */
  }
}

/** RFC 9457 problem document, which is what every non-2xx answer carries. */
export class ApiError extends Error {
  status: number
  title: string
  detail: string
  constructor(status: number, title: string, detail: string) {
    super(`${title}: ${detail}`)
    this.status = status
    this.title = title
    this.detail = detail
  }
}

async function call<T>(path: string, init: RequestInit = {}, timeoutMs = 180_000): Promise<T> {
  const base = apiBase()
  const res = await fetch(`${base.startsWith('/') && typeof window !== 'undefined' ? window.location.origin + base : base}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!res.ok) {
    const p = (body ?? {}) as { title?: string; detail?: string }
    throw new ApiError(res.status, p.title ?? `HTTP ${res.status}`, p.detail ?? text.slice(0, 200))
  }
  return body as T
}

const post = <T,>(path: string, body: unknown) => call<T>(path, { method: 'POST', body: JSON.stringify(body) })

/** Shape of `/v1/explain/{head}` as the running server answers it. */
export interface ExplainOut {
  head: HeadId
  target?: { kind: string; name: string; unit: string }
  effects: Array<{
    inci_name: string
    wt_pct: number
    baseline: number
    without: number
    effect: number
    matched: boolean
  }>
  substitutions: ExplainResponse['substitutions']
  warnings: string[]
}

export interface AskDimension {
  ing_id: string
  inci_name: string
  lo_pct: number
  hi_pct: number
}

export interface AskIn {
  space: AskDimension[]
  q?: number
  product_type?: string
  seed?: number
  state?: string | null
  observations?: number[][]
  values?: number[]
}

export interface AskCandidate {
  /** Position in the design space, one value per dimension. */
  x?: number[]
  formula: { lines: Array<{ ing_id?: string | null; inci_name?: string | null; wt_pct: number }> }
  acquisition: number
  predicted?: Record<string, { value: number; lo: number; hi: number }>
  verdict?: Verdict
  highlighted?: boolean
}

export interface AskOut {
  candidates: AskCandidate[]
  state: string
  n_observations: number
  acceleration_factor?: number | null
}

export const api = {
  health: () => call<Health>('/health', {}, 10_000),
  heads: () => call<Scoreboard>('/heads', {}, 20_000),
  ingredients: (q: string, limit = 8) =>
    call<IngredientPage>(`/ingredients?q=${encodeURIComponent(q)}&limit=${limit}`, {}, 20_000),
  predict: (head: HeadId, body: PredictRequest) => post<PredictResponse>(`/predict/${head}`, body),
  explain: (head: HeadId, body: { formula: PredictRequest['formula']; product_type?: string; limit?: number }) =>
    post<ExplainOut>(`/explain/${head}`, body),
  constraints: (body: { formula: PredictRequest['formula']; product_type?: string; claims?: string[] }) =>
    post<Verdict & { certifiable?: boolean }>('/constraints/check', body),
  cost: (body: { formula: PredictRequest['formula'] }) => post<CostResponse>('/cost', body),
  ask: (body: AskIn) => post<AskOut>('/optimize/ask', body),
}

/** Turn any thrown value into one readable sentence for the interface. */
export function describeError(e: unknown): string {
  if (e instanceof ApiError) return `${e.title} (${e.status}): ${e.detail}`
  if (e instanceof DOMException && e.name === 'TimeoutError') return 'Server tidak menjawab dalam batas waktu.'
  if (e instanceof TypeError) return `Tidak bisa menghubungi endpoint di ${apiBase()}.`
  return e instanceof Error ? e.message : String(e)
}
