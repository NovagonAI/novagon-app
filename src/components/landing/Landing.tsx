'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { SignInLink } from './Motion'

const NAV = [
  ['Service', '#service'],
  ['About Us', '#about-us'],
  ['Brands', '#brands'],
  ['Innovation', '#innovation'],
] as const

/** 0 at the top of the hero, 1 once it has scrolled out. Zero under reduced motion. */
function useScrollProgress(ref: React.RefObject<HTMLElement>) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const { top, height } = el.getBoundingClientRect()
        setT(Math.min(1, Math.max(0, -top / height)))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [ref])
  return t
}

/**
 * The Figma "dashboard" hero as a fluid layout: sizes come from clamp() and
 * the viewport, nothing is a scaled stage, so browser zoom just reflows.
 * Scrolling drives a light parallax with CSS transforms only.
 */
export function Landing() {
  const ref = useRef<HTMLElement>(null)
  const t = useScrollProgress(ref)
  const e = t * t * (3 - 2 * t)
  const jar = { transform: `translateY(${e * -8}%) scale(${1 + e * 0.4})` }
  const fade = { opacity: Math.max(0, 1 - e * 1.6) }
  const leftCard = { ...fade, transform: `translateX(${e * 60}%)` }
  const rightCard = { ...fade, transform: `translateX(${e * -60}%)` }
  const rings = { opacity: Math.max(0, 1 - e * 2) }
  const head = { transform: `translateY(${e * -40}px)` }

  return (
    <section ref={ref} className="relative overflow-hidden bg-white">
      {/* faint photo, drifting slightly */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[62%] overflow-hidden opacity-20" style={{ transform: `translateY(${e * 40}px)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/hero-bg.png" className="h-full w-full object-cover object-[50%_18%]" />
      </div>
      {/* soft blobs */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src="/figma/gradient-map.png" className="pointer-events-none absolute -left-[16%] top-[5%] hidden w-[47vw] max-w-[677px] md:block" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src="/figma/gradient-map.png" className="pointer-events-none absolute -right-[12%] top-[28%] hidden w-[47vw] max-w-[677px] md:block" />
      {/* dotted rings */}
      <div className="pointer-events-none absolute inset-0 hidden md:block" style={rings}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/dotted-circle.png" className="absolute left-[15%] top-[55%] w-[26vw] max-w-[383px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/dotted-circle.png" className="absolute left-[58%] top-[41%] w-[26vw] max-w-[383px]" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 pb-[clamp(40px,6vw,90px)] pt-[clamp(20px,3.8vw,55px)] sm:px-8 lg:px-[66px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-serif text-[clamp(26px,2.5vw,36px)] font-bold italic leading-none text-navy">Novagon</p>
          <nav aria-label="Navigasi utama" className="order-3 flex w-full flex-wrap items-center justify-center gap-x-[clamp(16px,4.5vw,65px)] gap-y-2 rounded-[100px] bg-white px-4 py-2 shadow-nav md:order-2 md:w-auto md:py-[6px] md:pl-[6px] md:pr-[52px]">
            <Link href="/" aria-current="page" className="flex h-[44px] items-center justify-center rounded-[50px] bg-btn-gradient px-6 text-[clamp(14px,1.1vw,16px)] font-bold text-white md:h-[50px] md:w-[140px]">
              Home
            </Link>
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="text-[clamp(14px,1.1vw,16px)] font-bold text-navy hover:text-blue">
                {label}
              </a>
            ))}
          </nav>
          <SignInLink className="order-2 flex h-[clamp(44px,4.3vw,62px)] items-center justify-center rounded-[50px] border-[3px] border-sky bg-white/60 px-[clamp(20px,3vw,43px)] text-[clamp(14px,1.1vw,16px)] font-bold md:order-3" labelClassName="text-gradient" />
        </header>

        <div className="mt-[clamp(36px,6vw,90px)] text-center" style={head}>
          <h1 className="font-serif text-[clamp(30px,3.4vw,48px)] font-bold italic leading-[1.2] text-blue">
            Innovating Goods
            <br />
            for The Greater Good
          </h1>
          <p className="mx-auto mt-[clamp(14px,2vw,28px)] max-w-[840px] text-[clamp(15px,1.4vw,20px)] font-bold text-blue">
            Feel good, be good and do good are things that are connected within ourselves.
          </p>
        </div>

        <div className="relative mt-[clamp(20px,4vw,50px)] grid grid-cols-2 items-end justify-items-center gap-x-4 gap-y-6 md:grid-cols-[1fr_auto_1fr] md:gap-x-[clamp(16px,3vw,60px)]">
          <IngredientCard className="order-2 md:order-1 md:justify-self-end md:mb-[clamp(30px,5vw,64px)]" style={leftCard} image="/figma/card-niacinamide.png" crop={{ height: '164.25%', width: '142.86%', left: '-32.35%', top: '-31.4%' }} name="Niacinamide" text="Pencerah dan penguat barrier" />

          {/* jar: gradient disc, jar photo in a circular mask, bubbles on top */}
          <div className="relative order-1 col-span-2 aspect-square w-[clamp(240px,34vw,487px)] md:order-2 md:col-span-1" style={jar}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/figma/hero-ellipse.svg" className="absolute left-[10%] top-[15.6%] w-[73.3%]" />
            <div className="absolute left-[3%] top-[8.6%] size-[87.3%] overflow-hidden rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Produk pelembab dengan niacinamide" src="/figma/hero-jar.png" className="absolute max-w-none" style={{ width: '111%', height: '138.6%', left: '-3.4%', top: '-24.9%' }} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/figma/hero-bubbles.png" className="pointer-events-none absolute inset-0 size-full object-cover" />
          </div>

          <IngredientCard className="order-3 md:justify-self-start md:-mb-[clamp(0px,1.5vw,24px)]" style={rightCard} image="/figma/card-ceramide.png" crop={{ height: '184.49%', width: '167.6%', left: '-36.31%', top: '-42.04%' }} name="Ceramide" text="Pemulih skin barrier" />
        </div>

        <div aria-hidden="true" className="mt-[clamp(16px,3vw,40px)] flex flex-col items-center gap-1 transition-opacity duration-500" style={{ opacity: t < 0.04 ? 1 : 0 }}>
          <svg width="24" height="36" viewBox="0 0 24 36" fill="none" className="animate-bounce" style={{ animationDuration: '1.6s' }}>
            <rect x="1" y="1" width="22" height="34" rx="11" stroke="#1A5BA1" strokeWidth="2" />
            <rect x="10" y="7" width="4" height="8" rx="2" fill="#1A5BA1" />
          </svg>
          <span className="text-[12px] font-semibold text-blue/70">Scroll</span>
        </div>
      </div>
    </section>
  )
}

function IngredientCard({
  image,
  crop,
  name,
  text,
  className = '',
  style,
}: {
  image: string
  crop: React.CSSProperties
  name: string
  text: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <article className={`w-[clamp(140px,18vw,258px)] overflow-hidden rounded-[20px] bg-white p-[4%] text-center text-blue shadow-hero ${className}`} style={style}>
      <div className="relative aspect-[238/207] overflow-hidden rounded-[16px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={image} className="absolute max-w-none" style={crop} />
      </div>
      <p className="mt-[clamp(6px,1vw,14px)] text-[clamp(14px,1.4vw,20px)] font-bold leading-tight">{name}</p>
      <p className="mb-[clamp(4px,0.8vw,10px)] mt-1 text-[clamp(11px,1.1vw,16px)] font-semibold leading-tight">{text}</p>
    </article>
  )
}
