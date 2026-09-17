/**
 * Database types — sesuai schema Supabase yang sudah dibuat.
 * Regenerate dengan: npx supabase gen types typescript --project-id ogqaxlrmmrrokqvxanam
 */

import type {
  QTPP,
  Ingredient,
  PredictionResult,
  SafetyTestItem,
} from './lab-data'

// ---------------------------------------------------------------------------
// Row types — shape persis dari tabel Supabase
// ---------------------------------------------------------------------------

export interface WorkspaceRow {
  id: string
  nama: string
  deskripsi: string
  qtpp: QTPP
  created_at: string
  updated_at: string
}

export interface FormulaRow {
  id: string
  workspace_id: string
  nama: string
  bahan: Ingredient[]   // jsonb — [{nama, fungsi, persentase}]
  catatan: string | null
  created_at: string
}

export type PredictionStatus = 'queue' | 'processing' | 'done' | 'failed'

export interface PredictionRow {
  id: string
  workspace_id: string
  formula_id: string
  formula_nama: string
  status: PredictionStatus
  raw_response: unknown | null   // response mentah dari /v1/predict
  result: PredictionResult | null
  created_at: string
  finished_at: string | null
}

export type SafetyTestStatus = 'draft' | 'ongoing' | 'selesai'

export interface SafetyTestRow {
  id: string
  workspace_id: string
  prediction_id: string | null
  formula_nama: string
  status: SafetyTestStatus
  items: SafetyTestItem[]   // jsonb
  kesimpulan_umum: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Insert types — field yang dikirim saat INSERT (tanpa id/created_at)
// ---------------------------------------------------------------------------

export type WorkspaceInsert = Omit<WorkspaceRow, 'id' | 'created_at' | 'updated_at'>
export type FormulaInsert   = Omit<FormulaRow,   'id' | 'created_at'>
export type PredictionInsert = Omit<PredictionRow, 'id' | 'created_at'>
export type SafetyTestInsert = Omit<SafetyTestRow, 'id' | 'created_at'>

// ---------------------------------------------------------------------------
// Database interface — untuk createClient<Database>
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row:    WorkspaceRow
        Insert: WorkspaceInsert & { id?: string }
        Update: Partial<WorkspaceInsert>
      }
      formulas: {
        Row:    FormulaRow
        Insert: FormulaInsert & { id?: string }
        Update: Partial<FormulaInsert>
      }
      predictions: {
        Row:    PredictionRow
        Insert: PredictionInsert & { id?: string }
        Update: Partial<PredictionInsert>
      }
      safety_tests: {
        Row:    SafetyTestRow
        Insert: SafetyTestInsert & { id?: string }
        Update: Partial<SafetyTestInsert>
      }
    }
  }
}
