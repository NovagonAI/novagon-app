import { HEAD_LABEL, productType } from './catalog'
import { complianceRisks, fmt, headline, safetyRisks, stabilityRisks } from './insight'
import type { Workspace } from './store'

/**
 * Formulabot: the self-hosted Qwen behind /api/llm (OpenAI-compatible).
 * The system prompt is rebuilt from the active workspace on every request,
 * so the model answers about the formula on screen, not a generic one.
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const BASE = process.env.NEXT_PUBLIC_LLM_BASE ?? '/api/llm'
export const MODEL = 'Qwen/Qwen2.5-7B-Instruct-AWQ'
const PROMPT_CHARS = 9000

/** House style: no em dash, no semicolon, anywhere the model writes. */
export function cleanText(s: string): string {
  return s
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s+–\s+/g, ', ')
    .replace(/;/g, '.')
}

const PERSONA = `Kamu adalah Formulabot, asisten formulator kosmetik dari Novagon AI untuk tim R&D PT Paragon.
Jawab dalam bahasa Indonesia, ringkas, praktis, dan langsung ke inti.
Gunakan angka yang ada di konteks apa adanya dan sebutkan sumbernya (prediksi model, aturan, atau heuristik).
Jangan pernah mengarang hasil uji laboratorium. Kalau sesuatu adalah heuristik atau butuh konfirmasi lab, katakan dengan jelas.
Tipe Fitzpatrick adalah representasi warna kulit, bukan klaim etnis atau asal geografis.
Aturan gaya mutlak: jangan pernah menulis tanda em dash (-) dan jangan pernah menulis titik koma (,). Pakai koma atau titik.
Jawab dalam paragraf pendek atau daftar bernomor, maksimal sekitar 200 kata kecuali diminta lebih panjang.`

const lim = <T,>(xs: T[] | undefined, n: number) => (xs ?? []).slice(0, n)

/* The catalogue is fixed, so it is stated once: without it the model invents heads. */
const HEADS = 'Head model Novagon (13, tetap): ' + Object.entries(HEAD_LABEL).map(([k, v]) => `${k} ${v}`).join(', ') + '. Jangan menyebut head lain di luar daftar ini.'


/** Everything the model may cite, trimmed to roughly 3000 tokens. */
export function buildSystemPrompt(ws: Workspace | null): string {
  if (!ws) return `${PERSONA}\n\n${HEADS}\n\nBelum ada workspace aktif. Bantu pengguna memulai analisis formulasi.`
  const pt = productType(ws.productType)
  const parts: string[] = [PERSONA, '', HEADS, '', `KONTEKS WORKSPACE "${ws.name}" (langkah ${ws.step} dari 6)`, `Tipe produk: ${pt.label} ${pt.sub}`]

  const q = Object.entries(ws.qtpp).filter(([, v]) => v)
  if (q.length) parts.push('QTPP: ' + q.map(([k, v]) => `${k}=${v}`).join(', '))

  const lines = ws.formula.filter((l) => l.inci_name.trim())
  if (lines.length) parts.push('Formula (% b/b): ' + lim(lines, 20).map((l) => `${l.inci_name} ${fmt(Number(l.wt_pct) || 0)}%`).join(', '))

  const a = ws.analysis
  const h = headline(a, ws.productType)
  if (h) parts.push(`Prediksi utama ${h.label}: ${fmt(h.value)} (interval ${fmt(h.lo)} sampai ${fmt(h.hi)}, ${h.unit}), model ${h.head}${h.raw.uncertainty.ood ? ', formula di luar distribusi latih' : ''}`)
  for (const [k, r] of Object.entries(a?.heads ?? {})) {
    if (k === h?.head) continue
    const p = r.prediction
    if (p.kind === 'scalar') parts.push(`Prediksi ${k}: ${fmt(p.value)} ${p.unit} (${fmt(p.lo)} sampai ${fmt(p.hi)})`)
    else if (p.kind === 'class') parts.push(`Prediksi ${k}: ${p.label} p=${Math.round(p.p * 100)}%`)
  }
  const problems = Object.entries(a?.problems ?? {})
  if (problems.length) parts.push('Head yang tidak menjawab: ' + lim(problems, 4).map(([k, v]) => `${k}: ${v.slice(0, 80)}`).join(' | '))

  const findings = lim(a?.verdict?.findings, 8)
  if (findings.length) parts.push('Temuan aturan endpoint: ' + findings.map((f) => `${f.rule} ${f.severity}: ${f.message}${f.suggestion ? ` (saran: ${f.suggestion})` : ''}`).join(' | '))
  if (a?.verdict) parts.push(`Status aturan: ${a.verdict.status}, halal dapat diklaim: ${a.verdict.halal_claimable ? 'ya' : 'belum'}`)

  if (lines.length) {
    const risk = (title: string, rs: ReturnType<typeof stabilityRisks>) => {
      if (rs.length) parts.push(`${title}: ` + lim(rs, 5).map((r) => `${r.title}${r.detail ? ` (${r.detail.slice(0, 100)})` : ''}`).join(' | '))
    }
    risk('Risiko stabilitas (heuristik)', stabilityRisks(lines, a, ws.qtpp))
    risk('Risiko keamanan (heuristik)', safetyRisks(lines, a))
    risk('Kepatuhan dan halal', complianceRisks(lines, a))
  }

  const sv = ws.skin.verdict
  if (sv) parts.push(`Hasil skin scanner: tipe kulit ${sv.skin_type.label} (confidence ${Math.round(sv.skin_type.confidence * 100)}%), Fitzpatrick ${sv.fitzpatrick.label} (confidence ${Math.round(sv.fitzpatrick.confidence * 100)}%)`)
  else if (ws.skin.type) parts.push(`Tipe kulit dipilih manual: ${ws.skin.type}`)
  if (ws.skin.detail) parts.push(`Detail permasalahan kulit: ${ws.skin.detail}`)

  lim(ws.candidates, 2).forEach((c, i) => {
    const pred = c.predicted ? Object.values(c.predicted)[0] : undefined
    parts.push(`Kandidat optimiser C${i + 1}: ` + lim(c.formula.lines, 8).map((l) => `${l.inci_name} ${fmt(l.wt_pct)}%`).join(', ') + (pred ? ` (prediksi ${fmt(pred.value * (h?.unit === 'skor 0-100' ? 100 : 1))})` : ''))
  })

  const text = parts.join('\n')
  // ponytail: character cap instead of a tokenizer, 3 chars per token is a safe floor for Indonesian
  return text.length > PROMPT_CHARS ? text.slice(0, PROMPT_CHARS) + '\n(konteks dipotong)' : text
}

/** Stream one completion, calling onDelta per cleaned chunk. Resolves with the full text. */
export async function streamChat(messages: ChatMessage[], onDelta: (text: string) => void, signal?: AbortSignal): Promise<string> {
  const url = BASE.startsWith('/') ? `${window.location.origin}${BASE}/chat/completions` : `${BASE}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, stream: true, temperature: 0.4, max_tokens: 700 }),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(`Formulabot tidak bisa dihubungi (HTTP ${res.status})`)
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let full = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const rows = buf.split('\n')
    buf = rows.pop() ?? ''
    for (const row of rows) {
      const t = row.trim()
      if (!t.startsWith('data:')) continue
      const data = t.slice(5).trim()
      if (data === '[DONE]') return full
      try {
        const delta: string | undefined = JSON.parse(data).choices?.[0]?.delta?.content
        if (delta) {
          const c = cleanText(delta)
          full += c
          onDelta(c)
        }
      } catch {
        /* keep-alive or partial line */
      }
    }
  }
  return full
}
