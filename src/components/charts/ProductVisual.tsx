import type { Qtpp } from '@/lib/catalog'

/**
 * "Gambaran Produk": the product image with callouts, and a sentence that
 * rewrites itself as QTPP fields are filled, so each added target is visible.
 */
export function ProductVisual({ qtpp, image, bentuk }: { qtpp: Qtpp; image: string; bentuk: string }) {
  const parts = [
    qtpp.warna ? `cairan ${qtpp.warna.toLowerCase().replace(/^cairan\s*/, '')}` : null,
    qtpp.viskositas ? `kekentalan ${qtpp.viskositas}` : null,
    qtpp.ph ? `tingkat keasaman ${qtpp.ph}` : null,
    qtpp.ukuranPartikel ? `ukuran partikel ${qtpp.ukuranPartikel}` : null,
    qtpp.bahanAktif ? `bahan aktif ${qtpp.bahanAktif}` : null,
    qtpp.stabilitas ? `prediksi masa simpan ${qtpp.stabilitas}` : null,
  ].filter(Boolean)
  const sentence = parts.length ? `Produk ${bentuk.toLowerCase()} dengan ${parts.join(', ')}.` : 'Isi spesifikasi di kiri, gambaran produk tersusun otomatis dari setiap parameter QTPP yang ditambahkan.'
  return (
    <div>
      <div className="relative mx-auto h-[300px] w-full max-w-[276px]">
        <div className="absolute left-1/2 top-[52px] size-[196px] -translate-x-1/2 overflow-hidden rounded-full bg-white shadow-tile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={image} className="size-full object-cover" />
        </div>
        <Callout label="Kekentalan" value={qtpp.viskositas || '-'} className="right-0 top-0" />
        <Callout label="Tingkat Keasaman" value={qtpp.ph || '-'} className="bottom-0 left-0" />
        {qtpp.stabilitas && <Callout label="Masa Simpan" value={qtpp.stabilitas} className="bottom-0 right-0" />}
      </div>
      <p className="mt-4 text-[16px] font-bold text-navy">Gambar di atas mendeskripsikan:</p>
      <p className="mt-1 text-justify text-[16px] font-semibold text-black">{sentence}</p>
    </div>
  )
}

function Callout({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className={`absolute flex h-[79px] w-[119px] flex-col items-center justify-center rounded-[10px] border border-warn-dark bg-warn-bg px-1 text-center shadow-tile ${className}`}>
      <span className="text-[13px] font-semibold leading-tight text-warn-dark">{label}</span>
      <span className="mt-1 text-[15px] font-bold leading-tight text-black">{value}</span>
    </div>
  )
}
