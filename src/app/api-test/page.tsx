/**
 * /api-test — Halaman testing endpoint formulation API
 *
 * ============================================================
 * CARA PAKAI: Ubah 1 variabel di bawah ini untuk ganti head.
 * ============================================================
 */

import { ApiTestClient } from '@/components/api-test/ApiTestClient'
import type { HeadId } from '@/components/api-test/ApiTestClient'

// ╔══════════════════════════════════════════════════════════╗
// ║  GANTI HEAD DI SINI                                      ║
// ║  Pilihan: 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' |   ║
// ║           'H7' | 'H8' | 'H9' | 'H10'| 'H11'| 'H12'|   ║
// ║           'H13'| 'ALL'                                   ║ 
// ║  'ALL' = tampilkan semua head sekaligus (mode ringkasan) ║
// ╚══════════════════════════════════════════════════════════╝
const ACTIVE_HEAD: HeadId | 'ALL' = 'H1'

export const metadata = {
  title: 'API Test — Novagon',
}

export default function ApiTestPage() {
  return <ApiTestClient activeHead={ACTIVE_HEAD} />
}
