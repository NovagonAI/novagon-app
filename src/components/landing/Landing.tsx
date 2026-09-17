'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const W = 1440
const H = 1024

const NAV = ['Service', 'About Us', 'Brands', 'Innovation']

/**
 * The Figma "dashboard" frame reproduced as a 1440×1024 stage and scaled to
 * the viewport width, which keeps every offset the designer placed.
 */
export function Landing() {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = ref.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / W)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="hidden w-full justify-center overflow-hidden bg-white md:flex" style={{ height: H * scale }}>
      <div ref={ref} className="relative origin-top-left bg-white" style={{ width: W, height: H, transform: `scale(${scale})` }}>
        {/* hero photo, 20% */}
        <div className="absolute left-0 top-0 h-[638px] w-[1440px] overflow-hidden opacity-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src="/figma/hero-bg.png" className="absolute max-w-none" style={{ height: '288.98%', width: '128.04%', left: '-2.88%', top: '-109.76%' }} />
        </div>
        {/* soft gradient blobs */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/gradient-map.png" className="absolute left-[-221px] top-[64px] size-[677px] max-w-none object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/gradient-map.png" className="absolute left-[981px] top-[299px] size-[677px] max-w-none object-cover" />
        {/* dotted circles */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/dotted-circle.png" width={383} height={383} className="absolute left-[224px] top-[569px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/dotted-circle.png" width={383} height={383} className="absolute left-[836px] top-[425px]" />

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

        <h1 className="absolute left-[420px] top-[174px] w-[600px] text-center font-serif text-[48px] font-bold italic leading-[1.25] text-blue">
          Innovating Goods
          <br />
          for The Greater Good
        </h1>
        <p className="absolute left-0 top-[319px] w-[1440px] text-center text-[20px] font-bold text-blue">
          Feel good, be good and do good are things that are connected within ourselves.
        </p>

        {/* product hero: gradient disc, jar in a circular mask, bubbles on top */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/hero-ellipse.svg" width={357} height={357} className="absolute left-[553px] top-[459px]" />
        <div className="absolute left-[519px] top-[425px] size-[425px] overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Produk pelembab dengan niacinamide" src="/figma/hero-jar.png" className="absolute max-w-none object-cover" style={{ width: 471.645, height: 589.163, left: -14.59, top: -105.79 }} />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/hero-bubbles.png" className="pointer-events-none absolute left-[504px] top-[383px] size-[487px] max-w-none object-cover" />

        {/* ingredient cards */}
        <article className="absolute left-[103px] top-[512px] h-[295px] w-[258px] overflow-hidden rounded-[20px] bg-white text-center text-blue shadow-hero">
          <div className="absolute left-[10px] top-[11px] h-[207px] w-[238px] overflow-hidden rounded-[20px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/figma/card-niacinamide.png" className="absolute max-w-none" style={{ height: '164.25%', width: '142.86%', left: '-32.35%', top: '-31.4%' }} />
          </div>
          <p className="absolute left-0 top-[230px] w-full text-[20px] font-bold">Niacinamide</p>
          <p className="absolute left-0 top-[258px] w-full text-[16px] font-semibold">Pencerah &amp; penguat barrier</p>
        </article>
        <article className="absolute left-[1088px] top-[604px] h-[295px] w-[258px] overflow-hidden rounded-[20px] bg-white text-center text-blue shadow-hero">
          <div className="absolute left-[13px] top-[12px] h-[211px] w-[232px] overflow-hidden rounded-[20px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/figma/card-ceramide.png" className="absolute max-w-none" style={{ height: '184.49%', width: '167.6%', left: '-36.31%', top: '-42.04%' }} />
          </div>
          <p className="absolute left-0 top-[234px] w-full text-[20px] font-bold">Ceramide</p>
          <p className="absolute left-0 top-[262px] w-full text-[16px] font-semibold">Pemulih skin barrier</p>
        </article>
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
