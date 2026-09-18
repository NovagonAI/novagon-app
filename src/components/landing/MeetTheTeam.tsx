'use client'

import { useCallback, useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Reveal, Wave } from './Motion'

type Member = { name: string; position: string; description: string; photo: string; linkedin: string; instagram: string }

/** Zidan first, so the loop opens on the CEO in the centre. */
const TEAM: Member[] = [
  {
    name: 'Muhammad Sultan Zidan',
    position: 'CEO | AI Engineer',
    description: 'Computer Science, Universitas Indonesia',
    photo: '/team/zidan.webp',
    linkedin: 'https://www.linkedin.com/in/muhammadsultanzidan/',
    instagram: 'https://www.instagram.com/zydanidn',
  },
  {
    name: 'Bryan Christopher K.',
    position: 'CFO | Business',
    description: 'Information Systems, Universitas Indonesia',
    photo: '/team/bryan.webp',
    linkedin: '#',
    instagram: '#',
  },
  {
    name: 'Felicia Theodora',
    position: 'COO | Business',
    description: 'Pharmacy, Universitas Indonesia',
    photo: '/team/felicia.webp',
    linkedin: '#',
    instagram: '#',
  },
  {
    name: 'Rahma Madina Tutuko',
    position: 'CMO | Visual Design',
    description: 'Communication, Universitas Indonesia',
    photo: '/team/rahma.webp',
    linkedin: '#',
    instagram: '#',
  },
]

const LinkedIn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)
const Instagram = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const social = 'flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-blue px-4 py-2 text-[13px] font-semibold text-white drop-shadow-[0px_2px_4px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:scale-105 hover:bg-navy hover:drop-shadow-lg active:translate-y-0 active:scale-95'

/** Item 10: looping card carousel, drag or arrows, the centre card scaled up. Same layout as the SPT BEM UI team section. */
export function MeetTheTeam() {
  const autoplay = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }))
  const [viewportRef, embla] = useEmblaCarousel({ loop: true, align: 'center' }, [autoplay.current])

  const tween = useCallback(() => {
    if (!embla) return
    const progress = embla.scrollProgress()
    const snaps = embla.scrollSnapList()
    const nodes = embla.slideNodes()
    snaps.forEach((snap, i) => {
      let diff = snap - progress
      for (const off of [-1, 1]) if (Math.abs(diff + off) < Math.abs(diff)) diff += off
      const d = Math.abs(diff)
      const card = nodes[i]?.querySelector<HTMLElement>('[data-card]')
      if (card) {
        card.style.transform = `scale(${Math.max(1 - d * 0.22, 0.78)})`
        card.style.opacity = String(Math.max(1 - d * 1.2, 0.25))
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
      <div className="pb-[clamp(48px,7vw,96px)] pt-[clamp(16px,3vw,40px)]">
        <Reveal className="px-4 text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-blue">Team</p>
          <h2 className="mt-2 font-serif text-[clamp(28px,3vw,40px)] font-bold italic text-navy">Meet the Team</h2>
        </Reveal>
        <Reveal className="relative mt-[clamp(20px,3vw,40px)]">
          <div ref={viewportRef} className="overflow-hidden" aria-roledescription="carousel">
            <div className="flex touch-pan-y py-6">
              {[...TEAM, ...TEAM].map((m, i) => (
                <div key={i} className="min-w-0 shrink-0 basis-[85vw] px-3 md:basis-1/3 md:px-5 xl:basis-1/5 xl:px-6">
                  <div data-card className="transition-[transform,opacity] duration-300 ease-out will-change-transform">
                    <TeamCard member={m} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => embla?.scrollPrev()} aria-label="Sebelumnya" className="absolute left-4 sm:left-8 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-blue bg-blue/20 text-navy transition-colors hover:bg-blue/40">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button type="button" onClick={() => embla?.scrollNext()} aria-label="Berikutnya" className="absolute right-4 sm:right-8 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-blue bg-blue/20 text-navy transition-colors hover:bg-blue/40">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </Reveal>
      </div>
      <Wave fill="#003369" />
    </section>
  )
}

function TeamCard({ member }: { member: Member }) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        className="flex w-full flex-col items-center gap-5 rounded-xl border border-sky/40 p-6 text-center text-white backdrop-blur-md"
        style={{ boxShadow: '0px 2px 7px 0px rgba(255,255,255,0.15)', backgroundImage: 'linear-gradient(180deg, #78b9ff 0%, #1a5ba1 49.24%, #003369 99.94%)' }}
      >
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-lg bg-sky/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={member.photo} alt={member.name} className="absolute inset-0 size-full object-cover object-[50%_15%]" draggable={false} />
        </div>
        <div className="flex w-full flex-col items-center gap-1">
          <p className="text-[20px] font-extrabold tracking-[0.01em]">{member.name}</p>
          <p className="text-[12px] font-semibold tracking-[0.01em] text-mist">{member.position}</p>
          <p className="mt-1 line-clamp-3 text-[14px] tracking-[0.01em] text-white/80">{member.description}</p>
        </div>
      </div>
      <div className="flex w-full gap-3">
        <a href={member.linkedin} target="_blank" rel="noreferrer" className={social}>
          <LinkedIn /> LinkedIn
        </a>
        <a href={member.instagram} target="_blank" rel="noreferrer" className={social}>
          <Instagram /> Instagram
        </a>
      </div>
    </div>
  )
}
