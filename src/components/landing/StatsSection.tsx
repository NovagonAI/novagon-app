import { STATS } from '@/lib/data'

export function StatsSection() {
  return (
    <section className="bg-white border-y border-slate py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="grid md:grid-cols-2 gap-10 items-center mb-12">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight mb-4">
              Rasakan perbedaannya{' '}
              <em className="not-italic italic text-ocean-600">dalam proses R&D</em>
            </h2>
            <p className="text-ink/60 leading-relaxed max-w-md">
              Formula yang divalidasi dengan teknologi AI — membantu kamu tetap konsisten, lebih cepat iterasi, dan menjaga standar tanpa bahan tambahan yang tidak perlu.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['team-amira', 'team-raka', 'team-salma'].map((seed) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={seed}
                  src={`https://picsum.photos/seed/${seed}/80/80`}
                  alt=""
                  className="w-9 h-9 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-ink">1.248+ formulasi diuji</p>
              <p className="text-xs text-ink/50">Tim peneliti aktif menggunakan Synthera</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="font-serif text-4xl text-ink mb-1">{stat.value}</p>
              <p className="text-sm text-ink/60 mb-1">{stat.label}</p>
              <p className="text-xs text-success-600">{stat.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
