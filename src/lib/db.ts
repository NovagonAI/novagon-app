/**
 * db.ts — Data access layer di atas Supabase.
 *
 * Semua query ke database melalui fungsi di sini.
 * Komponen tidak boleh import supabase client langsung.
 *
 * Auth-ready: saat auth ditambahkan, cukup tambah filter
 * `.eq('user_id', userId)` di sini tanpa ubah komponen.
 */

import { supabase } from './supabase'
import type {
  WorkspaceRow,
  FormulaRow,
  PredictionRow,
  SafetyTestRow,
  WorkspaceInsert,
  FormulaInsert,
  PredictionInsert,
  SafetyTestInsert,
  PredictionStatus,
  SafetyTestStatus,
} from './database.types'
import type { PredictionResult } from './lab-data'

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

/** Ambil semua workspace, diurutkan terbaru */
export async function getWorkspaces(): Promise<WorkspaceRow[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Ambil satu workspace by ID */
export async function getWorkspace(id: string): Promise<WorkspaceRow | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(error.message)
  }
  return data
}

/** Buat workspace baru */
export async function createWorkspace(input: WorkspaceInsert): Promise<WorkspaceRow> {
  const { data, error } = await supabase
    .from('workspaces')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Update workspace (nama, deskripsi, qtpp) */
export async function updateWorkspace(
  id: string,
  input: Partial<WorkspaceInsert>,
): Promise<WorkspaceRow> {
  const { data, error } = await supabase
    .from('workspaces')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Hapus workspace (cascade ke formulas, predictions, safety_tests) */
export async function deleteWorkspace(id: string): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Formulas
// ---------------------------------------------------------------------------

/** Ambil semua formula untuk satu workspace, diurutkan terbaru */
export async function getFormulas(workspaceId: string): Promise<FormulaRow[]> {
  const { data, error } = await supabase
    .from('formulas')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Ambil satu formula by ID */
export async function getFormula(id: string): Promise<FormulaRow | null> {
  const { data, error } = await supabase
    .from('formulas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data
}

/** Simpan formula baru (setiap edit = row baru, tidak ada update) */
export async function createFormula(input: FormulaInsert): Promise<FormulaRow> {
  const { data, error } = await supabase
    .from('formulas')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Hapus formula */
export async function deleteFormula(id: string): Promise<void> {
  const { error } = await supabase
    .from('formulas')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------

/** Ambil semua prediksi untuk satu workspace */
export async function getPredictions(workspaceId: string): Promise<PredictionRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Ambil satu prediksi by ID */
export async function getPrediction(id: string): Promise<PredictionRow | null> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data
}

/** Buat record prediksi baru (status = 'queue') */
export async function createPrediction(input: PredictionInsert): Promise<PredictionRow> {
  const { data, error } = await supabase
    .from('predictions')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Update status prediksi */
export async function updatePredictionStatus(
  id: string,
  status: PredictionStatus,
): Promise<void> {
  const { error } = await supabase
    .from('predictions')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/** Simpan hasil prediksi setelah API merespons */
export async function savePredictionResult(
  id: string,
  rawResponse: unknown,
  result: PredictionResult,
): Promise<PredictionRow> {
  const { data, error } = await supabase
    .from('predictions')
    .update({
      status: 'done',
      raw_response: rawResponse as never,
      result: result as never,
      finished_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Tandai prediksi gagal */
export async function markPredictionFailed(id: string): Promise<void> {
  const { error } = await supabase
    .from('predictions')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Safety Tests
// ---------------------------------------------------------------------------

/** Ambil semua uji keamanan untuk satu workspace */
export async function getSafetyTests(workspaceId: string): Promise<SafetyTestRow[]> {
  const { data, error } = await supabase
    .from('safety_tests')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Ambil satu uji keamanan by ID */
export async function getSafetyTest(id: string): Promise<SafetyTestRow | null> {
  const { data, error } = await supabase
    .from('safety_tests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data
}

/** Buat record uji keamanan baru */
export async function createSafetyTest(input: SafetyTestInsert): Promise<SafetyTestRow> {
  const { data, error } = await supabase
    .from('safety_tests')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Update status dan/atau items uji keamanan */
export async function updateSafetyTest(
  id: string,
  input: { status?: SafetyTestStatus; items?: SafetyTestRow['items']; kesimpulan_umum?: string },
): Promise<SafetyTestRow> {
  const { data, error } = await supabase
    .from('safety_tests')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Hapus uji keamanan */
export async function deleteSafetyTest(id: string): Promise<void> {
  const { error } = await supabase
    .from('safety_tests')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Composite — ambil workspace + semua relasinya sekaligus
// ---------------------------------------------------------------------------

export interface WorkspaceWithRelations extends WorkspaceRow {
  formulas: FormulaRow[]
  predictions: PredictionRow[]
  safetyTests: SafetyTestRow[]
}

export async function getWorkspaceWithRelations(
  id: string,
): Promise<WorkspaceWithRelations | null> {
  const [workspace, formulas, predictions, safetyTests] = await Promise.all([
    getWorkspace(id),
    getFormulas(id),
    getPredictions(id),
    getSafetyTests(id),
  ])

  if (!workspace) return null

  return { ...workspace, formulas, predictions, safetyTests }
}
