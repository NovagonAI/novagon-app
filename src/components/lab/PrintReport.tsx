import { productType } from '@/lib/catalog'
import { fmt, headline, pct, provenanceLine, safetyScreen, summarise, totalPct } from '@/lib/insight'
import type { Workspace } from '@/lib/store'

/** Print-only rendering behind "PDF Laporan": window.print() with the app chrome hidden. */
export function PrintReport({ ws }: { ws: Workspace }) {
  const pt = productType(ws.productType)
  const h = headline(ws.analysis, ws.productType)
  const s = summarise(ws)
  const screen = safetyScreen(ws.formula.filter((l) => l.inci_name), ws.analysis)
  return (
    <article className="hidden print:block text-[12px] leading-snug text-black">
      <h1 className="font-serif text-[24px] font-bold italic text-navy">Laporan Formulasi — {ws.name}</h1>
      <p>
        {pt.label} {pt.sub} · dibuat {new Date().toLocaleString('id-ID')}
      </p>
      <h2 className="mt-4 text-[16px] font-bold">1. QTPP</h2>
      <ul>
        {Object.entries(ws.qtpp).filter(([, v]) => v).map(([k, v]) => (
          <li key={k}>
            {k}: {v}
          </li>
        ))}
      </ul>
      <h2 className="mt-4 text-[16px] font-bold">2. Formula</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-1 text-left">INCI</th>
            <th className="border px-1 text-right">%</th>
            <th className="border px-1 text-left">Fungsi</th>
          </tr>
        </thead>
        <tbody>
          {ws.formula.filter((l) => l.inci_name).map((l) => (
            <tr key={l.id}>
              <td className="border px-1">{l.inci_name}</td>
              <td className="border px-1 text-right">{fmt(pct(l))}</td>
              <td className="border px-1">{(l.function_class ?? []).join(', ')}</td>
            </tr>
          ))}
          <tr>
            <td className="border px-1 font-bold">Total</td>
            <td className="border px-1 text-right font-bold">{fmt(totalPct(ws.formula))}</td>
            <td className="border" />
          </tr>
        </tbody>
      </table>
      <h2 className="mt-4 text-[16px] font-bold">3. Prediksi</h2>
      {h ? (
        <p>
          {h.label}: <strong>{fmt(h.value)}</strong> (interval {fmt(h.lo)}–{fmt(h.hi)}). {provenanceLine(h.raw)}
        </p>
      ) : (
        <p>Belum ada prediksi.</p>
      )}
      <ul>
        {[...s.contributions, ...s.safety, ...s.physical].map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <h2 className="mt-4 text-[16px] font-bold">4. Skrining keamanan in silico — {screen.title}</h2>
      <ul>
        {screen.tests.map((t) => (
          <li key={t.name}>
            <strong>{t.name}</strong> ({t.level}): {t.result}
          </li>
        ))}
      </ul>
      <h2 className="mt-4 text-[16px] font-bold">5. Temuan aturan</h2>
      <ul>
        {(ws.analysis?.verdict?.findings ?? []).map((f, i) => (
          <li key={i}>
            {f.rule} ({f.severity}) {f.inci_name}: {f.message}. Sumber: {f.source}
          </li>
        ))}
      </ul>
      {ws.candidates?.length ? (
        <>
          <h2 className="mt-4 text-[16px] font-bold">6. Kandidat optimasi</h2>
          <ul>
            {ws.candidates.map((c, i) => (
              <li key={i}>
                C{i + 1}: {c.formula.lines.map((l) => `${l.inci_name} ${fmt(l.wt_pct)}%`).join(', ')}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="mt-4 italic">
        Hasil ini adalah prediksi in silico. AI tidak menggantikan safety assessor atau pengujian yang diwajibkan sebelum produk dirilis.
      </p>
    </article>
  )
}
