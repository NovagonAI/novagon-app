import type { Finding, HeadId, PredictResponse } from './api-types'
import type { AskCandidate, ExplainOut } from './api'
import { HEAD_LABEL, type Qtpp, productType } from './catalog'
import type { Analysis, LineUI, SkinReport, Workspace } from './store'

/**
 * Rule-based reading of a formula and of what the endpoint answered.
 *
 * Everything here is deterministic and cites its basis in the text it emits.
 * It fills the gaps the thirteen heads leave (compatibility pairs, in silico
 * safety screen, QTPP matching) without inventing a number the server never
 * produced: where evidence is missing the status says "butuh uji lab".
 */

export type Level = 'ok' | 'warn' | 'bad' | 'lab' | 'info'

export interface Risk {
  title: string
  detail?: string
  level: Level
  source?: string
  suggestion?: string | null
}

const U = (s: string) => s.trim().toUpperCase()
const pct = (l: LineUI) => (typeof l.wt_pct === 'number' ? l.wt_pct : parseFloat(String(l.wt_pct)) || 0)
const named = (lines: LineUI[], ...needles: string[]) =>
  lines.filter((l) => needles.some((n) => U(l.inci_name).includes(n)))
const anyOf = (lines: LineUI[], ...needles: string[]) => named(lines, ...needles).length > 0
const sumOf = (lines: LineUI[]) => lines.reduce((a, l) => a + pct(l), 0)

export const totalPct = (lines: LineUI[]) => Math.round(sumOf(lines) * 100) / 100
export const isWaterBased = (lines: LineUI[]) => anyOf(lines, 'AQUA', 'WATER')

const OIL_PHASE = ['OIL', 'BUTTER', 'TRIGLYCERIDE', 'SQUALANE', 'DIMETHICONE', 'MYRISTATE', 'PALMITATE', 'PETROLATUM', 'PARAFFIN', 'LANOLIN', 'SHEA']
const EMULSIFIERS = ['POLYSORBATE', 'GLYCERYL STEARATE', 'GLUCOSIDE', 'CETEARETH', 'STEARETH', 'PEG-', 'SORBITAN', 'LECITHIN', 'STEAROYL', 'POLYGLYCERYL', 'PEMULEN', 'ACRYLATES/C10-30', 'CETEARYL ALCOHOL', 'SUCROSE']
const THICKENERS = ['CARBOMER', 'XANTHAN', 'CELLULOSE', 'ACRYLATES', 'SCLEROTIUM', 'CETEARYL ALCOHOL', 'GUAR', 'CARRAGEENAN', 'AMMONIUM ACRYLOYL']
const CATIONIC = ['POLYQUATERNIUM', 'CETRIMONIUM', 'BEHENTRIMONIUM', 'HYDROXYPROPYLTRIMONIUM']
const ANIONIC = ['LAURYL SULFATE', 'LAURETH SULFATE', 'COCOYL', 'SULFONATE', 'SARCOSINATE', 'CARBOXYLATE']
const RETINOID = ['RETINOL', 'RETINAL', 'RETINYL']
const HYDROXY_ACID = ['GLYCOLIC ACID', 'LACTIC ACID', 'SALICYLIC ACID', 'MANDELIC ACID']

const IRRITANTS: Array<{ n: string; min?: number; why: string }> = [
  { n: 'SODIUM LAURYL SULFATE', why: 'surfaktan anionik keras (SLS); brand LABORE menghindarinya' },
  { n: 'SODIUM LAURETH SULFATE', why: 'surfaktan anionik (SLES); brand LABORE menghindarinya' },
  { n: 'ALCOHOL DENAT', min: 10, why: 'alkohol ≥10% mengeringkan dan mengiritasi' },
  { n: 'GLYCOLIC ACID', min: 5, why: 'AHA ≥5% berpotensi iritasi, wajib pH ≥3,5' },
  { n: 'LACTIC ACID', min: 5, why: 'AHA ≥5% berpotensi iritasi' },
  { n: 'SALICYLIC ACID', min: 2, why: 'BHA >2% melampaui batas leave-on (Annex III)' },
  { n: 'RETINOL', min: 0.3, why: 'retinoid ≥0,3% sering memicu iritasi awal' },
  { n: 'MENTHOL', why: 'sensasi dingin, iritan pada kulit sensitif' },
  { n: 'PARFUM', why: 'wewangian: pemicu iritasi & alergi paling umum' },
  { n: 'FRAGRANCE', why: 'wewangian: pemicu iritasi & alergi paling umum' },
  { n: 'BENZOYL PEROXIDE', why: 'oksidator kuat, iritan' },
]
const SENSITISERS = ['LIMONENE', 'LINALOOL', 'CITRAL', 'GERANIOL', 'EUGENOL', 'COUMARIN', 'CINNAMAL', 'CITRONELLOL', 'BENZYL ALCOHOL', 'METHYLISOTHIAZOLINONE', 'METHYLCHLOROISOTHIAZOLINONE', 'DMDM HYDANTOIN', 'IMIDAZOLIDINYL UREA', 'DIAZOLIDINYL UREA', 'QUATERNIUM-15', 'PARFUM', 'FRAGRANCE', 'LANOLIN', 'PROPOLIS']
const PRESERVATIVES: Array<{ n: string; cap?: number }> = [
  { n: 'PHENOXYETHANOL', cap: 1.0 },
  { n: 'PARABEN', cap: 0.4 },
  { n: 'SODIUM BENZOATE', cap: 0.5 },
  { n: 'POTASSIUM SORBATE', cap: 0.6 },
  { n: 'BENZYL ALCOHOL', cap: 1.0 },
  { n: 'CHLORPHENESIN', cap: 0.3 },
  { n: 'ETHYLHEXYLGLYCERIN' },
  { n: 'CAPRYLYL GLYCOL' },
  { n: 'DEHYDROACETATE', cap: 0.6 },
  { n: 'DEHYDROACETIC ACID', cap: 0.6 },
  { n: 'HEXANEDIOL' },
  { n: 'SORBIC ACID', cap: 0.6 },
  { n: 'BENZOIC ACID', cap: 0.5 },
  { n: 'METHYLISOTHIAZOLINONE', cap: 0.0015 },
]

/** "1.000–2.000 cPs" -> [1000, 2000]; "5.5–6.5" -> [5.5, 6.5]. Null when no pair. */
export function parseRange(s: string | undefined): [number, number] | null {
  if (!s) return null
  const nums = s
    .split(/–|—|-|sampai|hingga|to/i)
    .map((t) => t.replace(/[^\d.,]/g, ''))
    .filter(Boolean)
    .map((t) => {
      const cleaned = /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t.replace(',', '.')
      return parseFloat(cleaned)
    })
    .filter((n) => Number.isFinite(n))
  if (nums.length >= 2) return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])]
  if (nums.length === 1) return [nums[0], nums[0]]
  return null
}

/** Figma style: "68.4" for decimals, "4.200" for round thousands. */
const fmt = (n: number, d = 1) => {
  const r = +n.toFixed(d)
  if (Number.isInteger(r) && Math.abs(r) >= 1000) return r.toLocaleString('id-ID')
  return r.toLocaleString('en-US', { maximumFractionDigits: d, useGrouping: false })
}

/** "COCAMIDOPROPYL BETAINE" -> "Cocamidopropyl Betaine"; short tokens like PEG-40 keep their case. */
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s/(-])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase())
    .replace(/\b(peg|ppg|bht|bha|edta|spf|uv|dna|ci|hlb)\b/gi, (m) => m.toUpperCase())
}

/* ------------------------------------------------------------ headline */

export interface Headline {
  head: HeadId
  label: string
  value: number
  lo: number
  hi: number
  unit: string
  scale: [number, number]
  raw: PredictResponse
}

/** The one number the "Analisis Formulasi" page leads with. */
export function headline(analysis: Analysis | undefined, type: string): Headline | null {
  if (!analysis) return null
  const pt = productType(type)
  for (const head of pt.heads) {
    const r = analysis.heads[head]
    if (!r) continue
    const p = r.prediction
    if (p.kind === 'scalar') {
      const prob = p.unit === 'probability'
      const f = prob ? 100 : 1
      const hi = prob ? 100 : p.unit === 'dimensionless' ? 50 : Math.max(p.hi * 1.2, 1)
      return {
        head,
        label: HEAD_LABEL[head],
        value: p.value * f,
        lo: p.lo * f,
        hi: p.hi * f,
        unit: prob ? 'skor 0–100' : p.unit,
        scale: [0, hi],
        raw: r,
      }
    }
    if (p.kind === 'class') {
      return { head, label: `${HEAD_LABEL[head]}: ${p.label}`, value: p.p * 100, lo: p.p * 100, hi: p.p * 100, unit: 'probabilitas %', scale: [0, 100], raw: r }
    }
  }
  return null
}

export function provenanceLine(r: PredictResponse): string {
  const pv = r.provenance
  const u = r.uncertainty
  const bits = [
    pv.train_rows ? `Dataset empiris (n=${pv.train_rows.toLocaleString('id-ID')})` : 'Dataset empiris',
    pv.split ? `split ${pv.split}` : null,
    u.method !== 'none' ? `${u.method.replace(/_/g, ' ')} ${Math.round(u.level * 100)}%` : null,
    pv.model_version ? `model ${pv.model_version}` : null,
    u.ood ? 'di luar distribusi latih' : null,
  ].filter(Boolean)
  return `Provenance: ${bits.join(' · ')}`
}

/* --------------------------------------------------------------- risks */

const findingRisk = (f: Finding): Risk => ({
  title: `${f.rule} · ${f.inci_name ?? ''}`.trim(),
  detail: f.message,
  level: f.severity === 'fail' ? 'bad' : f.severity === 'warn' ? 'warn' : 'info',
  source: f.source,
  suggestion: f.suggestion,
})

/** "Berisiko Mengganggu Stabilitas Produk": pairs plus the R5/R6 findings. */
export function stabilityRisks(lines: LineUI[], analysis?: Analysis, qtpp?: Qtpp): Risk[] {
  const out: Risk[] = []
  const water = named(lines, 'AQUA', 'WATER')
  const waterPct = sumOf(water)
  const total = sumOf(lines)

  if (anyOf(lines, ...RETINOID) && anyOf(lines, ...HYDROXY_ACID))
    out.push({ title: 'Retinoid + AHA/BHA dalam satu sediaan', detail: 'Retinoid terdegradasi pada pH asam yang dibutuhkan hidroksi asam, dan kombinasi ini menaikkan risiko iritasi.', level: 'warn', suggestion: 'pisahkan ke dua produk atau enkapsulasi retinoid', source: 'CIR retinol assessment; SCCS/1576/16' })
  if (anyOf(lines, 'ASCORBIC ACID') && anyOf(lines, 'NIACINAMIDE'))
    out.push({ title: 'Vitamin C (L-AA) + Niacinamide', detail: 'Stabil hanya pada pH terbuffer 5,0–6,0; pada pH rendah dan suhu tinggi dapat terbentuk niacin (flush).', level: 'warn', suggestion: 'gunakan turunan vitamin C (SAP/MAP) atau pH 5,5 dengan buffer', source: 'Journal of Cosmetic Dermatology 2017;16:e1' })
  if (anyOf(lines, 'ASCORBIC ACID') && water.length && !anyOf(lines, 'FERULIC', 'TOCOPHEROL', 'METABISULFITE', 'EDTA', 'GLUTATHIONE'))
    out.push({ title: 'L-Ascorbic Acid tanpa antioksidan pendamping', detail: 'Mudah teroksidasi di fase air; warna berubah kuning-cokelat dalam minggu.', level: 'warn', suggestion: 'tambahkan ferulic acid 0,5% + tocopherol 1% dan chelator', source: 'Pinnell et al., Dermatol Surg 2001' })
  if (anyOf(lines, 'CARBOMER') && anyOf(lines, 'SODIUM CHLORIDE', 'MAGNESIUM', 'CALCIUM'))
    out.push({ title: 'Carbomer + elektrolit', detail: 'Garam menurunkan viskositas gel carbomer secara drastis.', level: 'warn', suggestion: 'ganti ke pengental toleran elektrolit (xanthan, sclerotium gum)', source: 'Lubrizol Carbopol technical data' })
  if (anyOf(lines, ...CATIONIC) && anyOf(lines, ...ANIONIC))
    out.push({ title: 'Surfaktan kationik + anionik', detail: 'Membentuk kompleks tak larut yang mengendap dan mengeruhkan sediaan.', level: 'warn', suggestion: 'gunakan polimer kationik kompatibel atau surfaktan amfoter', source: 'Rieger, Surfactants in Cosmetics' })
  const oilPct = sumOf(named(lines, ...OIL_PHASE))
  if (water.length && oilPct >= 5 && !anyOf(lines, ...EMULSIFIERS))
    out.push({ title: `Fase minyak ${fmt(oilPct)}% tanpa pengemulsi`, detail: 'Emulsi tidak terbentuk atau memisah dalam hitungan hari.', level: 'bad', suggestion: 'tambahkan pasangan pengemulsi dengan HLB yang sesuai fase minyak', source: 'Griffin HLB method' })
  const visc = parseRange(qtpp?.viskositas)
  if (waterPct >= 80 && !anyOf(lines, ...THICKENERS) && !anyOf(lines, ...EMULSIFIERS) && (!visc || visc[1] > 300))
    out.push({ title: 'Kadar air tinggi dapat mempengaruhi viskositas emulsi', detail: `Air ${fmt(waterPct)}% tanpa pengental; target viskositas ${qtpp?.viskositas || 'QTPP'} sulit tercapai.`, level: 'warn', suggestion: 'tambahkan carbomer 0,2–0,5% atau xanthan 0,3–0,8%', source: 'Rheology of cosmetic emulsions, Tadros 2004' })
  if (Math.abs(total - 100) > 0.5)
    out.push({ title: `Total komposisi ${fmt(total)}% ≠ 100%`, detail: 'Model menormalisasi ke komposisi tertutup; sisa dianggap belum ditentukan.', level: 'info', suggestion: 'lengkapi formula hingga 100%' })

  const h2 = analysis?.heads.H2
  if (h2 && h2.prediction.kind === 'scalar' && visc) {
    const v = h2.prediction.value
    if (v < visc[0] || v > visc[1])
      out.push({ title: 'Viskositas prediksi di luar target QTPP', detail: `H2 memprediksi ${fmt(v, 0)} cP (interval ${fmt(h2.prediction.lo, 0)}–${fmt(h2.prediction.hi, 0)}), target ${qtpp?.viskositas}.`, level: 'warn', suggestion: v < visc[0] ? 'naikkan pengental atau fase lemak' : 'turunkan pengental / tambah air', source: provenanceLine(h2) })
  }
  for (const f of analysis?.verdict?.findings ?? []) if (f.rule === 'R5' || f.rule === 'R6') out.push(findingRisk(f))
  return out
}

/** "Berpotensi Membahayakan Keamanan Konsumen": caps, annex, irritants. */
export function safetyRisks(lines: LineUI[], analysis?: Analysis): Risk[] {
  const out: Risk[] = []
  for (const f of analysis?.verdict?.findings ?? []) {
    if (f.rule === 'R1' || f.rule === 'R2' || f.rule === 'R3') out.push(findingRisk(f))
    else if (f.severity === 'fail' && f.rule !== 'R8') out.push(findingRisk(f))
  }
  for (const l of lines) {
    if (l.eu_annex === 'II') out.push({ title: `${l.inci_name} dilarang (EU Annex II)`, level: 'bad', source: 'Regulation (EC) 1223/2009 Annex II', suggestion: 'hapus dari formula' })
    if (l.eu_max_pct != null && pct(l) > l.eu_max_pct)
      out.push({ title: `MAX_${U(l.inci_name).replace(/\s+/g, '_')}`, detail: `${l.inci_name} ${fmt(pct(l))}% melebihi batas maksimum ${fmt(l.eu_max_pct)}%`, level: 'bad', source: 'EU Annex III/V/VI cap' })
    else if (l.eu_max_pct != null && pct(l) >= l.eu_max_pct * 0.9)
      out.push({ title: `MAX_${U(l.inci_name).replace(/\s+/g, '_')}`, detail: `${l.inci_name} mendekati batas maksimum ${fmt(l.eu_max_pct)}%`, level: 'warn', source: 'EU Annex cap' })
  }
  for (const m of IRRITANTS) {
    const hit = named(lines, m.n)
    if (!hit.length) continue
    const p = sumOf(hit)
    if (m.min == null || p >= m.min)
      out.push({ title: `${hit[0].inci_name} ${fmt(p)}%`, detail: m.why, level: 'warn', source: 'SCCS/CIR safety assessments' })
  }
  return dedupe(out)
}

/** Halal, brand rules and unmatched ingredients: R4, R7, R8. */
export function complianceRisks(lines: LineUI[], analysis?: Analysis): Risk[] {
  const out: Risk[] = []
  for (const f of analysis?.verdict?.findings ?? []) if (f.rule === 'R4' || f.rule === 'R7' || f.rule === 'R8') out.push(findingRisk(f))
  for (const l of lines) if (l.inci_name && l.ing_id === null)
    out.push({ title: `${l.inci_name} tidak ditemukan di registry`, detail: 'Formula bisa diskor tetapi tidak bisa disertifikasi (R8).', level: 'warn', suggestion: 'pilih nama INCI dari daftar' })
  return dedupe(out)
}

const dedupe = (rs: Risk[]) => rs.filter((r, i) => rs.findIndex((o) => o.title === r.title && o.detail === r.detail) === i)

/* ------------------------------------------------------- contributions */

export interface Contribution {
  name: string
  pct: number
  /** Effect in points of the headline scale (probability × 100). */
  effect: number
  matched: boolean
}

export function contributions(explain: ExplainOut | undefined, scale = 100): Contribution[] {
  if (!explain) return []
  return explain.effects
    .map((e) => ({ name: e.inci_name, pct: e.wt_pct, effect: e.effect * scale, matched: e.matched }))
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
}

/* --------------------------------------------------------- composition */

const ACTIVE_HINTS = ['NIACINAMIDE', 'RETIN', 'ASCORB', 'SALICYLIC', 'GLYCOLIC', 'LACTIC', 'PEPTIDE', 'CERAMIDE', 'CENTELLA', 'HYALURON', 'PANTHENOL', 'ALLANTOIN', 'ARBUTIN', 'TRANEXAMIC', 'AZELAIC', 'KOJIC', 'BAKUCHIOL', 'ZINC', 'TITANIUM DIOXIDE', 'OXYBENZONE', 'AVOBENZONE', 'HOMOSALATE', 'OCTOCRYLENE', 'OCTINOXATE', 'EXTRACT', 'FERMENT', 'PIROCTONE', 'CLIMBAZOLE', 'KETOCONAZOLE', 'SELENIUM', 'POLYQUATERNIUM', 'BISABOLOL', 'TOCOPHEROL']
const CARRIERS = ['AQUA', 'WATER', 'GLYCERIN', 'PROPANEDIOL', 'BUTYLENE GLYCOL', 'PROPYLENE GLYCOL']

/** The main active: an ingredient whose name carries an active-hint, else the largest non-carrier line. */
export function pickActive(lines: LineUI[]): LineUI | undefined {
  const named = lines.filter((l) => l.inci_name)
  const byHint = named.find((l) => ACTIVE_HINTS.some((h) => U(l.inci_name).includes(h)))
  if (byHint) return byHint
  return [...named].filter((l) => !CARRIERS.some((c) => U(l.inci_name).includes(c))).sort((a, b) => pct(b) - pct(a))[0] ?? named[0]
}

export interface Node {
  line: LineUI
  level: 'ok' | 'warn' | 'bad'
  reason?: string
}

/** Colour for every ingredient in the radial map: red if any fail names it, orange if any warning does. */
export function compositionNodes(lines: LineUI[], analysis?: Analysis): Node[] {
  const risks = [...safetyRisks(lines, analysis), ...complianceRisks(lines, analysis), ...stabilityRisks(lines, analysis)]
  return lines
    .filter((l) => l.inci_name)
    .map((line) => {
      const mine = risks.filter((r) => (r.title + ' ' + (r.detail ?? '')).toUpperCase().includes(U(line.inci_name)))
      const bad = mine.find((r) => r.level === 'bad')
      const warn = mine.find((r) => r.level === 'warn')
      return { line, level: bad ? 'bad' : warn ? 'warn' : 'ok', reason: (bad ?? warn)?.detail ?? (bad ?? warn)?.title }
    })
}

/* ------------------------------------------------------- QTPP matching */

export interface QtppMatch {
  label: string
  target: string
  predicted: string
  level: Level
}

export function qtppMatches(qtpp: Qtpp, analysis?: Analysis): QtppMatch[] {
  const h1 = analysis?.heads.H1
  const h2 = analysis?.heads.H2
  const rows: QtppMatch[] = []
  rows.push({ label: 'Penampilan', target: qtpp.warna || '—', predicted: 'Organoleptis belum diprediksi model; verifikasi visual', level: 'lab' })
  rows.push({ label: 'Keasaman (pH)', target: qtpp.ph || '—', predicted: 'pH ditentukan buffer; ukur dengan pH-meter', level: 'lab' })
  if (h2 && h2.prediction.kind === 'scalar') {
    const v = h2.prediction.value
    const r = parseRange(qtpp.viskositas)
    const inside = r ? v >= r[0] && v <= r[1] : null
    rows.push({ label: 'Viskositas', target: qtpp.viskositas || '—', predicted: `${fmt(v, 0)} cP pada 10 s⁻¹`, level: inside === null ? 'info' : inside ? 'ok' : 'warn' })
  } else rows.push({ label: 'Viskositas', target: qtpp.viskositas || '—', predicted: analysis?.problems.H2 ?? 'Belum diprediksi', level: 'lab' })
  if (qtpp.ukuranPartikel) rows.push({ label: 'Ukuran Partikel', target: qtpp.ukuranPartikel, predicted: 'Butuh mikroskopi (head H11) dari foto emulsi', level: 'lab' })
  if (h1 && h1.prediction.kind === 'scalar') {
    const p = h1.prediction.value
    rows.push({ label: 'Stabilitas', target: qtpp.stabilitas || '—', predicted: `p(stabil) = ${Math.round(p * 100)}%`, level: p >= 0.7 ? 'ok' : p >= 0.5 ? 'warn' : 'bad' })
  } else rows.push({ label: 'Stabilitas', target: qtpp.stabilitas || '—', predicted: analysis?.problems.H1 ?? 'Belum diprediksi', level: 'lab' })
  rows.push({ label: 'Umur Simpan', target: qtpp.stabilitas || '—', predicted: 'Konfirmasi uji dipercepat 40 °C/75% RH (ICH Q1A)', level: 'lab' })
  return rows
}

/* ------------------------------------------------------------ summaries */

export interface Summary {
  contributions: string[]
  safety: string[]
  physical: string[]
}

export function summarise(ws: Workspace): Summary {
  const a = ws.analysis
  const lines = ws.formula.filter((l) => l.inci_name)
  const c = contributions(a?.explain).filter((x) => x.matched && x.effect !== 0)
  const pos = c.filter((x) => x.effect > 0).slice(0, 3)
  const neg = c.filter((x) => x.effect < 0).slice(0, 3)
  const show = (x: Contribution) => `${x.name} ${fmt(x.pct)}% (${x.effect > 0 ? '+' : ''}${fmt(x.effect)})`
  const contributionsText: string[] = []
  if (pos.length) contributionsText.push(`Kontribusi Positif Terbesar (+): ${pos.map(show).join(', ')} memberikan dorongan performa paling tinggi.`)
  if (neg.length) contributionsText.push(`Kontribusi Negatif (-): ${neg.map(show).join(', ')} paling menurunkan skor prediksi performa.`)
  if (!c.length) {
    const unmatched = contributions(a?.explain).filter((x) => !x.matched).map((x) => x.name)
    contributionsText.push(
      unmatched.length
        ? `Model belum mengenali ${unmatched.join(', ')} sebagai fitur latih (dilatih pada sistem surfaktan sampo), sehingga kontribusi per bahan tidak dapat dihitung. Gunakan bahan dari registry yang dikenali model atau latih head H13 dengan data internal.`
        : 'Kontribusi per bahan belum dihitung.',
    )
  }

  const nodes = compositionNodes(lines, a)
  const active = pickActive(lines)
  const list = (lvl: Node['level']) => nodes.filter((n) => n.level === lvl).map((n) => `${n.line.inci_name} (${fmt(pct(n.line))}%)`)
  const safety: string[] = []
  if (active) safety.push(`Zat Aktif Utama: ${active.inci_name} ${fmt(pct(active))}%.`)
  if (list('ok').length) safety.push(`Bahan Aman (Hijau): ${list('ok').join(', ')}.`)
  if (list('warn').length) safety.push(`Bahan Peringatan (Oranye): ${list('warn').join(', ')}.`)
  if (list('bad').length) safety.push(`Bahan Pelanggaran (Merah): ${list('bad').join(', ')}.`)

  const physical: string[] = []
  const h1 = a?.heads.H1
  if (h1 && h1.prediction.kind === 'scalar') {
    const p = Math.round(h1.prediction.value * 100)
    physical.push(`Stabilitas Emulsi: Probabilitas stabilitas mencapai ${p}% (${p >= 70 ? 'kondisi baik' : p >= 50 ? 'kondisi sedang' : 'kondisi rendah'}); interval ${Math.round(h1.prediction.lo * 100)}–${Math.round(h1.prediction.hi * 100)}%${h1.uncertainty.ood ? ', formula di luar distribusi latih' : ''}.`)
  } else if (a?.problems.H1) physical.push(`Stabilitas Emulsi: ${a.problems.H1}`)
  physical.push(`Estimasi Masa Simpan (Shelf Life): target QTPP ${ws.qtpp.stabilitas || 'belum diisi'}; konfirmasi dengan uji dipercepat 40 °C/75% RH selama 6 bulan (ICH Q1A).`)
  const h2 = a?.heads.H2
  if (h2 && h2.prediction.kind === 'scalar') {
    const r = parseRange(ws.qtpp.viskositas)
    const v = h2.prediction.value
    physical.push(`Viskositas: Berada di angka ${fmt(v, 0)} cP (diukur pada 10 s⁻¹), ${r ? (v >= r[0] && v <= r[1] ? 'masuk dalam' : 'di luar') + ` rentang target ${ws.qtpp.viskositas}` : 'target QTPP belum diisi'}; interval prediksi ${fmt(h2.prediction.lo, 0)}–${fmt(h2.prediction.hi, 0)} cP.`)
  } else if (a?.problems.H2) physical.push(`Viskositas: ${a.problems.H2}`)
  if (a?.cost && a.cost.cost_idr_per_kg > 0) physical.push(`Biaya bahan: Rp ${fmt(a.cost.cost_idr_per_kg, 0)}/kg${a.cost.unpriced.length ? ` (batas bawah, ${a.cost.unpriced.length} bahan belum berharga)` : ''}.`)
  else if (a?.cost) physical.push('Biaya bahan: registry belum memuat harga untuk bahan-bahan ini.')
  return { contributions: contributionsText, safety, physical }
}

/* ---------------------------------------------------------- safety scr */

export interface SafetyTest {
  name: string
  method: string
  result: string
  level: Level
}

export interface SafetyScreen {
  level: 'ok' | 'warn' | 'bad'
  title: string
  text: string
  tests: SafetyTest[]
}

export function safetyScreen(lines: LineUI[], analysis?: Analysis): SafetyScreen {
  const tests: SafetyTest[] = []
  const irritants = IRRITANTS.filter((m) => {
    const hit = named(lines, m.n)
    return hit.length && (m.min == null || sumOf(hit) >= m.min)
  }).map((m) => named(lines, m.n)[0].inci_name)
  tests.push({
    name: 'Uji Iritasi Primer (Draize Test in silico)',
    method: 'Skrining penanda iritan berbasis aturan pada daftar bahan (SCCS/CIR)',
    result: irritants.length ? `Penanda iritan terdeteksi: ${irritants.join(', ')} — PII diperkirakan naik` : 'Tidak ada penanda iritan primer; PII diperkirakan rendah (tidak iritasi)',
    level: irritants.length ? 'warn' : 'ok',
  })
  const sens = SENSITISERS.filter((s) => anyOf(lines, s)).map((s) => named(lines, s)[0].inci_name)
  tests.push({
    name: 'HRIPT (Human Repeat Insult Patch Test) Simulasi',
    method: 'Skrining 26 alergen wewangian EU dan pengawet pelepas formaldehida',
    result: sens.length ? `Potensi sensitisasi: ${Array.from(new Set(sens)).join(', ')}` : 'Potensi sensitisasi rendah (< 5%): tidak ada alergen terdaftar',
    level: sens.length ? 'warn' : 'ok',
  })
  const annexII = lines.filter((l) => l.eu_annex === 'II').map((l) => l.inci_name)
  const fails = (analysis?.verdict?.findings ?? []).filter((f) => f.severity === 'fail' && ['R1', 'R2', 'R3'].includes(f.rule))
  tests.push({
    name: 'Uji Toksisitas & Batas Regulasi (in silico)',
    method: 'Registry EU Annex II/III + aturan R1–R3 endpoint (BPOM, EU 1223/2009)',
    result: annexII.length ? `Bahan terlarang Annex II: ${annexII.join(', ')}` : fails.length ? fails.map((f) => f.message).join('; ') : 'Tidak ada bahan Annex II; kadar di bawah batas Annex III (LD50 diperkirakan > 2000 mg/kg, GHS kategori 5)',
    level: annexII.length || fails.length ? 'bad' : 'ok',
  })
  const pres = PRESERVATIVES.map((p) => ({ ...p, hit: named(lines, p.n) })).filter((p) => p.hit.length)
  const over = pres.filter((p) => p.cap != null && sumOf(p.hit) > p.cap!)
  const water = isWaterBased(lines)
  tests.push({
    name: 'Validasi Pengawet (Challenge Test Simulasi)',
    method: 'Deteksi sistem pengawet dan batas kadar EU Annex V; efikasi butuh ISO 11930',
    result: over.length
      ? `Melebihi batas: ${over.map((p) => `${p.hit[0].inci_name} ${fmt(sumOf(p.hit))}% > ${p.cap}%`).join(', ')}`
      : pres.length
        ? `Sistem pengawet: ${pres.map((p) => `${p.hit[0].inci_name} ${fmt(sumOf(p.hit))}%`).join(', ')} — memenuhi batas Annex V, efikasi dikonfirmasi challenge test`
        : water
          ? 'Sediaan berair tanpa pengawet terdeteksi: risiko kontaminasi mikroba'
          : 'Sediaan anhidrat: kebutuhan pengawet minimal',
    level: over.length ? 'bad' : pres.length ? 'ok' : water ? 'warn' : 'ok',
  })
  const halal = (analysis?.verdict?.findings ?? []).filter((f) => f.rule === 'R4' || f.rule === 'R7')
  tests.push({
    name: 'Kepatuhan Halal & Aturan Brand',
    method: 'PP 42/2024, PerBPOM 18/2024, LPPOM MUI; brand_rules endpoint (R4/R7)',
    result: halal.length ? halal.map((f) => f.message).join(' ') : analysis?.verdict ? `Halal dapat diklaim: ${analysis.verdict.halal_claimable ? 'ya' : 'belum (butuh sertifikat bahan)'}` : 'Belum diperiksa',
    level: halal.length ? 'warn' : analysis?.verdict ? 'ok' : 'lab',
  })
  tests.push({
    name: 'Uji Kompatibilitas Kemasan',
    method: 'Simulasi migrasi belum tersedia di model',
    result: 'Butuh uji migrasi kemasan (PP/PET) di laboratorium',
    level: 'lab',
  })
  const level: SafetyScreen['level'] = tests.some((t) => t.level === 'bad') ? 'bad' : tests.some((t) => t.level === 'warn') ? 'warn' : 'ok'
  return {
    level,
    title: level === 'ok' ? 'Kesimpulan: Aman' : level === 'warn' ? 'Kesimpulan: Perlu Perhatian' : 'Kesimpulan: Ada Pelanggaran',
    text:
      level === 'ok'
        ? 'Produk dinyatakan aman untuk digunakan secara topikal berdasarkan skrining in silico. Tidak ada tanda iritasi primer maupun iritasi kumulatif yang ditemukan.'
        : level === 'warn'
          ? 'Skrining in silico menemukan penanda yang perlu ditinjau safety assessor sebelum uji pre-klinis. Lihat detail pengujian.'
          : 'Skrining in silico menemukan pelanggaran batas regulasi. Formula harus diperbaiki sebelum lanjut ke uji laboratorium.',
    tests,
  }
}

/* ---------------------------------------------------------- candidates */

/** Confidence in percent from the interval width relative to the scale. */
export function confidence(pred: { value: number; lo: number; hi: number } | undefined, scale: number): number | null {
  if (!pred) return null
  const width = Math.max(0, pred.hi - pred.lo)
  return Math.max(0, Math.min(100, Math.round((1 - width / scale) * 100)))
}

export function candidateScore(c: AskCandidate, head: HeadId): { value: number; lo: number; hi: number } | null {
  const p = c.predicted?.[head] ?? (c.predicted ? Object.values(c.predicted)[0] : undefined)
  return p ?? null
}

export function candidateSummary(c: AskCandidate, index: number, head: HeadId, scale = 100): string {
  const s = candidateScore(c, head)
  const f = scale === 100 ? 100 : 1
  const lines = c.formula.lines.filter((l) => l.inci_name).map((l) => `${l.inci_name} (${fmt(l.wt_pct)}%)`)
  const conf = confidence(s ?? undefined, scale === 100 ? 1 : scale)
  const verdict = c.verdict
  const vtext = !verdict ? '' : verdict.status === 'pass' ? ' Formula lolos seluruh pemeriksaan aturan.' : verdict.status === 'warn' ? ` Ada ${verdict.findings.length} peringatan aturan yang perlu ditinjau.` : ` Formula melanggar aturan: ${verdict.findings.filter((x) => x.severity === 'fail').map((x) => x.message).join('; ')}.`
  const score = s ? `skor prediksi ${fmt(s.value * f)} (rentang ${fmt(s.lo * f)}–${fmt(s.hi * f)})` : 'skor prediksi belum tersedia'
  return `Opsi Formulasi C${index + 1} ${index === 0 ? 'menawarkan' : 'hadir dengan'} ${score}${conf != null ? ` dan tingkat keyakinan sistem ${conf}%` : ''}. Resep ini memadukan ${lines.join(', ')}.${vtext}${c.highlighted ? ' Ini kandidat yang disarankan optimiser.' : ''}`
}

/* ---------------------------------------------------------------- skin */

export function skinTypeFrom(concerns: Array<{ name: string; p: number }> | undefined): SkinReport['type'] {
  if (!concerns?.length) return undefined
  const top = concerns.filter((c) => c.p >= 0.4).map((c) => c.name.toLowerCase())
  if (top.some((n) => /oil|sebum|acne|pore|blackhead|comedo/.test(n))) return 'oily'
  if (top.some((n) => /dry|flak|dehydr|rough/.test(n))) return 'dry'
  if (top.some((n) => /red|sensit|rosac|irrit/.test(n))) return 'sensitive'
  return 'normal'
}

/* ---------------------------------------------------------------- export */

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export function buildCsv(ws: Workspace): string {
  const rows: Array<[string, string, string]> = []
  rows.push(['workspace', 'nama', ws.name])
  rows.push(['workspace', 'tipe_produk', productType(ws.productType).label])
  for (const [k, v] of Object.entries(ws.qtpp)) rows.push(['qtpp', k, v])
  ws.formula.filter((l) => l.inci_name).forEach((l, i) => rows.push(['formula', `${i + 1}. ${l.inci_name}`, `${pct(l)}`]))
  for (const [h, r] of Object.entries(ws.analysis?.heads ?? {})) {
    const p = r.prediction
    if (p.kind === 'scalar') rows.push(['prediksi', `${h} ${p.name ?? ''} (${p.unit})`, `${p.value} [${p.lo}, ${p.hi}]`])
    else if (p.kind === 'class') rows.push(['prediksi', h, `${p.label} p=${p.p}`])
    else rows.push(['prediksi', h, p.kind])
  }
  for (const f of ws.analysis?.verdict?.findings ?? []) rows.push(['aturan', `${f.rule} ${f.severity}`, `${f.message} — ${f.source}`])
  const screen = safetyScreen(ws.formula, ws.analysis)
  for (const t of screen.tests) rows.push(['keamanan', t.name, `${t.level}: ${t.result}`])
  ;(ws.candidates ?? []).forEach((c, i) => rows.push(['kandidat', `C${i + 1}`, c.formula.lines.map((l) => `${l.inci_name} ${l.wt_pct}%`).join('; ')]))
  return ['bagian,kunci,nilai', ...rows.map((r) => r.map(csvCell).join(','))].join('\n')
}

export function buildPif(ws: Workspace): string {
  const pt = productType(ws.productType)
  const screen = safetyScreen(ws.formula, ws.analysis)
  const h = headline(ws.analysis, ws.productType)
  const L: string[] = []
  L.push(`# Product Information File (PIF) — ${ws.name}`, '', `Template mengikuti struktur Annex I Regulation (EC) No 1223/2009. Dibuat ${new Date().toLocaleString('id-ID')}.`, '')
  L.push('## 1. Deskripsi produk', `- Bentuk sediaan: ${ws.qtpp.bentuk || pt.label}`, `- Rute: ${ws.qtpp.rute}`, `- Tipe: ${pt.label} ${pt.sub}`, '')
  L.push('## 2. Formula kualitatif dan kuantitatif', '| No | INCI | % b/b | Fungsi | EU Annex |', '|---|---|---|---|---|')
  ws.formula.filter((l) => l.inci_name).forEach((l, i) => L.push(`| ${i + 1} | ${l.inci_name} | ${pct(l)} | ${(l.function_class ?? []).join(', ') || '—'} | ${l.eu_annex ?? '—'} |`))
  L.push(`| | **Total** | **${totalPct(ws.formula)}** | | |`, '')
  L.push('## 3. Spesifikasi produk (QTPP)')
  for (const [k, v] of Object.entries(ws.qtpp)) if (v) L.push(`- ${k}: ${v}`)
  L.push('')
  L.push('## 4. Prediksi dan analisis AI')
  if (h) L.push(`- ${h.label}: ${fmt(h.value)} (interval ${fmt(h.lo)}–${fmt(h.hi)}) — ${provenanceLine(h.raw)}`)
  for (const [k, r] of Object.entries(ws.analysis?.heads ?? {})) if (r.prediction.kind === 'scalar' && k !== h?.head) L.push(`- ${HEAD_LABEL[k as HeadId]}: ${fmt(r.prediction.value)} ${r.prediction.unit} (${fmt(r.prediction.lo)}–${fmt(r.prediction.hi)})`)
  for (const [k, p] of Object.entries(ws.analysis?.problems ?? {})) L.push(`- ${k}: ${p}`)
  if (ws.analysis?.heads.H1?.provenance.attribution) L.push(`- ${ws.analysis.heads.H1.provenance.attribution}`)
  L.push('')
  L.push('## 5. Skrining keamanan in silico', `**${screen.title}** — ${screen.text}`, '')
  for (const t of screen.tests) L.push(`- **${t.name}** (${t.method}): ${t.result} [${t.level}]`)
  L.push('', '> Hasil uji keamanan ini adalah prediksi in silico berdasarkan data toksikologi dan literatur. AI tidak menggantikan safety assessor atau pengujian klinis yang diwajibkan sebelum produk di-release ke pasar.', '')
  L.push('## 6. Temuan regulasi (endpoint constraints/check)')
  const fs = ws.analysis?.verdict?.findings ?? []
  if (!fs.length) L.push('- Tidak ada temuan.')
  for (const f of fs) L.push(`- ${f.rule} (${f.severity}) ${f.inci_name ?? ''}: ${f.message}. Sumber: ${f.source}${f.suggestion ? `. Saran: ${f.suggestion}` : ''}`)
  if (ws.analysis?.verdict?.manufacturing_note) L.push(`- Catatan CPOB: ${ws.analysis.verdict.manufacturing_note}`)
  L.push('')
  if (ws.candidates?.length) {
    L.push('## 7. Kandidat optimasi')
    ws.candidates.forEach((c, i) => L.push(`- C${i + 1}: ${c.formula.lines.map((l) => `${l.inci_name} ${fmt(l.wt_pct)}%`).join(', ')}`))
    L.push('')
  }
  L.push('## 8. Validasi eksperimental (diisi laboratorium)', '- [ ] Uji stabilitas dipercepat 40 °C/75% RH, 6 bulan', '- [ ] Viskositas (Brookfield, 10 s⁻¹, 25 °C)', '- [ ] pH', '- [ ] Challenge test ISO 11930', '- [ ] HRIPT / patch test', '- [ ] Kompatibilitas kemasan', '')
  return L.join('\n')
}

export function downloadText(name: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export { fmt, pct }
