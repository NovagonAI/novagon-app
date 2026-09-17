type BadgeTone = 'success' | 'amber' | 'ocean' | 'danger' | 'neutral'

const tones: Record<BadgeTone, string> = {
  success: 'bg-success-100 text-success-700',
  amber:   'bg-amber-100 text-amber-600',
  ocean:   'bg-ocean-100 text-ocean-700',
  danger:  'bg-danger-100 text-danger-600',
  neutral: 'bg-slate2 text-ink/70',
}

export function Badge({ tone = 'success', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}
