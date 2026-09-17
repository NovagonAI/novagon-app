import { TESTIMONIALS } from '@/lib/data'

export function Testimonials() {
  return (
    <section id="testimoni" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-medium text-ocean-600 uppercase tracking-widest mb-3 block">Testimoni</span>
          <h2 className="font-serif text-3xl sm:text-4xl text-ink">Apa kata para peneliti kami</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-paper rounded-xl border border-slate p-6 flex flex-col gap-4">
              {/* Quote icon */}
              <span className="text-ocean-200 text-4xl font-serif leading-none select-none" aria-hidden="true">"</span>

              <p className="text-sm text-ink/80 leading-relaxed flex-1">{t.quote}</p>

              <div className="flex items-center gap-3 pt-4 border-t border-slate">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/${t.seed}/80/80`}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-ink">{t.name}</p>
                  <p className="text-xs text-ink/50">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
