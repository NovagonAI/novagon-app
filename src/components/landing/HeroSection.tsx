'use client'

import React, { useEffect, useRef, useState } from 'react'

/* ─────────────────────────────────────────
   Ingredient card
───────────────────────────────────────── */
function IngredientCard({
  name,
  description,
  imageSrc,
  imageAlt,
  className = '',
}: {
  name: string
  description: string
  imageSrc: string
  imageAlt: string
  className?: string
}) {
  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white p-4 flex flex-col items-center text-center w-40 sm:w-44 ${className}`}
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden mb-3 bg-slate2 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={imageAlt} className="w-full h-full object-cover" />
      </div>
      <p className="text-sm font-semibold" style={{ color: '#1A5BA1' }}>{name}</p>
      <p className="text-xs mt-0.5 leading-snug" style={{ color: '#003369', opacity: 0.5 }}>
        {description}
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────
   Scroll hint — floating mouse icon
───────────────────────────────────────── */
function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, zIndex: 20 }}
    >
      {/* Mouse body */}
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-bounce"
        style={{ animationDuration: '1.6s' }}
      >
        <rect x="1" y="1" width="22" height="34" rx="11" stroke="#1A5BA1" strokeWidth="2" />
        <rect x="10" y="7" width="4" height="8" rx="2" fill="#1A5BA1">
          <animate
            attributeName="y"
            values="7;13;7"
            dur="1.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="1;0.2;1"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
      <span className="text-xs font-medium" style={{ color: '#1A5BA1', opacity: 0.7 }}>
        Scroll
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────
   Main HeroSection
───────────────────────────────────────── */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0) // 0 = top of hero, 1 = bottom of hero

  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      // progress: 0 when section top is at viewport top, 1 when section bottom exits viewport top
      const raw = -top / height
      setProgress(Math.min(1, Math.max(0, raw)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Derived animation values ──
  // Center: scale 1 → 1.35, translateY 0 → -80px
  const centerScale = 1 + progress * 0.60
  const centerY = progress * -80

  // Ingredient cards: move toward center (x shrinks to 0)
  // At progress=0 cards are at natural position; at progress=1 fully behind center
  const cardOpacity = Math.max(0, 1 - progress * 1.6)
  const leftCardX = progress * 200   // moves right (toward center)
  const rightCardX = progress * -200 // moves left (toward center)

  // Arcs: fade + scale down
  const arcOpacity = Math.max(0, 1 - progress * 2)

  // Headline: slight upward drift
  const headlineY = progress * -40

  // Scroll hint: visible only before first scroll
  const showScrollHint = progress < 0.04

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative overflow-hidden pt-28 pb-20 min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #AAD3FF 0%, #EBF4FF 40%, #F3F3F3 75%)',
      }}
    >
      {/* Hero background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full object-cover select-none"
        style={{ opacity: 0.08 }}
      />

      {/* Dotted pattern overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #1A5BA1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.12,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Headline ── */}
        <div
          className="text-center mb-10 sm:mb-14"
          style={{ transform: `translateY(${headlineY}px)`, willChange: 'transform' }}
        >
          <h1
            className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight italic"
            style={{ color: '#003369' }}
          >
            Innovating Goods
            <br />
            for The Greater Good
          </h1>
          <p
            className="mt-4 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-medium"
            style={{ color: '#1A5BA1' }}
          >
            Feel good, be good and do good are things that are connected within ourselves.
          </p>
        </div>

        {/* ── Three-column layout ── */}
        <div className="relative flex items-center justify-center">

          {/* Left ingredient card */}
          <div
            className="hidden sm:flex flex-col items-end mr-6 lg:mr-10 z-10"
            style={{
              transform: `translateX(${leftCardX}px)`,
              opacity: cardOpacity,
              willChange: 'transform, opacity',
              transition: 'none',
            }}
          >
            <IngredientCard
              name="Niacinamide"
              description="Brightens skin tone &amp; reduces pores"
              imageSrc="/ELEMENT (4) 1.png"
              imageAlt="Niacinamide molecule illustration"
            />
          </div>

          {/* Dashed arc – left */}
          <svg
            className="hidden sm:block absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              transform: 'translate(-330px, -50%)',
              opacity: arcOpacity,
              willChange: 'opacity',
            }}
            width="160"
            height="60"
            viewBox="0 0 160 60"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M 155 30 C 110 5, 50 5, 5 30"
              stroke="#84A0E4"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              fill="none"
            />
            <circle cx="155" cy="30" r="3.5" fill="#84A0E4" />
            <circle cx="5" cy="30" r="3.5" fill="#84A0E4" />
          </svg>

          {/* Center: product mockup */}
          <div
            className="relative flex-shrink-0 z-20"
            style={{
              transform: `translateY(${centerY}px) scale(${centerScale})`,
              willChange: 'transform',
              transition: 'none',
              transformOrigin: 'center center',
            }}
          >
            <div
              className="rounded-full p-3 sm:p-4"
              style={{
                background:
                  'radial-gradient(circle, rgba(170,211,255,0.6) 0%, rgba(170,211,255,0.1) 70%)',
              }}
            >
              <div
                className="w-52 h-52 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full overflow-hidden border-4 border-white shadow-2xl"
                style={{
                  boxShadow:
                    '0 0 0 8px rgba(26,91,161,0.08), 0 20px 60px rgba(26,91,161,0.25)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ELEMENT (3) 1.png"
                  alt="Produk kosmetik premium Novagon"
                  className="w-full h-full ml-2 object-cover"
                />
              </div>
            </div>
          </div>

          {/* Dashed arc – right */}
          <svg
            className="hidden sm:block absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              transform: 'translate(170px, -50%)',
              opacity: arcOpacity,
              willChange: 'opacity',
            }}
            width="160"
            height="60"
            viewBox="0 0 160 60"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M 5 30 C 50 5, 110 5, 155 30"
              stroke="#84A0E4"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              fill="none"
            />
            <circle cx="5" cy="30" r="3.5" fill="#84A0E4" />
            <circle cx="155" cy="30" r="3.5" fill="#84A0E4" />
          </svg>

          {/* Right ingredient card */}
          <div
            className="hidden sm:flex flex-col items-start ml-6 lg:ml-10 z-10"
            style={{
              transform: `translateX(${rightCardX}px)`,
              opacity: cardOpacity,
              willChange: 'transform, opacity',
              transition: 'none',
            }}
          >
            <IngredientCard
              name="Ceramide"
              description="Restores skin barrier &amp; locks moisture"
              imageSrc="/ELEMENT (5) 1.png"
              imageAlt="Ceramide ingredient illustration"
            />
          </div>
        </div>

        {/* Mobile: cards below */}
        <div className="flex sm:hidden justify-center gap-4 mt-8">
          <IngredientCard
            name="Niacinamide"
            description="Brightens skin tone &amp; reduces pores"
            imageSrc="https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=200&h=200&fit=crop&auto=format"
            imageAlt="Niacinamide molecule illustration"
          />
          <IngredientCard
            name="Ceramide"
            description="Restores skin barrier &amp; locks moisture"
            imageSrc="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=200&h=200&fit=crop&auto=format"
            imageAlt="Ceramide ingredient illustration"
          />
        </div>

        {/* ── CTA buttons ── */}
        <div
          className="flex flex-col sm:flex-row gap-3 justify-center mt-10 sm:mt-14"
          style={{
            opacity: Math.max(0, 1 - progress * 2),
            transform: `translateY(${headlineY}px)`,
            willChange: 'opacity, transform',
          }}
        >
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center text-sm font-semibold px-8 py-3 rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: '#1A5BA1' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#003369')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1A5BA1')}
          >
            Mulai Prediksi
          </a>
          <a
            href="#cara-kerja"
            className="inline-flex items-center justify-center text-sm font-semibold px-8 py-3 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: '#1A5BA1', color: '#1A5BA1', backgroundColor: 'transparent' }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#1A5BA1'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#1A5BA1'
            }}
          >
            Lihat Cara Kerja
          </a>
        </div>
      </div>

      {/* ── Floating scroll hint ── */}
      <ScrollHint visible={showScrollHint} />
    </section>
  )
}
