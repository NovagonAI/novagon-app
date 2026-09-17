'use client'

import { useState } from 'react'
import { FAQ_ITEMS } from '@/lib/data'

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-16">
          {/* Left */}
          <div className="md:col-span-2">
            <span className="text-xs font-medium text-ocean-600 uppercase tracking-widest mb-3 block">FAQ</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight mb-4">
              Pertanyaan yang sering ditanyakan
            </h2>
            <p className="text-ink/60 leading-relaxed mb-8">
              Tidak menemukan jawaban yang kamu cari? Hubungi tim kami langsung.
            </p>
            <button className="inline-flex items-center text-sm font-medium border border-ink/20 text-ink px-5 py-2.5 rounded-md hover:border-ink/40 hover:bg-slate2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600">
              Hubungi Kami →
            </button>
          </div>

          {/* Right: accordion */}
          <div className="md:col-span-3 space-y-3">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="bg-card rounded-xl border border-slate overflow-hidden"
              >
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocean-600"
                  aria-expanded={openIndex === idx}
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                >
                  <span className="text-sm font-medium text-ink">{item.q}</span>
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full border border-slate flex items-center justify-center text-ink/50 transition-transform ${openIndex === idx ? 'rotate-45' : ''}`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>

                {openIndex === idx && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-ink/70 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
