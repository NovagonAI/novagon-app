import type { Level } from '@/lib/insight'

const TONE: Record<string, string> = {
  blue: 'bg-blue text-white',
  gradient: 'bg-btn-gradient text-white',
  ok: 'bg-gradient-to-t from-ok-dark to-ok text-white',
  warn: 'bg-gradient-to-t from-warn-dark to-warn text-white',
  bad: 'bg-gradient-to-t from-bad-dark to-bad text-white',
  lab: 'bg-grey-nav text-white',
  info: 'bg-line text-navy',
  grey: 'bg-grey-nav text-white',
}

export function Badge({ tone = 'blue', children, className = '' }: { tone?: Level | 'blue' | 'gradient' | 'grey'; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-[22px] items-center rounded-[24px] px-[14px] text-[15px] font-bold leading-none ${TONE[tone]} ${className}`}>
      {children}
    </span>
  )
}

export const LEVEL_LABEL: Record<Level, string> = {
  ok: 'Aman',
  warn: 'Peringatan',
  bad: 'Pelanggaran',
  lab: 'Butuh uji lab',
  info: 'Info',
}
