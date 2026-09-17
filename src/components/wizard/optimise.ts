import { api, type AskCandidate, type AskDimension } from '@/lib/api'
import type { HeadId } from '@/lib/api-types'
import { productType } from '@/lib/catalog'
import { candidateSummary, headline, pct, titleCase } from '@/lib/insight'
import type { LineUI, Workspace } from '@/lib/store'
import { toFormula } from './analysis'

const isWater = (l: LineUI) => /AQUA|WATER/i.test(l.inci_name)

/**
 * Ask the optimiser for candidates around the current formula, then finish
 * what the server leaves open: it searches only the design dimensions, so the
 * fixed lines are copied back, water takes the balance to 100, and each
 * completed candidate is scored by the headline head and checked by the rules.
 */
export async function runOptimiser(ws: Workspace, q = 2): Promise<Pick<Workspace, 'candidates' | 'optimiserState' | 'candidateSummary'>> {
  const pt = productType(ws.productType)
  const named = ws.formula.filter((l) => l.inci_name.trim())
  const inSpace = named.filter((l) => l.ing_id && !isWater(l))
  const space: AskDimension[] = inSpace.map((l) => {
    const w = pct(l)
    const cap = l.eu_max_pct ?? 100
    return { ing_id: l.ing_id!, inci_name: l.inci_name, lo_pct: Math.max(0.05, +(w * 0.5).toFixed(3)), hi_pct: Math.min(cap, +Math.max(w * 1.5, w + 0.5).toFixed(3)) }
  })
  if (!space.length) throw new Error('Tidak ada bahan yang cocok dengan registry untuk dijadikan ruang pencarian. Pilih nama INCI dari daftar saran.')

  const out = await api.ask({ space, q, product_type: pt.apiType, state: ws.optimiserState ?? null, seed: ws.candidates?.length ? Date.now() % 10_000 : 0 })
  const h = headline(ws.analysis, ws.productType)
  const head: HeadId = h?.head ?? pt.heads[0]
  const scale = h?.unit === 'skor 0–100' ? 100 : 1
  const fixed = named.filter((l) => !inSpace.includes(l) && !isWater(l))
  const water = named.find(isWater)

  const candidates: AskCandidate[] = await Promise.all(
    out.candidates.map(async (c) => {
      const byId = new Map(inSpace.map((l) => [l.ing_id!, l]))
      const dims = c.formula.lines.map((cl) => {
        const src = byId.get(cl.ing_id ?? '') ?? inSpace.find((l) => l.inci_name.toUpperCase() === (cl.inci_name ?? '').toUpperCase())
        return { inci_name: src?.inci_name ?? titleCase(cl.inci_name ?? ''), ing_id: src?.ing_id ?? cl.ing_id ?? null, wt_pct: +cl.wt_pct.toFixed(2) }
      })
      const rest = fixed.map((l) => ({ inci_name: l.inci_name, ing_id: l.ing_id ?? null, wt_pct: pct(l) }))
      const used = [...dims, ...rest].reduce((a, l) => a + l.wt_pct, 0)
      const balance = +(100 - used).toFixed(2)
      const lines = [
        ...(water || balance > 0 ? [{ inci_name: water?.inci_name ?? 'Aqua', ing_id: water?.ing_id ?? null, wt_pct: Math.max(0, balance) }] : []),
        ...dims,
        ...rest,
      ]
      const formula = toFormula(lines.map((l, i) => ({ id: `c${i}`, ...l })))
      const body = { formula, product_type: pt.apiType }
      const [pred, verdict] = await Promise.all([
        api.predict(head, body).then((r) => (r.prediction.kind === 'scalar' ? { value: r.prediction.value, lo: r.prediction.lo, hi: r.prediction.hi } : r.prediction.kind === 'class' ? { value: r.prediction.p, lo: r.prediction.p, hi: r.prediction.p } : null)).catch(() => null),
        api.constraints(body).catch(() => c.verdict),
      ])
      return { ...c, formula: { lines }, predicted: pred ? { [head]: pred } : undefined, verdict: verdict ?? c.verdict }
    }),
  )
  // the highlighted one is the best scored candidate once scores exist
  const best = candidates.reduce((b, c, i) => ((c.predicted?.[head]?.value ?? -1) > (candidates[b].predicted?.[head]?.value ?? -1) ? i : b), 0)
  candidates.forEach((c, i) => (c.highlighted = i === best))

  return {
    candidates,
    optimiserState: out.state,
    candidateSummary: candidates.map((c, i) => candidateSummary(c, i, head, scale)),
  }
}
