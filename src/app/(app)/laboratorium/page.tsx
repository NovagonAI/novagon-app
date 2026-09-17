'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BandHeader } from '@/components/shell/PageHeader'
import { Icon } from '@/components/ui/Icon'
import { productType } from '@/lib/catalog'
import { relativeDate, useStore } from '@/lib/store'

/** Saved workspaces as the Figma "Laboratorium" cards. */
export default function LabPage() {
  const store = useStore()
  const router = useRouter()
  const open = (id: string) => {
    store.select(id)
    router.push(`/laboratorium/${id}`)
  }
  const fresh = () => {
    store.create('moisturizer')
    router.push('/analisis')
  }
  return (
    <div className="max-w-[1150px] px-4 lg:pl-14 lg:pr-[44px] pb-16">
      <BandHeader title="Laboratorium" />
      <p className="-mt-[70px] text-[16px] font-bold text-navy">Akses formulasi Anda yang tersimpan sebelumnya</p>
      <ul className="mt-[70px] grid gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
        {store.ready &&
          store.workspaces.map((w) => (
            <li key={w.id}>
              <article className="panel relative h-[219px] shadow-card">
                <header className="flex h-[58px] items-center justify-between border-b-2 border-line px-[22px]">
                  <h2 className="truncate text-[20px] font-bold text-navy">{w.name}</h2>
                  <span className="shrink-0 text-[20px] font-bold text-grey-text">{relativeDate(w.updatedAt)}</span>
                </header>
                <div className="px-[22px] pt-[12px]">
                  <p className="text-[20px] font-bold text-black">QTPP</p>
                  <p className="mt-[6px] w-[262px] text-[15px] font-semibold leading-snug text-grey-text">
                    Penampilan: {w.qtpp.warna || '—'}
                    <br />
                    pH: {w.qtpp.ph || '—'}
                    <br />
                    Viskositas: {w.qtpp.viskositas || '—'}…
                  </p>
                </div>
                <button type="button" onClick={() => open(w.id)} className="absolute bottom-[23px] right-[27px] text-navy hover:text-blue" aria-label={`Buka ${w.name}`}>
                  <Icon name="arrow-right" size={47} />
                </button>
                <span className="absolute bottom-[8px] left-[22px] text-[12px] font-semibold text-grey-text">{productType(w.productType).label}</span>
              </article>
            </li>
          ))}
        <li>
          <button type="button" onClick={fresh} className="panel-white flex h-[219px] w-full flex-col items-center justify-center text-navy hover:bg-pale">
            <Icon name="add-circle" size={40} />
            <span className="mt-2 text-[20px] font-bold">Workspace baru</span>
            <span className="text-[14px] font-semibold text-grey-text">Mulai dari penentuan tipe produk</span>
          </button>
        </li>
      </ul>
      {store.ready && store.workspaces.length === 0 && (
        <p className="mt-6 text-[16px] font-semibold text-grey-text">
          Belum ada formulasi tersimpan. <Link href="/analisis" className="text-blue underline">Mulai analisis</Link>.
        </p>
      )}
    </div>
  )
}
