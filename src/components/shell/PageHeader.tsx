import { Stepper } from '@/components/ui/Stepper'
import { STEPS } from '@/lib/catalog'

/** Wizard heading: serif title, "Langkah n dari 6", the six-bar stepper. */
export function WizardHeader({ title, step, reached, onSelect }: { title: string; step: number; reached: number; onSelect?: (n: number) => void }) {
  return (
    <div className="pt-[42px]">
      <h1 className="font-serif text-[28px] font-bold italic leading-none text-navy sm:text-[36px]">{title}</h1>
      <p className="mt-[13px] text-[16px] font-bold text-navy">
        Langkah {step} dari {STEPS.length}
      </p>
      <Stepper steps={STEPS} current={step} reached={reached} onSelect={onSelect} className="mt-[13px]" />
    </div>
  )
}

/** Laboratorium heading: the white-to-grey band with title, subtitle and chips. */
export function BandHeader({ title, subtitle, chips = [], right }: { title: string; subtitle?: string; chips?: string[]; right?: React.ReactNode }) {
  return (
    <div className="w-full bg-header-fade">
      <div className="mx-auto flex min-h-[110px] w-full max-w-[1150px] flex-wrap items-start justify-between gap-4 px-4 pb-5 pt-6 sm:min-h-[152px] sm:pt-[37px] lg:px-12">
      <div>
        <h1 className="font-serif text-[28px] font-bold italic leading-none text-navy sm:text-[36px]">
          {title}
          {subtitle && <span className="mt-2 block font-sans text-[14px] font-bold not-italic text-grey-text sm:ml-3 sm:mt-0 sm:inline sm:align-middle sm:text-[16px] sm:before:content-['·_']">{subtitle}</span>}
        </h1>
        {chips.length > 0 && (
          <div className="mt-[16px] flex flex-wrap gap-[9px]">
            {chips.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      {right}
      </div>
    </div>
  )
}
