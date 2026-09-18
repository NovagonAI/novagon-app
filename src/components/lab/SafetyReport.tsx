import { Badge, LEVEL_LABEL } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { Panel } from '@/components/ui/Panel'
import { pickActive, safetyScreen } from '@/lib/insight'
import type { Workspace } from '@/lib/store'
import { Note } from './SummaryPanel'

const CONCLUSION = {
  ok: { bg: 'bg-ok-bg border-ok-dark', text: 'text-ok-dark', mark: 'tick-square' },
  warn: { bg: 'bg-warn-bg border-warn-dark', text: 'text-warn-dark', mark: 'danger' },
  bad: { bg: 'bg-bad-bg border-bad-dark', text: 'text-bad', mark: 'close-circle' },
}

/** "Uji Keamanan": in silico screen, one card per test, the disclaimer last. */
export function SafetyReport({ ws }: { ws: Workspace }) {
  const lines = ws.formula.filter((l) => l.inci_name)
  const s = safetyScreen(lines, ws.analysis)
  const active = pickActive(lines)
  const c = CONCLUSION[s.level]
  return (
    <>
      <Panel bodyClassName="pt-[18px] pb-[26px]">
        <h2 className="text-[20px] font-bold text-navy">Uji Keamanan</h2>
        <p className="mt-1 flex items-center gap-3 text-[16px] font-semibold text-grey-text">
          Formula Basis {active?.inci_name ?? '-'} <Badge tone={ws.analysis ? 'gradient' : 'grey'}>{ws.analysis ? 'Selesai' : 'Belum diprediksi'}</Badge>
        </p>
        <div className={`mt-[18px] flex gap-4 rounded-[10px] border px-4 py-4 ${c.bg}`}>
          <span className={`flex size-[56px] shrink-0 items-center justify-center rounded-[10px] border border-navy bg-white ${c.text}`} aria-hidden="true">
            <Icon name={c.mark} size={32} />
          </span>
          <div>
            <p className={`text-[16px] font-bold ${c.text}`}>{s.title}</p>
            <p className="mt-1 text-[14px] font-semibold text-black">{s.text}</p>
          </div>
        </div>
        <h3 className="mt-[24px] text-[20px] font-bold text-navy">Detail Pengujian</h3>
        <ul className="mt-[14px] space-y-[11px]">
          {s.tests.map((t) => (
            <li key={t.name} className="rounded-[10px] border border-navy bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[16px] font-bold text-black">{t.name}</p>
                  <p className="text-[14px] font-semibold text-grey-text">Metode: {t.method}</p>
                </div>
                <Badge tone={t.level}>{LEVEL_LABEL[t.level]}</Badge>
              </div>
              <p className="mt-3 rounded-[10px] border border-navy px-3 py-2 text-[16px] font-semibold text-black">{t.result}</p>
            </li>
          ))}
        </ul>
      </Panel>
      <Note />
    </>
  )
}
