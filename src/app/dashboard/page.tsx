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
import { HeadViewer } from '@/components/dashboard/HeadViewer'
import { ApiHeadsCard } from '@/components/dashboard/ApiHeadsCard'
import { fetchHealth } from '@/lib/api'
import type { HealthResponse } from '@/lib/api'

export const metadata = {
  title: 'Dashboard — Novagon',
}

export default async function DashboardPage() {
  // Fetch health server-side — graceful fallback kalau API down
  let health: HealthResponse | null = null
  try {
    health = await fetchHealth()
  } catch {
    // API tidak tersedia — Topbar akan menampilkan status offline
  }

  return (
    // h-screen + overflow-hidden on root keeps topbar fixed while body scrolls
    <div className="h-screen flex flex-col bg-paper overflow-hidden">
      {/* Topbar — stays at top, never scrolls. Receives live health data. */}
      <Topbar health={health} />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — full height, never scrolls with content */}
        <div className="hidden md:flex flex-col shrink-0">
          <Sidebar />
        </div>

        {/* Main content — only this area scrolls */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Page header */}
            <div>
              <h1 className="font-serif text-3xl font-semibold italic text-ink">Ringkasan Formulasi</h1>
              <p className="text-xs text-ink/50 mt-1">Kamis, 17 September 2026</p>
            </div>

            {/* Alert */}
            <div className="flex items-start gap-3 rounded-xl border px-4 py-3" style={{ borderColor: '#AAD3FF', backgroundColor: '#EBF4FF' }}>
              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#1A5BA1' }} aria-hidden="true" />
              <div>
                <p className="text-sm font-medium" style={{ color: '#003369' }}>Model sedang diperbarui</p>
                <p className="text-xs mt-0.5" style={{ color: '#003369', opacity: 0.6 }}>Model prediksi v2.5 sedang dilatih ulang dengan 340 eksperimen baru. Perkiraan selesai 20 menit lagi.</p>
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

            {/* Compatibility checker — live dari /v1/constraints/check */}
            <CompatibilityCard />

            {/* Model heads status — live dari /v1/heads */}
            <ApiHeadsCard />

            {/* Formulation table */}
            <FormulationTable />

            <FormulaCanvas />

            <ChemicalViewer />

            <HeadViewer />

          </div>
        </main>
      </div>
    </div>
  )
}
