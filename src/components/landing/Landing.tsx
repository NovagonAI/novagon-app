'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const W = 1440
const H = 1024

const NAV = ['Service', 'About Us', 'Brands', 'Innovation']

/**
 * The Figma "dashboard" frame as a 1440×1024 stage scaled to the full
 * viewport width, so it always bleeds edge to edge. Scrolling drives a
 * parallax: the product grows and lifts, the cards slide inward and fade,
 * the dotted rings fade, the headline drifts up.
 */
export function Landing() {
  const wrap = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [t, setT] = useState(0) // 0 at top, 1 once the hero has scrolled past

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W))
    ro.observe(el)
    const onScroll = () => {
      const { top, height } = el.getBoundingClientRect()
      setT(Math.min(1, Math.max(0, -top / height)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const ease = t * t * (3 - 2 * t)
  const jar = { transform: `translateY(${ease * -80}px) scale(${1 + ease * 0.45})`, transformOrigin: '50% 50%' }
  const fade = { opacity: Math.max(0, 1 - ease * 1.6) }
  const leftCard = { ...fade, transform: `translateX(${ease * 220}px)` }
  const rightCard = { ...fade, transform: `translateX(${ease * -220}px)` }
  const rings = { opacity: Math.max(0, 1 - ease * 2) }
  const head = { transform: `translateY(${ease * -40}px)` }

  return (
    <div ref={wrap} className="hidden w-full overflow-hidden bg-white md:block" style={{ height: H * scale }}>
      <div className="relative origin-top-left bg-white" style={{ width: W, height: H, transform: `scale(${scale})` }}>
        {/* hero photo, 20%, with a light scroll drift */}
        <div className="absolute left-0 top-0 h-[638px] w-[1440px] overflow-hidden opacity-20" style={{ transform: `translateY(${ease * 60}px)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src="/figma/hero-bg.png" className="absolute max-w-none" style={{ height: '288.98%', width: '128.04%', left: '-2.88%', top: '-109.76%' }} />
        </div>
        {/* soft gradient blobs */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/gradient-map.png" className="absolute left-[-221px] top-[64px] size-[677px] max-w-none object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/gradient-map.png" className="absolute left-[981px] top-[299px] size-[677px] max-w-none object-cover" />
        {/* dotted rings */}
        <div style={rings}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src="/figma/dotted-circle.png" width={383} height={383} className="absolute left-[224px] top-[569px]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src="/figma/dotted-circle.png" width={383} height={383} className="absolute left-[836px] top-[425px]" />
        </div>

        <p className="absolute left-[66px] top-[64px] font-serif text-[36px] font-bold italic leading-none text-navy">Novagon</p>

        <nav aria-label="Navigasi utama" className="absolute left-[355px] top-[55px] flex h-[62px] w-[729px] items-center justify-center gap-[65px] rounded-[100px] bg-white pr-[26px] shadow-nav">
          <Link href="/" aria-current="page" className="flex h-[50px] w-[140px] items-center justify-center rounded-[50px] bg-btn-gradient text-[16px] font-bold text-white">
            Home
          </Link>
          {NAV.map((n) => (
            <a key={n} href={`#${n.toLowerCase().replace(/\s/g, '-')}`} className="text-[16px] font-bold text-navy hover:text-blue">
              {n}
            </a>
          ))}
        </nav>

        <Link
          href="/overview"
          className="absolute left-[1215px] top-[55px] flex h-[62px] w-[152px] items-center justify-center rounded-[50px] border-[3px] border-sky bg-white/60 text-[16px] font-bold"
        >
          <span className="text-gradient">Sign In</span>
        </Link>

        <div style={head}>
          <h1 className="absolute left-[420px] top-[174px] w-[600px] text-center font-serif text-[48px] font-bold italic leading-[1.25] text-blue">
            Innovating Goods
            <br />
            for The Greater Good
          </h1>
          <p className="absolute left-0 top-[319px] w-[1440px] text-center text-[20px] font-bold text-blue">
            Feel good, be good and do good are things that are connected within ourselves.
          </p>
        </div>

        {/* product hero: gradient disc, jar in a circular mask, bubbles on top */}
        <div className="absolute left-[504px] top-[383px] size-[487px]" style={jar}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src="/figma/hero-ellipse.svg" width={357} height={357} className="absolute left-[49px] top-[76px]" />
          <div className="absolute left-[15px] top-[42px] size-[425px] overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Produk pelembab dengan niacinamide" src="/figma/hero-jar.png" className="absolute max-w-none object-cover" style={{ width: 471.645, height: 589.163, left: -14.59, top: -105.79 }} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src="/figma/hero-bubbles.png" className="pointer-events-none absolute left-0 top-0 size-[487px] max-w-none object-cover" />
        </div>

        {/* ingredient cards */}
        <article className="absolute left-[103px] top-[512px] h-[295px] w-[258px] overflow-hidden rounded-[20px] bg-white text-center text-blue shadow-hero" style={leftCard}>
          <div className="absolute left-[10px] top-[11px] h-[207px] w-[238px] overflow-hidden rounded-[20px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/figma/card-niacinamide.png" className="absolute max-w-none" style={{ height: '164.25%', width: '142.86%', left: '-32.35%', top: '-31.4%' }} />
          </div>
          <p className="absolute left-0 top-[230px] w-full text-[20px] font-bold">Niacinamide</p>
          <p className="absolute left-0 top-[258px] w-full text-[16px] font-semibold">Pencerah &amp; penguat barrier</p>
        </article>
        <article className="absolute left-[1088px] top-[604px] h-[295px] w-[258px] overflow-hidden rounded-[20px] bg-white text-center text-blue shadow-hero" style={rightCard}>
          <div className="absolute left-[13px] top-[12px] h-[211px] w-[232px] overflow-hidden rounded-[20px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/figma/card-ceramide.png" className="absolute max-w-none" style={{ height: '184.49%', width: '167.6%', left: '-36.31%', top: '-42.04%' }} />
          </div>
          <p className="absolute left-0 top-[234px] w-full text-[20px] font-bold">Ceramide</p>
          <p className="absolute left-0 top-[262px] w-full text-[16px] font-semibold">Pemulih skin barrier</p>
        </article>

        {/* scroll hint */}
        <div aria-hidden="true" className="absolute bottom-[40px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 transition-opacity duration-500" style={{ opacity: t < 0.04 ? 1 : 0 }}>
          <svg width="24" height="36" viewBox="0 0 24 36" fill="none" className="animate-bounce" style={{ animationDuration: '1.6s' }}>
            <rect x="1" y="1" width="22" height="34" rx="11" stroke="#1A5BA1" strokeWidth="2" />
            <rect x="10" y="7" width="4" height="8" rx="2" fill="#1A5BA1" />
          </svg>
          <span className="text-[12px] font-semibold text-blue/70">Scroll</span>
        </div>
      </div>
    </div>
  )
}

/** Same content stacked for phones, where a scaled 1440px stage would be unreadable. */
export function MobileHero() {
  return (
    <div className="bg-gradient-to-b from-mist to-white px-4 pb-10 pt-6 md:hidden">
      <div className="flex items-center justify-between">
        <p className="font-serif text-[28px] font-bold italic text-navy">Novagon</p>
        <Link href="/overview" className="flex h-[44px] items-center rounded-[50px] border-[3px] border-sky bg-white px-5 text-[14px] font-bold">
          <span className="text-gradient">Sign In</span>
        </Link>
      </div>
      <nav aria-label="Navigasi utama" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-bold text-navy">
        <Link href="/" aria-current="page" className="rounded-[50px] bg-btn-gradient px-4 py-1 text-white">
          Home
        </Link>
        {NAV.map((n) => (
          <a key={n} href={`#${n.toLowerCase().replace(/\s/g, '-')}`} className="py-1">
            {n}
          </a>
        ))}
      </nav>
      <h1 className="mt-8 text-center font-serif text-[32px] font-bold italic leading-tight text-blue">
        Innovating Goods
        <br />
        for The Greater Good
      </h1>
      <p className="mt-3 text-center text-[15px] font-bold text-blue">Feel good, be good and do good are things that are connected within ourselves.</p>
      <div className="relative mx-auto mt-8 size-[260px] overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Produk pelembab dengan niacinamide" src="/figma/hero-jar.png" className="size-full object-cover object-[50%_62%]" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[
          { img: '/figma/card-niacinamide.png', title: 'Niacinamide', text: 'Pencerah & penguat barrier' },
          { img: '/figma/card-ceramide.png', title: 'Ceramide', text: 'Pemulih skin barrier' },
        ].map((c) => (
          <article key={c.title} className="rounded-[20px] bg-white p-3 text-center text-blue shadow-hero">
            <div className="aspect-square overflow-hidden rounded-[16px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src={c.img} className="size-full object-cover" />
            </div>
            <p className="mt-3 text-[18px] font-bold">{c.title}</p>
            <p className="text-[13px] font-semibold">{c.text}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
