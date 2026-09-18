'use client'

import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Reveal, Wave, SignInLink } from './Motion'

const STEPS = [
  ['Tipe Produk', '/screens/step1-tipe-produk.webp'],
  ['Spesifikasi Produk', '/screens/step2-spesifikasi.webp'],
  ['Input Formulasi', '/screens/step3-formulasi.webp'],
  ['Analisis Formulasi', '/screens/step4-analisis.webp'],
  ['Kontribusi Bahan', '/screens/step5-kontribusi.webp'],
  ['Optimasi', '/screens/step6-optimasi.webp'],
] as const

const MISSION = [
  ['Interval, bukan angka tunggal', 'Prediksi stabilitas dan viskositas keluar dengan rentang kepercayaan dan dataset asalnya.'],
  ['Pasal, bukan peringatan umum', 'Bahan yang dilarang atau dibatasi dirujuk ke lampiran Peraturan BPOM dan Annex EU 1223/2009.'],
  ['Halal sejak bahan pertama', 'Sumber tiap bahan (nabati, sintetik, hewani) dicek saat formula disusun, bukan setelah jadi.'],
  ['Percobaan lab lebih sedikit', 'Optimiser Bayesian memilih titik uji berikutnya, sehingga DoE selesai dalam iterasi lebih singkat.'],
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

/** Coverflow: the active shot faces front, neighbours turn away and fade. Click a side card to bring it forward. */
function StepCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = STEPS.length

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActive((a) => (a + 1) % n), 4500)
    return () => clearInterval(t)
  }, [paused, n])

  return (
    <div className="mt-[clamp(20px,3vw,40px)]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <ol className="relative mx-auto aspect-video w-full max-w-[720px] [perspective:1400px]" aria-live="polite">
        {STEPS.map(([title, src], i) => {
          let off = i - active
          if (off > n / 2) off -= n
          if (off < -n / 2) off += n
          const hidden = Math.abs(off) > 2
          return (
            <li
              key={title}
              className="absolute inset-0 transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-none"
              style={{
                transform: `translateX(${off * 58}%) translateZ(${-Math.abs(off) * 220}px) rotateY(${-off * 32}deg)`,
                opacity: hidden ? 0 : 1 - Math.abs(off) * 0.3,
                zIndex: 10 - Math.abs(off),
                pointerEvents: hidden ? 'none' : 'auto',
              }}
              aria-hidden={off !== 0 || undefined}
            >
              <button type="button" onClick={() => setActive(i)} className="block h-full w-full cursor-pointer text-left" tabIndex={off === 0 ? -1 : 0}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Tangkapan layar langkah ${i + 1}: ${title}`} width={1920} height={1080} loading={i ? 'lazy' : 'eager'} className="aspect-video w-full rounded-[20px] border-4 border-blue/40 bg-white object-cover shadow-card" />
              </button>
            </li>
          )
        })}
      </ol>
      <p className="mt-5 flex items-center justify-center gap-3 text-[18px] font-bold text-navy">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-btn-gradient font-serif text-[17px] italic text-white">{active + 1}</span>
        {STEPS[active][0]}
      </p>
      <div className="mt-3 flex justify-center gap-2">
        {STEPS.map(([title], i) => (
          <button key={title} type="button" onClick={() => setActive(i)} aria-current={i === active || undefined} className="size-2.5 rounded-full bg-navy/25 transition-colors aria-[current]:bg-blue">
            <span className="sr-only">Langkah {i + 1}: {title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ServiceSection() {
  return (
    <section id="service" className="scroll-mt-4 bg-mist">
      <Wave fill="#e2f0ff" className="-mt-px bg-white" />
      <div className={`${container} pb-[clamp(48px,7vw,96px)] pt-[clamp(24px,4vw,56px)]`}>
        <Reveal>
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-blue">Service</p>
          <h2 className="mt-2 font-serif text-[clamp(28px,3vw,40px)] font-bold italic text-navy">Enam langkah dari ide ke formula</h2>
        </Reveal>
        <StepCarousel />
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
        <p className="mt-[clamp(20px,3vw,40px)] text-[13px] font-bold uppercase tracking-[0.2em] text-sky">Misi</p>
        <div className="mt-3 grid gap-4 md:grid-cols-4">
          {MISSION.map(([title, text], i) => (
            <Reveal key={title} delay={i * 60}>
              <div className="h-full rounded-[20px] bg-white p-5 text-navy shadow-card">
                <p className="text-[18px] font-bold">{title}</p>
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
          <Logo size={28} />
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
