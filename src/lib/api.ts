/**
 * Formulation Endpoint — API Client
 *
 * Centralized layer untuk semua komunikasi dengan backend formulation-endpoint.
 * Base URL dikonfigurasi lewat env var NEXT_PUBLIC_API_BASE_URL.
 *
 * CATATAN: URL Cloudflare Tunnel berubah setiap restart server.
 * Update NEXT_PUBLIC_API_BASE_URL di .env.local kalau URL berubah.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** URL backend — dipakai untuk server-side fetch (dashboard/page.tsx, dll) */
export const API_BASE_URL =
  (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'https://minolta-bargains-shakespeare-gear.trycloudflare.com'
    // 'http://103.125.91.130:9100/respati/4fb4c5d5-bb24-433a-b335-b4283d78f902/proxy/8000'
  ).replace(/\/+$/, '')

/**
 * URL yang dipakai oleh 'use client' components.
 * Di browser: fetch ke /api/proxy/... supaya Next.js yang forward ke backend
 * (bebas CORS karena server-to-server).
 * Di server (SSR/RSC): fetch langsung ke backend.
 */
const CLIENT_BASE =
  typeof window === 'undefined'
    ? API_BASE_URL          // server-side: langsung ke backend
    : '/api/proxy'          // client-side: lewat Next.js proxy route

/** Default fetch timeout dalam milidetik */
const TIMEOUT_MS = 15_000

// ---------------------------------------------------------------------------
// Types — Response shapes
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: 'ok' | string
  endpoint_build: string
  core_tag: string
  artifact_release_tag: string
  registry_version: string
  resident_head: string | null
  uptime_s: number
  cors: string
  auth: string
  daily_quota: number | null
}

export interface HeadInfo {
  head: string          // "H1", "H2", dst
  name: string          // nama human-readable target
  available: boolean
  served: boolean
  gate: 'pass' | 'fail' | 'not_measured'
  value: number | null  // metrik headline (bukan served)
  metric: string        // nama metrik, mis. "roc_auc_binary"
  threshold: number
  train_rows: number | null
  split: string
  coverage: number | null
  licence_class: string
  method_doi: string[]
  note: string
}

export interface HeadsResponse {
  generated_at: string
  heads: HeadInfo[]
}

export interface FormulaLine {
  inci_name: string
  wt_pct: number
  ing_id?: string
  cas?: string
  label?: string
}

export interface PredictRequest {
  formula: { lines: FormulaLine[] }
  conditions?: Record<string, unknown>
  product_type?: string
  image_b64?: string | null
}

export interface PredictionResult {
  head: string
  target: {
    kind: 'scalar' | 'class'
    name: string
    unit: string
  }
  prediction: {
    kind: string
    unit: string
    name: string
    value: number
    lo: number
    hi: number
    extras: {
      matched_ingredients: number
      [key: string]: unknown
    }
  }
  uncertainty: {
    level: number
    method: string
    band: 'low' | 'medium' | 'high'
    ood: boolean
  }
  provenance: {
    model_version: string
    git_commit: string
    registry_version: string
    train_rows: number
    split: string
    gate: 'pass' | 'fail' | 'not_measured'
    method_doi: string[]
    data: {
      name: string
      licence: string
      class: string
      doi: string
      paper: string
      card: string
    }[]
    attribution: string | null
  }
  verdict: {
    status: 'pass' | 'warn' | 'fail'
    findings: Finding[]
    halal_claimable: boolean
    certifiable: boolean
    manufacturing_note: string
  }
  routed_from: string | null
  warnings: string[]
}

export interface Finding {
  rule: string
  severity: 'warn' | 'fail'
  message: string
  source: string
  ing_id: string | null
  inci_name: string | null
  observed: number
  limit: number
  condition: string | null
  suggestion: string | null
}

export interface ConstraintCheckRequest {
  formula: { lines: FormulaLine[] }
  product_type?: string
}

export interface ConstraintCheckResponse {
  status: 'pass' | 'warn' | 'fail'
  findings: Finding[]
  halal_claimable: boolean
  certifiable: boolean
  manufacturing_note: string
}

// Generic API error shape
export interface ApiError {
  type: string
  title: string
  status: number
  detail: string
  instance: string
}

// ---------------------------------------------------------------------------
// Data dummy — Formula H1 (shampoo, nama vendor dagang diprioritaskan)
// ---------------------------------------------------------------------------

/**
 * Formula dummy untuk H1 (viskositas shampoo).
 * Pakai nama vendor dagang bukan INCI generik — sesuai rekomendasi API ref.
 */
export const DUMMY_FORMULA_H1: FormulaLine[] = [
  { inci_name: 'Texapon SB 3 KC',        wt_pct: 15.0 },
  { inci_name: 'Tego Betaine F 50',       wt_pct: 5.0  },
  { inci_name: 'Plantacare 2000 UP',      wt_pct: 5.0  },
  { inci_name: 'Lamesoft PO 65',          wt_pct: 2.0  },
  { inci_name: 'Jaguar HP-105',           wt_pct: 0.3  },
  { inci_name: 'Glycerin',                wt_pct: 3.0  },
  { inci_name: 'Sodium Chloride',         wt_pct: 1.5  },
  { inci_name: 'Citric Acid',             wt_pct: 0.3  },
  { inci_name: 'Phenoxyethanol',          wt_pct: 0.9  },
  { inci_name: 'Aqua',                    wt_pct: 67.0 },
]

/**
 * Formula dummy untuk H2 (rheology / yield stress surfaktan).
 * Sama seperti H1 — nama vendor dagang.
 */
export const DUMMY_FORMULA_H2: FormulaLine[] = [
  { inci_name: 'Texapon SB 3 KC',        wt_pct: 20.0 },
  { inci_name: 'Tego Betaine F 50',       wt_pct: 7.0  },
  { inci_name: 'Plantacare 818 UP',       wt_pct: 3.0  },
  { inci_name: 'Lamesoft PO 65',          wt_pct: 2.0  },
  { inci_name: 'Carbopol ETD 2020',       wt_pct: 0.5  },
  { inci_name: 'Triethanolamine',         wt_pct: 0.5  },
  { inci_name: 'Glycerin',                wt_pct: 3.0  },
  { inci_name: 'Sodium Chloride',         wt_pct: 1.0  },
  { inci_name: 'Citric Acid',             wt_pct: 0.2  },
  { inci_name: 'Phenoxyethanol',          wt_pct: 0.8  },
  { inci_name: 'Aqua',                    wt_pct: 62.0 },
]

/**
 * Formula dummy untuk constraint check (wajah leave-on).
 * Total harus = 100%.
 */
export const DUMMY_FORMULA_CONSTRAINTS: FormulaLine[] = [
  { inci_name: 'Aqua',                    wt_pct: 72.0 },
  { inci_name: 'Niacinamide',             wt_pct: 5.0  },
  { inci_name: 'Glycerin',                wt_pct: 8.0  },
  { inci_name: 'Centella Asiatica Extract', wt_pct: 3.0 },
  { inci_name: 'Sodium Hyaluronate',      wt_pct: 1.2  },
  { inci_name: 'Phenoxyethanol',          wt_pct: 0.8  },
  { inci_name: 'Carbomer',                wt_pct: 0.5  },
  { inci_name: 'Triethanolamine',         wt_pct: 0.3  },
  { inci_name: 'Disodium EDTA',           wt_pct: 0.1  },
  { inci_name: 'Allantoin',               wt_pct: 0.2  },
  { inci_name: 'Panthenol',               wt_pct: 1.0  },
  { inci_name: 'Tocopheryl Acetate',      wt_pct: 0.5  },
  { inci_name: 'PEG-40 Hydrogenated Castor Oil', wt_pct: 0.5 },
  { inci_name: 'Dimethicone',             wt_pct: 0.9  },
  { inci_name: 'Fragrance',               wt_pct: 1.0  },
  { inci_name: 'Retinol',                 wt_pct: 0.3  }, // sengaja sedikit tinggi — trigger R5 warn
  { inci_name: 'Salicylic Acid',          wt_pct: 2.0  }, // mungkin trigger limit check
  { inci_name: 'Ci 17200',                wt_pct: 0.1  },
  { inci_name: 'Ci 42090',                wt_pct: 0.1  },
  { inci_name: 'Xanthan Gum',             wt_pct: 0.5  },
]

// ---------------------------------------------------------------------------
// Dummy data per head untuk /api-test
// ---------------------------------------------------------------------------

/**
 * Map dari head ID ke formula dummy yang dipakai.
 * H6  → null (butuh SMILES, belum disupport)
 * H7  → null (input transkriptomik, sengaja tidak di-serve)
 * H8  → null (dataset partial, sengaja tidak di-serve)
 * H11 → null (butuh image_b64 yang tidak ada di Cloudeka)
 * H12 → null (laptop only)
 */
export const DUMMY_FORMULA_BY_HEAD: Record<string, FormulaLine[] | null> = {
  H1:  DUMMY_FORMULA_H1,
  H2:  DUMMY_FORMULA_H2,
  H3:  [
    { inci_name: 'Ethylhexyl Methoxycinnamate', wt_pct: 7.5  },
    { inci_name: 'Titanium Dioxide',             wt_pct: 5.0  },
    { inci_name: 'Octocrylene',                  wt_pct: 5.0  },
    { inci_name: 'Butyl Methoxydibenzoylmethane',wt_pct: 3.0  },
    { inci_name: 'Cyclopentasiloxane',           wt_pct: 20.0 },
    { inci_name: 'Dimethicone',                  wt_pct: 5.0  },
    { inci_name: 'Glycerin',                     wt_pct: 5.0  },
    { inci_name: 'Phenoxyethanol',               wt_pct: 1.0  },
    { inci_name: 'Aqua',                         wt_pct: 48.5 },
  ],
  H4:  [
    { inci_name: 'Aqua',                    wt_pct: 60.0 },
    { inci_name: 'Glycerin',                wt_pct: 10.0 },
    { inci_name: 'Niacinamide',             wt_pct: 5.0  },
    { inci_name: 'Sodium Hyaluronate',      wt_pct: 2.0  },
    { inci_name: 'Panthenol',               wt_pct: 1.0  },
    { inci_name: 'Phenoxyethanol',          wt_pct: 1.0  },
    { inci_name: 'Carbomer',                wt_pct: 0.5  },
    { inci_name: 'Triethanolamine',         wt_pct: 0.5  },
    { inci_name: 'Aqua (sisa)',             wt_pct: 20.0 },
  ],
  H5:  [
    { inci_name: 'Sodium Laureth Sulfate',  wt_pct: 1 },
    { inci_name: 'Cocamidopropyl Betaine',  wt_pct: 1 },
    { inci_name: 'Glycerin',                wt_pct: 1 },
    { inci_name: 'Phenoxyethanol',          wt_pct: 1 },
    { inci_name: 'Aqua',                    wt_pct: 1 },
    { inci_name: 'Sodium Chloride',         wt_pct: 1 },
  ],
  H6:  null, // butuh SMILES + suhu — belum ada jalur serving
  H7:  null, // input transkriptomik — sengaja tidak di-serve
  H8:  null, // dataset partial — sengaja tidak di-serve
  H9:  [
    { inci_name: 'Aqua',                    wt_pct: 65.0 },
    { inci_name: 'Niacinamide',             wt_pct: 5.0  },
    { inci_name: 'Glycerin',                wt_pct: 8.0  },
    { inci_name: 'Retinol',                 wt_pct: 0.1  },
    { inci_name: 'Ceramide NP',             wt_pct: 1.0  },
    { inci_name: 'Sodium Hyaluronate',      wt_pct: 1.2  },
    { inci_name: 'Phenoxyethanol',          wt_pct: 0.9  },
    { inci_name: 'Carbomer',                wt_pct: 0.4  },
    { inci_name: 'Triethanolamine',         wt_pct: 0.3  },
    { inci_name: 'Fragrance',               wt_pct: 1.0  },
    { inci_name: 'Aqua (sisa)',             wt_pct: 17.1 },
  ],
  H10: [
    { inci_name: 'Iron Oxides',             wt_pct: 5.0  },
    { inci_name: 'Titanium Dioxide',        wt_pct: 10.0 },
    { inci_name: 'Talc',                    wt_pct: 20.0 },
    { inci_name: 'Mica',                    wt_pct: 15.0 },
    { inci_name: 'Dimethicone',             wt_pct: 5.0  },
    { inci_name: 'Aqua',                    wt_pct: 45.0 },
  ],
  H11: null, // butuh image_b64 — raw archive tidak ada di Cloudeka
  H12: null, // laptop only — tidak jalan di Cloudeka
  H13: [
    { inci_name: 'Aqua',                    wt_pct: 70.0 },
    { inci_name: 'Glycerin',                wt_pct: 8.0  },
    { inci_name: 'Niacinamide',             wt_pct: 5.0  },
    { inci_name: 'Phenoxyethanol',          wt_pct: 1.0  },
    { inci_name: 'Sodium Hyaluronate',      wt_pct: 1.0  },
    { inci_name: 'Carbomer',                wt_pct: 0.5  },
    { inci_name: 'Triethanolamine',         wt_pct: 0.5  },
    { inci_name: 'Aqua (sisa)',             wt_pct: 14.0 },
  ],
}

/** Metadata statis tiap head — untuk UI label dan keterangan */
export const HEAD_META: Record<string, { label: string; description: string; canServe: boolean; reason?: string }> = {
  H1:  { label: 'H1 — Viskositas Shampoo',       description: 'Prediksi viskositas shampoo dari komposisi surfaktan',       canServe: true  },
  H2:  { label: 'H2 — Rheologi Surfaktan',        description: 'Prediksi yield stress/rheologi formula surfaktan',           canServe: true  },
  H3:  { label: 'H3 — SPF Sunscreen',             description: 'Prediksi nilai SPF dari komposisi filter UV',                canServe: true  },
  H4:  { label: 'H4 — (data terbatas)',            description: 'Di bawah floor 40 baris, not_measured by design',           canServe: true  },
  H5:  { label: 'H5 — Product Type Classifier',   description: 'Klasifikasi jenis produk dari komposisi (⚠ recipe cacat)',  canServe: true  },
  H6:  { label: 'H6 — CMC (SMILES)',              description: 'Butuh SMILES + suhu, bukan formula — belum diimplementasi', canServe: false, reason: 'Endpoint belum support SMILES. Selalu 422 NothingMatched.' },
  H7:  { label: 'H7 — Transkriptomik',            description: 'Input transkriptomik — sengaja tidak di-serve',             canServe: false, reason: 'served=False by design. Input transkriptomik, bukan resep.' },
  H8:  { label: 'H8 — (dataset partial)',          description: 'Dataset partial — sengaja tidak di-serve',                  canServe: false, reason: 'served=False by design. Dataset tidak lengkap.' },
  H9:  { label: 'H9 — Skin Concern (vision)',      description: 'Klasifikasi skin concern — dual gate F1 + fairness',       canServe: true  },
  H10: { label: 'H10 — Color Spectral',           description: 'Prediksi warna dari spektrum — available=False',            canServe: true  },
  H11: { label: 'H11 — Visual (vial/jar)',         description: 'Butuh image_b64 — archive gambar tidak ada di Cloudeka',   canServe: false, reason: 'Raw image archive (358MB figshare) tidak ada di instance. Butuh upload manual dulu.' },
  H12: { label: 'H12 — (laptop only)',             description: 'Tidak jalan di Cloudeka by design',                        canServe: false, reason: 'Hanya berjalan di laptop lokal. Output private sampai Round 16.' },
  H13: { label: 'H13 — Generic (on-demand)',       description: 'Train on-the-spot per request — tidak punya model statis', canServe: true  },
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

/** Buat AbortController dengan timeout */
function withTimeout(ms: number): AbortController {
  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(), ms)
  return ctrl
}

/** GET /v1/health */
export async function fetchHealth(): Promise<HealthResponse> {
  const ctrl = withTimeout(TIMEOUT_MS)
  const res = await fetch(`${CLIENT_BASE}/v1/health`, {
    signal: ctrl.signal,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Health check gagal: ${res.status}`)
  return res.json() as Promise<HealthResponse>
}

/** GET /v1/heads */
export async function fetchHeads(): Promise<HeadsResponse> {
  const ctrl = withTimeout(TIMEOUT_MS)
  const res = await fetch(`${CLIENT_BASE}/v1/heads`, {
    signal: ctrl.signal,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Fetch heads gagal: ${res.status}`)
  return res.json() as Promise<HeadsResponse>
}

/** GET /v1/ingredients */
export async function fetchIngredients(): Promise<unknown> {
  const ctrl = withTimeout(TIMEOUT_MS)
  const res = await fetch(`${CLIENT_BASE}/v1/ingredients`, {
    signal: ctrl.signal,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Fetch ingredients gagal: ${res.status}`)
  return res.json()
}

/** POST /v1/predict/{headId} */
export async function fetchPredict(
  headId: string,
  body: PredictRequest,
): Promise<PredictionResult> {
  const ctrl = withTimeout(TIMEOUT_MS)
  const res = await fetch(`${CLIENT_BASE}/v1/predict/${headId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formula: body.formula,
      conditions: body.conditions ?? {},
      product_type: body.product_type ?? 'face_leave_on',
      image_b64: body.image_b64 ?? null,
    }),
    signal: ctrl.signal,
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Partial<ApiError>
    throw new Error(err.detail ?? `Predict ${headId} gagal: ${res.status}`)
  }
  return res.json() as Promise<PredictionResult>
}

/** POST /v1/constraints/check */
export async function fetchConstraintsCheck(
  body: ConstraintCheckRequest,
): Promise<ConstraintCheckResponse> {
  const ctrl = withTimeout(TIMEOUT_MS)
  const res = await fetch(`${CLIENT_BASE}/v1/constraints/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formula: body.formula,
      product_type: body.product_type ?? 'face_leave_on',
    }),
    signal: ctrl.signal,
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Partial<ApiError>
    throw new Error(err.detail ?? `Constraints check gagal: ${res.status}`)
  }
  return res.json() as Promise<ConstraintCheckResponse>
}

/** POST /v1/explain/{headId} */
export async function fetchExplain(headId: string, body: PredictRequest): Promise<unknown> {
  const ctrl = withTimeout(TIMEOUT_MS)
  const res = await fetch(`${CLIENT_BASE}/v1/explain/${headId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctrl.signal,
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Partial<ApiError>
    throw new Error(err.detail ?? `Explain ${headId} gagal: ${res.status}`)
  }
  return res.json()
}

/** POST /v1/cost */
export async function fetchCost(body: PredictRequest): Promise<unknown> {
  const ctrl = withTimeout(TIMEOUT_MS)
  const res = await fetch(`${CLIENT_BASE}/v1/cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctrl.signal,
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Partial<ApiError>
    throw new Error(err.detail ?? `Cost gagal: ${res.status}`)
  }
  return res.json()
}

/** POST /v1/claims/check */
export async function fetchClaimsCheck(body: unknown): Promise<unknown> {
  const ctrl = withTimeout(TIMEOUT_MS)
  const res = await fetch(`${CLIENT_BASE}/v1/claims/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctrl.signal,
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Partial<ApiError>
    throw new Error(err.detail ?? `Claims check gagal: ${res.status}`)
  }
  return res.json()
}
