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
    <div className="rounded-2xl border bg-card p-5" style={{ borderColor: '#D0DCF0' }}>
      <p className="text-xs font-medium mb-2" style={{ color: '#003369', opacity: 0.5 }}>{label}</p>
      <p className="font-serif text-3xl font-semibold italic" style={{ color: '#003369' }}>
        {value}
        {unit && <span className="text-lg ml-1" style={{ color: '#003369', opacity: 0.4 }}>{unit}</span>}
      </p>
      {hint && <p className="text-xs mt-2" style={{ color: '#2F7D52' }}>{hint}</p>}
    </div>
  )
}
