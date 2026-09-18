'use client'

import { useCallback, useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Icon } from '@/components/ui/Icon'
import { Reveal, Wave } from './Motion'

/** Zidan first, so the loop opens on the CEO in the centre. */
const TEAM = [
  { src: '/team/profile-2.png', alt: 'Muhammad Sultan Zidan, CEO dan AI Engineer' },
  { src: '/team/profile-1.png', alt: 'Bryan Christopher K., CFO' },
  { src: '/team/profile-3.png', alt: 'Felicia Theodora, COO' },
  { src: '/team/profile-4.png', alt: 'Rahma Madina Tutuko, CMO' },
]

/** Item 10: looping card carousel, drag or arrows, the centre card scaled up. */
export function MeetTheTeam() {
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }))
  const [viewportRef, embla] = useEmblaCarousel({ loop: true, align: 'center', startIndex: 0 }, [autoplay.current])

  const tween = useCallback(() => {
    if (!embla) return
    const progress = embla.scrollProgress()
    const snaps = embla.scrollSnapList()
    const nodes = embla.slideNodes()
    snaps.forEach((snap, i) => {
      let diff = snap - progress
      // loop wrap-around: pick the nearest copy
      for (const off of [-1, 1]) if (Math.abs(diff + off) < Math.abs(diff)) diff += off
      const d = Math.abs(diff)
      const card = nodes[i]?.querySelector<HTMLElement>('[data-card]')
      if (card) {
        card.style.transform = `scale(${Math.max(1 - d * 1.1, 0.78)})`
        card.style.opacity = String(Math.max(1 - d * 2.5, 0.45))
      }
    })
  }, [embla])

  useEffect(() => {
    if (!embla) return
    tween()
    embla.on('scroll', tween)
    embla.on('reInit', tween)
    return () => {
      embla.off('scroll', tween)
      embla.off('reInit', tween)
    }
  }, [embla, tween])

  return (
    <section id="team" className="scroll-mt-4 bg-white">
      <div className="mx-auto max-w-[1150px] px-4 pb-[clamp(48px,7vw,96px)] pt-[clamp(16px,3vw,40px)] sm:px-8">
        <Reveal className="text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-blue">Team</p>
          <h2 className="mt-2 font-serif text-[clamp(28px,3vw,40px)] font-bold italic text-navy">Meet the Team</h2>
        </Reveal>
        <Reveal className="relative mt-[clamp(20px,3vw,40px)]">
          <div ref={viewportRef} className="overflow-hidden" aria-roledescription="carousel">
            <div className="flex touch-pan-y">
              {TEAM.map((m) => (
                <div key={m.src} className="min-w-0 flex-[0_0_72%] px-2 sm:flex-[0_0_45%] lg:flex-[0_0_30%]">
                  <div data-card className="mx-auto w-full max-w-[300px] transition-[transform,opacity] duration-300 ease-out">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={m.alt} src={m.src} className="w-full rounded-[24px] shadow-hero" draggable={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => embla?.scrollPrev()} aria-label="Sebelumnya" className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 text-navy shadow-card hover:text-blue">
            <Icon name="arrow-right" size={40} className="rotate-180" />
          </button>
          <button type="button" onClick={() => embla?.scrollNext()} aria-label="Berikutnya" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 text-navy shadow-card hover:text-blue">
            <Icon name="arrow-right" size={40} />
          </button>
        </Reveal>
      </div>
      <Wave fill="#003369" />
    </section>
  )
}
