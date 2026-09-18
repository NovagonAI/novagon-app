import { Icon } from '@/components/ui/Icon'
import { Panel, Box } from '@/components/ui/Panel'
import { summarise } from '@/lib/insight'
import type { Workspace } from '@/lib/store'

const NOTE =
  'Hasil uji keamanan ini adalah prediksi in silico berdasarkan data toksikologi dan literatur. AI tidak menggantikan safety assessor atau pengujian klinis yang diwajibkan sebelum produk di-release ke pasar. Gunakan hasil ini sebagai panduan awal untuk meminimalisir animal testing.'

/** "Ringkasan": three groups of one-sentence findings, then the disclaimer. */
export function SummaryPanel({ ws }: { ws: Workspace }) {
  const s = summarise(ws)
  const Group = ({ title, items }: { title: string; items: string[] }) =>
    items.length ? (
      <>
        <h3 className="mt-[18px] text-[16px] font-bold text-navy first:mt-0">{title}</h3>
        <ul className="mt-2 space-y-2">
          {items.map((t) => (
            <li key={t}>
              <Box muted className="px-[18px] py-[14px] text-justify text-[16px] font-semibold text-black">
                {t}
              </Box>
            </li>
          ))}
        </ul>
      </>
    ) : null
  return (
    <>
      <Panel title="Ringkasan" className="mt-[18px]" bodyClassName="pt-[18px] pb-[26px]">
        <Group title="Komposisi & Peran Bahan Terhadap Stabilitas Formulasi (Kontribusi SHAP-style, permutasi)" items={s.contributions} />
        <Group title="Analisis Tingkat Keamanan Komposisi Formulasi" items={s.safety} />
        <Group title="Stabilitas & Sifat Fisik Formula" items={s.physical} />
      </Panel>
      <Note />
    </>
  )
}

export function Note({ className = 'mt-[18px]' }: { className?: string }) {
  return (
    <Panel className={className} bodyClassName="py-[22px]">
      <div className="rounded-[10px] border border-warn-deep bg-warn-bg px-5 py-4">
        <p className="flex items-center gap-2 text-[16px] font-bold text-warn-dark">
          <Icon name="danger" size={20} /> Catatan:
        </p>
        <p className="mt-2 text-justify text-[14px] font-semibold text-black">{NOTE}</p>
      </div>
    </Panel>
  )
}
