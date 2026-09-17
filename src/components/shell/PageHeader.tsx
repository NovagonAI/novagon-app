import { Stepper } from '@/components/ui/Stepper'
import { STEPS } from '@/lib/catalog'

/** Wizard heading: serif title, "Langkah n dari 6", the six-bar stepper. */
export function WizardHeader({ title, step, reached, onSelect }: { title: string; step: number; reached: number; onSelect?: (n: number) => void }) {
  return (
    <div className="pt-[42px]">
      <h1 className="font-serif text-[36px] font-bold italic leading-none text-navy">{title}</h1>
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
    <div className="-mx-4 flex min-h-[152px] items-start justify-between bg-header-fade px-4 pt-[37px] lg:-ml-[56px] lg:mr-0 lg:pl-[54px] lg:pr-[44px]">
      <div>
        <h1 className="font-serif text-[36px] font-bold italic leading-none text-navy">
          {title}
          {subtitle && <span className="ml-3 align-middle font-sans text-[16px] font-bold not-italic text-grey-text">· {subtitle}</span>}
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
  )
}
