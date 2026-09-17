export function StatCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string
  value: string
  unit?: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-slate bg-card p-5">
      <p className="text-xs text-ink/50 mb-2">{label}</p>
      <p className="font-serif text-3xl text-ink">
        {value}
        {unit && <span className="text-lg text-ink/40 ml-1">{unit}</span>}
      </p>
      {hint && <p className="text-xs text-success-600 mt-2">{hint}</p>}
    </div>
  )
}
