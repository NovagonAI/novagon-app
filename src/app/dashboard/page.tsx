import { Topbar } from '@/components/dashboard/Topbar'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { StatCard } from '@/components/ui/StatCard'
import { EpochBarChart } from '@/components/dashboard/EpochBarChart'
import { DistributionChart } from '@/components/dashboard/DistributionChart'
import { FormulationCard } from '@/components/dashboard/FormulationCard'
import { PredictionCard } from '@/components/dashboard/PredictionCard'
import { CompatibilityCard } from '@/components/dashboard/CompatibilityCard'
import { FormulationTable } from '@/components/dashboard/FormulationTable'
import { ChemicalViewer } from '@/components/dashboard/ChemicalViewer'
import { FormulaCanvas } from '@/components/dashboard/FormulaCanvas'

export const metadata = {
  title: 'Dashboard — Synthera',
}

export default function DashboardPage() {
  return (
    // h-screen + overflow-hidden on root keeps topbar fixed while body scrolls
    <div className="h-screen flex flex-col bg-paper overflow-hidden">
      {/* Topbar — stays at top, never scrolls */}
      <Topbar />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — full height, never scrolls with content */}
        <div className="hidden md:flex flex-col shrink-0">
          <Sidebar />
        </div>

        {/* Main content — only this area scrolls */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Page header */}
          <div>
            <h1 className="font-serif text-2xl text-ink">Ringkasan Formulasi</h1>
            <p className="text-xs text-ink/50 mt-1">Minggu, 13 September 2026</p>
          </div>

          {/* Alert */}
          <div className="flex items-start gap-3 rounded-lg border border-ocean-200 bg-ocean-50 px-4 py-3">
            <span className="w-2 h-2 rounded-full bg-ocean-500 mt-1 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">Model sedang diperbarui</p>
              <p className="text-xs text-ink/60 mt-0.5">Model prediksi v2.5 sedang dilatih ulang dengan 340 eksperimen baru. Perkiraan selesai 20 menit lagi.</p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Formulasi Diuji" value="1.248" hint="+64 minggu ini" />
            <StatCard label="Akurasi Model" value="92,4" unit="%" hint="Naik 1,1% dari v2.3" />
            <StatCard label="Aktif" value="36" hint="Eksperimen berjalan" />
            <StatCard label="Perlu Review" value="4" hint="Tindakan diperlukan" />
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-3 flex flex-col" style={{ minHeight: '200px' }}>
              <EpochBarChart />
            </div>
            <div className="md:col-span-2">
              <DistributionChart />
            </div>
          </div>

          {/* Formulation + Prediction cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <FormulationCard />
            <PredictionCard />
          </div>

          {/* Compatibility checker */}
          <CompatibilityCard />

          {/* Formulation table */}
          <FormulationTable />

          <FormulaCanvas />

          <ChemicalViewer />
        </main>
      </div>
    </div>
  )
}
