'use client'

import { useEffect } from 'react'
import { WizardHeader } from '@/components/shell/PageHeader'
import { useStore } from '@/lib/store'
import { StepProductType } from './StepProductType'
import { StepQtpp } from './StepQtpp'
import { StepFormula } from './StepFormula'
import { StepPrediction } from './StepPrediction'
import { StepContribution } from './StepContribution'
import { StepOptimise } from './StepOptimise'

const TITLES = ['Penentuan Tipe Produk', 'Spesifikasi Produk', 'Input Formulasi', 'Analisis Formulasi', 'Kontribusi Bahan', 'Optimasi dan Iterasi Formulasi']

/** The six-step flow. Step state lives in the workspace so a reload resumes. */
export function Wizard() {
  const store = useStore()
  const ws = store.current

  useEffect(() => {
    if (store.ready && !ws) store.create('moisturizer')
  }, [store, ws])

  if (!store.ready || !ws) return <div className="pl-14 pt-[42px] text-[16px] font-semibold text-grey-text">Memuat…</div>

  const step = Math.min(6, Math.max(1, ws.step))
  const reached = Math.max(step, ws.analysis ? 6 : ws.confirmed ? 4 : step)
  const go = (n: number) => store.update(ws.id, { step: n })
  const props = { ws, update: (p: Parameters<typeof store.update>[1]) => store.update(ws.id, p), next: () => go(step + 1), back: () => go(step - 1) }

  return (
    <div className="mx-auto w-full max-w-[1150px] px-4 lg:px-12 pb-16">
      <WizardHeader title={TITLES[step - 1]} step={step} reached={reached} onSelect={go} />
      <div className="mt-[19px]">
        {step === 1 && <StepProductType {...props} />}
        {step === 2 && <StepQtpp {...props} />}
        {step === 3 && <StepFormula {...props} />}
        {step === 4 && <StepPrediction {...props} />}
        {step === 5 && <StepContribution {...props} />}
        {step === 6 && <StepOptimise {...props} />}
      </div>
    </div>
  )
}

export interface StepProps {
  ws: import('@/lib/store').Workspace
  update: (p: Partial<import('@/lib/store').Workspace> | ((w: import('@/lib/store').Workspace) => Partial<import('@/lib/store').Workspace>)) => void
  next: () => void
  back: () => void
}
