import type { Analysis, LineUI } from './store'
import { pct } from './insight'

/** The six visible effects the hand model can show. */
export type EffectKey = 'cerah' | 'lembap' | 'halus' | 'tenang' | 'lindung' | 'matte'

export const EFFECT_LABEL: Record<EffectKey, string> = {
  cerah: 'Mencerahkan',
  lembap: 'Melembapkan',
  halus: 'Menghaluskan',
  tenang: 'Menenangkan',
  lindung: 'Melindungi dari UV',
  matte: 'Mengontrol minyak',
}

export interface EffectScore {
  key: EffectKey
  label: string
  /** 0 to 1 after the model factor. */
  strength: number
  /** INCI names that drive it, strongest first. */
  drivers: string[]
}

/**
 * Ingredient rules: substring of the upper-cased INCI name (or the whole name
 * when prefixed with =, so BETAINE does not catch cocamidopropyl betaine), the wt% at which
 * the effect saturates (typical use level), and the weight per effect. The
 * numbers are formulator rules of thumb, not model output.
 */
const RULES: Array<{ match: string[]; sat: number; effects: Partial<Record<EffectKey, number>> }> = [
  { match: ['NIACINAMIDE'], sat: 4, effects: { cerah: 1, matte: 0.4, tenang: 0.3 } },
  { match: ['ARBUTIN'], sat: 2, effects: { cerah: 1 } },
  { match: ['TRANEXAMIC'], sat: 3, effects: { cerah: 0.9 } },
  { match: ['KOJIC'], sat: 1, effects: { cerah: 0.8 } },
  { match: ['ASCORBIC', 'ASCORBYL'], sat: 5, effects: { cerah: 0.9 } },
  { match: ['AZELAIC'], sat: 10, effects: { cerah: 0.6, tenang: 0.4, matte: 0.4 } },
  { match: ['GLYCYRRHIZA', 'LICORICE', 'DIPOTASSIUM GLYCYRRHIZATE'], sat: 0.5, effects: { cerah: 0.5, tenang: 0.7 } },
  { match: ['GLYCERIN'], sat: 5, effects: { lembap: 1 } },
  { match: ['HYALURON'], sat: 0.5, effects: { lembap: 1, halus: 0.3 } },
  { match: ['PANTHENOL'], sat: 2, effects: { lembap: 0.8, tenang: 0.5 } },
  { match: ['CERAMIDE'], sat: 0.5, effects: { lembap: 0.7, halus: 0.5 } },
  { match: ['SQUALANE'], sat: 5, effects: { lembap: 0.7, halus: 0.5 } },
  { match: ['BUTYROSPERMUM', 'SHEA'], sat: 5, effects: { lembap: 0.8 } },
  { match: ['UREA'], sat: 5, effects: { lembap: 0.8, halus: 0.5 } },
  { match: ['=BETAINE', 'SODIUM PCA', 'TREHALOSE', 'PROPANEDIOL', 'BUTYLENE GLYCOL'], sat: 3, effects: { lembap: 0.5 } },
  { match: ['ALOE'], sat: 2, effects: { lembap: 0.5, tenang: 0.6 } },
  { match: ['CAPRYLIC/CAPRIC', 'CETEARYL ALCOHOL', 'CETYL ALCOHOL', 'ISOPROPYL', 'DICAPRYLYL'], sat: 4, effects: { lembap: 0.3, halus: 0.3 } },
  { match: ['DIMETHICONE', 'CYCLOPENTASILOXANE'], sat: 3, effects: { halus: 0.8, matte: 0.2 } },
  { match: ['SALICYLIC'], sat: 2, effects: { halus: 0.8, matte: 0.8 } },
  { match: ['GLYCOLIC', 'LACTIC', 'MANDELIC', 'GLUCONOLACTONE'], sat: 8, effects: { halus: 0.9, cerah: 0.4 } },
  { match: ['RETINOL', 'RETINAL', 'RETINYL'], sat: 0.5, effects: { halus: 1, cerah: 0.3 } },
  { match: ['BAKUCHIOL'], sat: 1, effects: { halus: 0.8, tenang: 0.3 } },
  { match: ['ALLANTOIN'], sat: 0.5, effects: { tenang: 0.9 } },
  { match: ['BISABOLOL'], sat: 0.5, effects: { tenang: 0.9 } },
  { match: ['CENTELLA', 'MADECASSOSIDE', 'ASIATICOSIDE'], sat: 1, effects: { tenang: 1 } },
  { match: ['AVENA', 'OAT'], sat: 1, effects: { tenang: 0.7, lembap: 0.3 } },
  { match: ['CAMELLIA', 'CHAMOMILLA', 'CALENDULA'], sat: 1, effects: { tenang: 0.6 } },
  { match: ['ZINC OXIDE'], sat: 15, effects: { lindung: 1, matte: 0.3 } },
  { match: ['TITANIUM DIOXIDE'], sat: 10, effects: { lindung: 0.9 } },
  { match: ['METHOXYCINNAMATE', 'OCTINOXATE'], sat: 7.5, effects: { lindung: 0.8 } },
  { match: ['METHOXYDIBENZOYLMETHANE', 'AVOBENZONE'], sat: 3, effects: { lindung: 0.8 } },
  { match: ['HOMOSALATE', 'OCTOCRYLENE', 'ETHYLHEXYL SALICYLATE', 'OCTISALATE'], sat: 8, effects: { lindung: 0.7 } },
  { match: ['TRIAZINE', 'BENZOTRIAZOLYL', 'TINOSORB', 'DIETHYLAMINO HYDROXYBENZOYL'], sat: 5, effects: { lindung: 1 } },
  { match: ['ZINC PCA', 'ZINC GLUCONATE'], sat: 1, effects: { matte: 0.8, tenang: 0.2 } },
  { match: ['KAOLIN', 'SILICA', 'BENTONITE', 'TAPIOCA'], sat: 3, effects: { matte: 0.8 } },
]

const KEYS: EffectKey[] = ['cerah', 'lembap', 'halus', 'tenang', 'lindung', 'matte']

/**
 * Effect profile of a formula: every line scores against the rules by
 * weight fraction of its saturation level, the sum per effect is clamped
 * to 1, then scaled by the model. A low stability probability (H1) damps
 * everything, and a predicted SPF (H3) sets the UV effect directly.
 */
export function handEffects(lines: LineUI[], analysis?: Analysis): EffectScore[] {
  const raw: Record<EffectKey, number> = { cerah: 0, lembap: 0, halus: 0, tenang: 0, lindung: 0, matte: 0 }
  const drivers: Record<EffectKey, Array<[string, number]>> = { cerah: [], lembap: [], halus: [], tenang: [], lindung: [], matte: [] }
  for (const line of lines) {
    if (!line.inci_name) continue
    const name = line.inci_name.toUpperCase()
    const rule = RULES.find((r) => r.match.some((m) => (m.startsWith('=') ? name === m.slice(1) : name.includes(m))))
    if (!rule) continue
    const dose = Math.min(1, pct(line) / rule.sat)
    for (const [k, w] of Object.entries(rule.effects) as Array<[EffectKey, number]>) {
      const s = dose * w
      raw[k] += s
      drivers[k].push([line.inci_name, s])
    }
  }
  const h1 = analysis?.heads.H1?.prediction
  const stable = h1?.kind === 'scalar' && h1.unit === 'probability' ? 0.5 + 0.5 * h1.value : 1
  const h3 = analysis?.heads.H3?.prediction
  if (h3?.kind === 'scalar' && h3.value > 0) raw.lindung = Math.max(raw.lindung, Math.min(1, h3.value / 50))
  return KEYS.map((key) => ({
    key,
    label: EFFECT_LABEL[key],
    strength: Math.round(Math.min(1, raw[key]) * stable * 100) / 100,
    drivers: drivers[key]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([n]) => n),
  }))
}
