import { ConfidenceRing } from '@/components/ui/ConfidenceRing'
import { Badge } from '@/components/ui/Badge'

export function PredictionCard() {
  return (
    <div className="rounded-xl border border-slate bg-card p-6">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs text-ink/50">Prediksi model · v2.4</p>
        <Badge tone="success">Stabil</Badge>
      </div>

      <div className="flex items-center gap-4 mt-4 mb-6">
        <ConfidenceRing value={92} />
        <div>
          <h2 className="font-serif text-xl text-ink leading-tight">Stabilitas emulsi tinggi</h2>
          <p className="text-sm text-ink/50 mt-1">Tingkat keyakinan model terhadap hasil ini</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-slate">
        <div>
          <dt className="text-ink/50 mb-1 text-xs">Risiko iritasi</dt>
          <dd className="font-medium text-success-600">Rendah</dd>
        </div>
        <div>
          <dt className="text-ink/50 mb-1 text-xs">Estimasi shelf life</dt>
          <dd className="font-medium">18–24 bulan</dd>
        </div>
        <div>
          <dt className="text-ink/50 mb-1 text-xs">pH proyeksi</dt>
          <dd className="font-mono font-medium">5.4 – 5.8</dd>
        </div>
        <div>
          <dt className="text-ink/50 mb-1 text-xs">Waktu simulasi</dt>
          <dd className="font-mono font-medium">2.3 detik</dd>
        </div>
      </dl>
    </div>
  )
}
