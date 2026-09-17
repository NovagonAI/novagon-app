import { Icon } from '@/components/ui/Icon'
import { Panel, Box } from '@/components/ui/Panel'
import { productType } from '@/lib/catalog'
import { pickActive, fmt, pct } from '@/lib/insight'
import type { Workspace } from '@/lib/store'

/** Four icon tiles (warna, pH, kekentalan, stabilitas) and one sentence, the lab "Overview". */
export function OverviewCard({ ws }: { ws: Workspace }) {
  const q = ws.qtpp
  const pt = productType(ws.productType)
  const active = pickActive(ws.formula.filter((l) => l.inci_name))
  const tiles = [
    { icon: 'colorfilter', title: 'Warna', value: q.warna || '—' },
    { icon: 'wind', title: 'Derajat Keasaman (pH)', value: q.ph || '—' },
    { icon: 'drop', title: 'Kekentalan', value: q.viskositas || '—' },
    { icon: 'clock-lg', title: 'Stabilitas & Masa Simpan', value: q.stabilitas || '—' },
  ]
  const sentence = `Formulasi ini berpenampilan ${q.warna ? q.warna.toLowerCase() : 'sesuai target QTPP'}${q.aroma ? `, ${q.aroma.toLowerCase()}` : ''}, bahan aktif target ${q.bahanAktif || (active ? `${active.inci_name} ${fmt(pct(active))}%` : 'belum ditentukan')}. Sediaan ${q.bentuk || pt.label} untuk rute ${q.rute.toLowerCase()}, target stabil ${q.stabilitas || '—'}${q.keamanan ? `; target keamanan: ${q.keamanan.toLowerCase()}` : ''}.`
  return (
    <Panel bodyClassName="pt-[18px] pb-[26px]">
      <h2 className="text-[20px] font-bold text-navy">Overview</h2>
      <dl className="mt-[14px] grid gap-[10px] sm:grid-cols-2">
        {tiles.map((t) => (
          <Box key={t.title} className="flex h-[76px] items-center gap-[13px] pl-[10px] pr-4">
            <span className="flex size-[56px] shrink-0 items-center justify-center rounded-[10px] bg-btn-gradient text-white">
              <Icon name={t.icon} size={35} />
            </span>
            <span className="min-w-0">
              <dt className="truncate text-[20px] font-bold text-navy">{t.title}</dt>
              <dd className="truncate text-[16px] font-semibold text-black">{t.value}</dd>
            </span>
          </Box>
        ))}
      </dl>
      <Box className="mt-[10px] px-[23px] py-[17px] text-justify text-[16px] font-semibold text-black">{sentence}</Box>
    </Panel>
  )
}
