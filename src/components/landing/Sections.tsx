import Link from 'next/link'
import { Reveal, Wave, SignInLink } from './Motion'

const STEPS = [
  ['Tipe Produk', 'Pilih bentuk sediaan, dari pelembab sampai sampo.'],
  ['Spesifikasi Produk', 'Isi QTPP dan pindai kulit dengan kamera.'],
  ['Input Formulasi', 'Susun bahan INCI beserta persentasenya.'],
  ['Analisis Formulasi', 'Prediksi stabilitas lengkap dengan interval kepercayaan.'],
  ['Kontribusi Bahan', 'Lihat peran tiap bahan dan risiko keamanannya.'],
  ['Optimasi', 'Terima usulan formula baru dan laporan siap ekspor.'],
] as const

const MISSION = [
  ['Prediksi bersumber', 'Setiap angka membawa interval dan asal datanya.'],
  ['Aturan tercantum', 'Setiap larangan menyebut pasal BPOM atau EU 1223/2009.'],
  ['Halal by design', 'Status halal bahan ikut diperiksa sejak formula disusun.'],
  ['Eksperimen lebih sedikit', 'Optimiser memilih percobaan berikutnya yang paling informatif.'],
] as const

const VALUES = [
  ['Terukur', 'Angka datang dari model yang diukur, bukan dari perkiraan.', 'bg-blue text-white'],
  ['Transparan', 'Sumber, batas aturan, dan tingkat keyakinan selalu terlihat.', 'bg-sky text-navy'],
  ['Aman', 'Skrining keamanan mendahului uji laboratorium, bukan menggantikannya.', 'bg-mist text-navy'],
] as const

const BRANDS = [
  ['Wardah', '/brands/wardah.png'],
  ['Make Over', '/brands/make-over.png'],
  ['Emina', '/brands/emina.png'],
  ['Kahf', '/brands/kahf.png'],
  ['Crystallure', '/brands/crystallure.png'],
  ['LABORE', '/brands/labore.png'],
  ['TAVI', '/brands/tavi.png'],
] as const

const container = 'mx-auto max-w-[1150px] px-4 sm:px-8'

export function ServiceSection() {
  return (
    <section id="service" className="scroll-mt-4 bg-mist">
      <Wave fill="#e2f0ff" className="-mt-px bg-white" />
      <div className={`${container} pb-[clamp(48px,7vw,96px)] pt-[clamp(24px,4vw,56px)]`}>
        <Reveal>
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-blue">Service</p>
          <h2 className="mt-2 font-serif text-[clamp(28px,3vw,40px)] font-bold italic text-navy">Enam langkah dari ide ke formula</h2>
        </Reveal>
        <ol className="mt-[clamp(20px,3vw,40px)] grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <Reveal key={title} delay={i * 60}>
              <li className="panel-white flex h-full gap-4 p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-btn-gradient font-serif text-[20px] font-bold italic text-white">{i + 1}</span>
                <span>
                  <span className="block text-[18px] font-bold text-navy">{title}</span>
                  <span className="mt-1 block text-[15px] font-medium text-black">{text}</span>
                </span>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-[clamp(24px,3vw,40px)] flex justify-center">
          <Link href="/analisis" className="btn-primary">
            Mulai Analisis Formulasi
          </Link>
        </Reveal>
      </div>
      <Wave fill="#003369" />
    </section>
  )
}

export function AboutSection() {
  return (
    <section id="about-us" className="scroll-mt-4 bg-navy text-white">
      <div className={`${container} pb-[clamp(48px,7vw,96px)] pt-[clamp(24px,4vw,56px)]`}>
        <Reveal className="text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-sky">About Us</p>
          <h2 className="mt-2 font-serif text-[clamp(28px,3.4vw,44px)] font-bold italic">
            Bukan sekadar kalkulator, <span className="text-sky">ini Novagon</span>
          </h2>
        </Reveal>
        <Reveal className="mt-[clamp(20px,3vw,40px)]">
          <div className="rounded-[20px] bg-white/10 p-6 ring-1 ring-white/20 backdrop-blur sm:p-8">
            <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-sky">Visi</p>
            <p className="mt-2 text-[clamp(17px,1.6vw,22px)] font-semibold leading-relaxed">
              Formulasi kosmetik yang lebih cepat, aman, dan terukur untuk Indonesia, dengan model yang selalu menyebut sumber dan batas aturannya.
            </p>
          </div>
        </Reveal>
        <div className="mt-[clamp(20px,3vw,40px)] grid gap-4 md:grid-cols-4">
          {MISSION.map(([title, text], i) => (
            <Reveal key={title} delay={i * 60}>
              <div className="h-full rounded-[20px] bg-white p-5 text-navy shadow-card">
                <p className="text-[13px] font-bold uppercase tracking-[0.15em] text-blue">Misi</p>
                <p className="mt-2 text-[18px] font-bold">{title}</p>
                <p className="mt-1 text-[14px] font-medium text-black">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-[clamp(28px,4vw,56px)]">
          {VALUES.map(([title, text, tone], i) => (
            <Reveal key={title} delay={i * 80} className={i ? '-mt-4' : ''}>
              <div className={`rounded-[24px] px-6 py-5 shadow-card sm:px-8 ${tone}`} style={{ position: 'relative', zIndex: i + 1 }}>
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] opacity-80">Nilai kami</p>
                <p className="font-serif text-[clamp(22px,2.4vw,30px)] font-bold italic">{title}</p>
                <p className="text-[15px] font-medium">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <Wave fill="#ffffff" />
    </section>
  )
}

export function BrandsSection() {
  return (
    <section id="brands" className="scroll-mt-4 bg-white">
      <div className={`${container} pb-[clamp(20px,3vw,40px)] pt-[clamp(16px,3vw,40px)]`}>
        <Reveal className="text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-blue">Brands</p>
          <h2 className="mt-2 font-serif text-[clamp(28px,3vw,40px)] font-bold italic text-navy">Aturan tiap brand ikut diperiksa</h2>
        </Reveal>
      </div>
      <div className="space-y-8 overflow-hidden pb-[clamp(48px,7vw,96px)]">
        {(['marquee-right', 'marquee-left'] as const).map((anim) => (
          <ul
            key={anim}
            className={`flex w-max items-center motion-safe:[animation:var(--marquee)_30s_linear_infinite]`}
            style={{ '--marquee': anim } as React.CSSProperties}
            aria-hidden={anim === 'marquee-left' || undefined}
          >
            {[...BRANDS, ...BRANDS, ...BRANDS, ...BRANDS].map(([name, src], i) => (
              <li key={i} aria-hidden={i >= BRANDS.length || undefined} className="shrink-0 pr-[clamp(40px,6vw,96px)]">
                <img src={src} alt={i < BRANDS.length && anim === 'marquee-right' ? name : ''} className="h-12 w-auto object-contain sm:h-16" loading="lazy" />
              </li>
            ))}
          </ul>
        ))}
      </div>
      <Wave fill="#e2f0ff" />
    </section>
  )
}

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className={`${container} flex flex-wrap items-center justify-between gap-4 py-8`}>
        <div>
          <p className="font-serif text-[28px] font-bold italic">Novagon</p>
          <p className="text-[13px] font-medium text-white/70">Innovating Goods for The Greater Good</p>
        </div>
        <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-bold">
          <a href="#service">Service</a>
          <a href="#about-us">About Us</a>
          <a href="#brands">Brands</a>
          <a href="#innovation">Innovation</a>
          <a href="#team">Team</a>
          <SignInLink />
        </nav>
      </div>
    </footer>
  )
}
