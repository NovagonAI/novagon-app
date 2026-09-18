import { api, describeError } from '@/lib/api'
import type { HeadId, PredictRequest, PredictResponse } from '@/lib/api-types'
import { productType } from '@/lib/catalog'
import type { Analysis, LineUI, Workspace } from '@/lib/store'

/** Formula as the endpoint wants it; empty names are dropped, ids kept when known. */
export function toFormula(lines: LineUI[]): PredictRequest['formula'] {
  return {
    lines: lines
      .filter((l) => l.inci_name.trim())
      .map((l) => ({
        inci_name: l.inci_name.trim(),
        wt_pct: typeof l.wt_pct === 'number' ? l.wt_pct : parseFloat(String(l.wt_pct)) || 0,
        ...(l.ing_id ? { ing_id: l.ing_id } : {}),
      })),
  }
}

/**
 * One click on "Prediksi" runs every head of the dosage form plus the rule
 * check, explanation and cost in parallel. A head that declines (503 without
 * artefact, 422 nothing matched) is recorded as a sentence, never as a crash,
 * so the other answers still render.
 */
export async function runAnalysis(ws: Workspace): Promise<Analysis> {
  const pt = productType(ws.productType)
  const formula = toFormula(ws.formula)
  const base = { formula, product_type: pt.apiType }
  const heads: Record<string, PredictResponse> = {}
  const problems: Record<string, string> = {}

  const headJobs = pt.heads.map(async (h: HeadId) => {
    try {
      heads[h] = await api.predict(h, base)
    } catch (e) {
      problems[h] = describeError(e)
    }
  })
  const [verdict, explain, cost] = await Promise.all([
    api.constraints(base).catch((e) => {
      problems.constraints = describeError(e)
      return undefined
    }),
    api.explain(pt.heads[0], { ...base, limit: 5 }).catch((e) => {
      problems.explain = describeError(e)
      return undefined
    }),
    api.cost({ formula }).catch(() => undefined),
    ...headJobs,
  ])
  return { ranAt: new Date().toISOString(), heads, problems, verdict: verdict ?? undefined, explain: explain ?? undefined, cost: cost ?? undefined }
}
