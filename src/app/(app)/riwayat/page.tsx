'use client'

import Link from 'next/link'
import { BandHeader } from '@/components/shell/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Panel } from '@/components/ui/Panel'
import { fmt } from '@/lib/insight'
import { useStore } from '@/lib/store'

const TONE = { pass: 'ok', warn: 'warn', fail: 'bad' } as const

/** Every prediction run, newest first. */
export default function HistoryPage() {
  const store = useStore()
  return (
    <div className="pb-16">
      <BandHeader title="Riwayat" subtitle="setiap prediksi yang pernah dijalankan" />
      <div className="mx-auto w-full max-w-[1150px] px-4 lg:px-12">
      <Panel className="mt-[37px]" bodyClassName="py-2">
        {store.ready && store.history.length === 0 && <p className="py-4 text-[16px] font-semibold text-grey-text">Belum ada riwayat prediksi.</p>}
        <ul className="divide-y divide-line">
          {store.history.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
              <span className="w-[170px] text-[14px] font-semibold text-grey-text">{new Date(e.at).toLocaleString('id-ID')}</span>
              <Link href={`/laboratorium/${e.workspaceId}?tab=prediksi`} className="min-w-[200px] flex-1 text-[16px] font-bold text-navy hover:underline">
                {e.name}
              </Link>
              <span className="font-serif text-[24px] font-bold italic text-navy">{e.score != null ? fmt(e.score) : '—'}</span>
              <Badge tone={TONE[e.status as keyof typeof TONE] ?? 'grey'}>{e.status === 'pass' ? 'Lolos aturan' : e.status === 'warn' ? 'Ada peringatan' : e.status === 'fail' ? 'Melanggar aturan' : e.status}</Badge>
            </li>
          ))}
        </ul>
      </Panel>
      </div>
    </div>
  )
}
