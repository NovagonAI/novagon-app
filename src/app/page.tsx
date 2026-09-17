import Link from 'next/link'
import { Landing, MobileHero } from '@/components/landing/Landing'

const SECTIONS = [
  {
    id: 'service',
    title: 'Service',
    text: 'Enam langkah dari tipe produk sampai formula teroptimasi: QTPP, input formula, prediksi stabilitas dan viskositas, kontribusi bahan, skrining keamanan in silico, lalu laporan yang siap diekspor.',
  },
  {
    id: 'about-us',
    title: 'About Us',
    text: 'Novagon adalah asisten formulator: setiap angka membawa interval dan sumbernya, dan setiap larangan menyebut aturannya (BPOM, EU 1223/2009, halal PP 42/2024).',
  },
  {
    id: 'brands',
    title: 'Brands',
    text: 'Aturan brand ikut diperiksa: LABORE tanpa SLS/SLES dan parfum, Wardah halal beauty, Emina ringan untuk remaja, Crystallure prestige anti-aging.',
  },
  {
    id: 'innovation',
    title: 'Innovation',
    text: 'Intelligent experiment design: optimiser mengusulkan kandidat formula berikutnya dari data eksperimen sebelumnya, dan hasil uji dikembalikan ke model.',
  },
]

export default function HomePage() {
  return (
    <>
      <Landing />
      <MobileHero />
      <div className="mx-auto max-w-[1050px] px-4 py-16 md:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="panel scroll-mt-6 p-6">
              <h2 className="font-serif text-[24px] font-bold italic text-navy">{s.title}</h2>
              <p className="mt-2 text-[16px] font-medium leading-relaxed text-black">{s.text}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link href="/analisis" className="btn-primary">
            Mulai Analisis Formulasi
          </Link>
        </div>
      </div>
    </>
  )
}
