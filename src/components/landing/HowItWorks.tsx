import { HOW_IT_WORKS } from '@/lib/data'

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="py-20 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: image */}
          <div className="rounded-2xl overflow-hidden border border-slate shadow-sm order-2 md:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://picsum.photos/seed/lab-how/600/500"
              alt="Tim peneliti menggunakan Synthera di laboratorium"
              className="w-full h-72 md:h-96 object-cover"
            />
          </div>

          {/* Right: steps */}
          <div className="order-1 md:order-2">
            <span className="text-xs font-medium text-ocean-600 uppercase tracking-widest mb-3 block">Cara Kerja</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight mb-10">
              Sederhana dan{' '}
              <em className="not-italic italic text-ocean-600">terpercaya</em>
            </h2>

            <div className="space-y-8">
              {HOW_IT_WORKS.map((item, idx) => (
                <div key={item.step} className="flex gap-5">
                  {/* Step indicator + line */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-ocean-600 text-white flex items-center justify-center text-sm font-medium shrink-0">
                      {item.step}
                    </div>
                    {idx < HOW_IT_WORKS.length - 1 && (
                      <div className="w-px flex-1 bg-ocean-200 mt-2" aria-hidden="true" />
                    )}
                  </div>
                  <div className="pb-2">
                    <h3 className="font-serif text-lg text-ink mb-1">{item.title}</h3>
                    <p className="text-sm text-ink/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
