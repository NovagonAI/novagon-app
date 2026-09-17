'use client'

import { useState, useMemo } from 'react'
import { type Ingredient, INGREDIENT_FUNCTION_OPTIONS } from '@/lib/lab-data'
import { createFormula, deleteFormula } from '@/lib/db'
import type { WorkspaceWithRelations } from '@/lib/db'
import type { FormulaRow } from '@/lib/database.types'
import {
  IconMagnifyingGlass, IconPlus, IconTrash, IconPencil,
  IconInformationCircle, IconXMark,
} from '@/components/ui/Icons'

interface Props {
  workspace: WorkspaceWithRelations
  onPredict?: (formulaId: string) => void
  onDataChange?: () => void
}

const EMPTY_INGREDIENT: Ingredient = { nama: '', fungsi: '', persentase: 0 }

// Hapus semua suffix " (edit HH:MM)" dari nama formula
function stripEditSuffix(nama: string): string {
  return nama.replace(/\s*\(edit \d{2}:\d{2}\)+$/g, '').trim()
}

// Validasi form sebelum simpan
interface ValidationError {
  nama?: string
  bahan?: string
  total?: string
}
function validate(nama: string, ingredients: Ingredient[], isEdit: boolean): ValidationError {
  const errs: ValidationError = {}
  if (!isEdit && !nama.trim()) errs.nama = 'Nama formula wajib diisi'
  const filled = ingredients.filter(i => i.nama.trim())
  if (filled.length === 0) errs.bahan = 'Minimal 1 bahan harus diisi'
  const total = filled.reduce((s, i) => s + (i.persentase || 0), 0)
  if (Math.abs(total - 100) > 0.1) errs.total = `Total persentase harus 100% (sekarang ${total.toFixed(1)}%)`
  return errs
}

function IngredientRow({
  item, index, onChange, onRemove,
}: {
  item: Ingredient
  index: number
  onChange: (i: number, field: keyof Ingredient, val: string) => void
  onRemove: (i: number) => void
}) {
  return (
    <tr className="group border-b" style={{ borderColor: '#EBF4FF' }}>
      <td className="py-2 pr-2">
        <input
          value={item.nama}
          onChange={e => onChange(index, 'nama', e.target.value)}
          placeholder="Nama INCI"
          className="w-full text-xs px-2 py-1.5 rounded-lg border outline-none"
          style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF', color: '#003369' }}
        />
      </td>
      <td className="py-2 pr-2">
        <select
          value={item.fungsi}
          onChange={e => onChange(index, 'fungsi', e.target.value)}
          className="w-full text-xs px-2 py-1.5 rounded-lg border outline-none"
          style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF', color: '#003369' }}
        >
          <option value="">— Pilih —</option>
          {INGREDIENT_FUNCTION_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </td>
      <td className="py-2 pr-2 w-24">
        <input
          type="number" step="0.01" min="0" max="100"
          value={item.persentase || ''}
          onChange={e => onChange(index, 'persentase', e.target.value)}
          className="w-full text-xs px-2 py-1.5 rounded-lg border outline-none text-right"
          style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF', color: '#003369' }}
        />
      </td>
      <td className="py-2 w-8">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-danger-100 transition-all"
          style={{ color: '#B14432' }}
          aria-label="Hapus bahan"
        >
          <IconXMark width={12} height={12} />
        </button>
      </td>
    </tr>
  )
}

function IngredientTableForm({
  ingredients, totalPct, pctColor, errors,
  onIngredientChange, onRemoveIngredient, onAddIngredient,
}: {
  ingredients: Ingredient[]
  totalPct: number
  pctColor: string
  errors: ValidationError
  onIngredientChange: (i: number, field: keyof Ingredient, val: string) => void
  onRemoveIngredient: (i: number) => void
  onAddIngredient: () => void
}) {
  return (
    <div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: errors.bahan || errors.total ? '#B14432' : '#D0DCF0' }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#EBF4FF' }}>
              <th className="text-left text-xs font-semibold px-3 py-2.5" style={{ color: '#003369' }}>Nama INCI <span style={{ color: '#B14432' }}>*</span></th>
              <th className="text-left text-xs font-semibold px-3 py-2.5" style={{ color: '#003369' }}>Fungsi</th>
              <th className="text-right text-xs font-semibold px-3 py-2.5 w-24" style={{ color: '#003369' }}>% <span style={{ color: '#B14432' }}>*</span></th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {ingredients.map((item, i) => (
              <IngredientRow key={i} item={item} index={i} onChange={onIngredientChange} onRemove={onRemoveIngredient} />
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#EBF4FF' }}>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={onAddIngredient}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: '#1A5BA1' }}
                >
                  <IconPlus width={12} height={12} />
                  Tambah bahan
                </button>
              </td>
              <td className="px-3 py-2 text-xs font-semibold text-right" style={{ color: '#003369' }}>Total</td>
              <td className="px-3 py-2 text-sm text-right font-mono font-bold" style={{ color: pctColor }}>{totalPct.toFixed(1)}%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      {errors.bahan && <p className="text-xs mt-1" style={{ color: '#B14432' }}>{errors.bahan}</p>}
      {errors.total && <p className="text-xs mt-1" style={{ color: '#B14432' }}>{errors.total}</p>}
    </div>
  )
}

export function FormulaTab({ workspace, onDataChange }: Props) {
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(workspace.formulas.at(0)?.id ?? '')
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingFormula, setEditingFormula] = useState<FormulaRow | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formulaNama, setFormulaNama] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ ...EMPTY_INGREDIENT }])
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError>({})

  const filteredFormulas = useMemo(() =>
    workspace.formulas.filter(f =>
      f.nama.toLowerCase().includes(searchQuery.toLowerCase())
    ), [workspace.formulas, searchQuery])

  const selectedFormula = workspace.formulas.find(f => f.id === selectedFormulaId)

  function startNew() {
    setShowNewForm(true)
    setEditingFormula(null)
    setFormulaNama('')
    setIngredients([{ ...EMPTY_INGREDIENT }])
    setCatatan('')
    setSaveError(null)
    setValidationErrors({})
  }

  function startEdit(formula: FormulaRow) {
    setShowNewForm(false)
    setEditingFormula(formula)
    setSelectedFormulaId(formula.id)
    setIngredients((formula.bahan as Ingredient[]).map(b => ({ ...b })))
    setCatatan('')
    setSaveError(null)
    setValidationErrors({})
  }

  function handleIngredientChange(i: number, field: keyof Ingredient, val: string) {
    setIngredients(prev => prev.map((item, idx) =>
      idx === i ? { ...item, [field]: field === 'persentase' ? parseFloat(val) || 0 : val } : item
    ))
  }

  const totalPct = ingredients.reduce((s, i) => s + (i.persentase || 0), 0)
  const pctColor = Math.abs(totalPct - 100) < 0.1 ? '#2F7D52' : totalPct > 100 ? '#B14432' : '#B4863C'

  async function handleSave(isEdit: boolean) {
    const errs = validate(isEdit ? '_edit_' : formulaNama, ingredients, isEdit)
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs)
      return
    }
    setValidationErrors({})
    setSaving(true)
    setSaveError(null)

    try {
      // Edit: strip semua suffix lama "(edit HH:MM)", tambah satu yang baru
      const baseName = isEdit
        ? stripEditSuffix(editingFormula!.nama)
        : formulaNama.trim()
      const nama = isEdit
        ? `${baseName} (edit ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`
        : baseName

      const saved = await createFormula({
        workspace_id: workspace.id,
        nama,
        bahan: ingredients.filter(i => i.nama.trim()),
        catatan: catatan.trim() || null,
      })

      setShowNewForm(false)
      setEditingFormula(null)
      setSelectedFormulaId(saved.id)
      onDataChange?.()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menyimpan formula')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(formulaId: string) {
    if (!confirm('Hapus formula ini? Prediksi yang terkait tidak akan terhapus.')) return
    try {
      await deleteFormula(formulaId)
      const next = workspace.formulas.find(f => f.id !== formulaId)?.id ?? ''
      setSelectedFormulaId(next)
      onDataChange?.()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus formula')
    }
  }

  return (
    <div className="flex h-full min-h-[600px]">
      {/* ── Left panel ── */}
      <aside className="w-64 shrink-0 border-r flex flex-col" style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF' }}>
        {/* Search bar */}
        <div className="p-3 border-b" style={{ borderColor: '#D0DCF0' }}>
          <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5" style={{ borderColor: '#D0DCF0', backgroundColor: '#fff' }}>
            <IconMagnifyingGlass className="shrink-0 text-ink/30" width={13} height={13} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari formula…"
              className="flex-1 text-xs bg-transparent outline-none"
              style={{ color: '#003369' }}
            />
          </div>
          {/* Add button tepat di bawah search */}
          <button
            type="button"
            onClick={startNew}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border transition-colors mt-2"
            style={{ borderColor: '#1A5BA1', color: '#1A5BA1', backgroundColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EBF4FF' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <IconPlus width={13} height={13} />
            Formula Baru
          </button>
        </div>

        {/* Formula list */}
        <div className="flex-1 overflow-y-auto">
          {filteredFormulas.length === 0 ? (
            <p className="text-xs text-center p-6" style={{ color: '#003369', opacity: 0.4 }}>
              {searchQuery ? 'Tidak ditemukan' : 'Belum ada formula'}
            </p>
          ) : (
            filteredFormulas.map(formula => {
              const isSelected = formula.id === selectedFormulaId && !showNewForm && !editingFormula
              return (
                <button
                  key={formula.id}
                  type="button"
                  onClick={() => { setSelectedFormulaId(formula.id); setShowNewForm(false); setEditingFormula(null) }}
                  className="w-full text-left px-3 py-3 border-b transition-colors"
                  style={{
                    borderColor: '#D0DCF0',
                    backgroundColor: isSelected ? '#EBF4FF' : 'transparent',
                    borderRight: isSelected ? '2px solid #1A5BA1' : '2px solid transparent',
                  }}
                >
                  <span className="text-xs font-semibold truncate block" style={{ color: '#003369' }}>{formula.nama}</span>
                  <p className="text-xs mt-0.5" style={{ color: '#003369', opacity: 0.45 }}>
                    {(formula.bahan as Ingredient[]).length} bahan · {new Date(formula.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {showNewForm ? (
          /* ── New formula form ── */
          <div className="flex flex-col gap-5 max-w-3xl">
            <h3 className="font-semibold text-base" style={{ color: '#003369' }}>Formula Baru</h3>

            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#003369' }}>
                Nama Formula <span style={{ color: '#B14432' }}>*</span>
              </label>
              <input
                value={formulaNama}
                onChange={e => { setFormulaNama(e.target.value); setValidationErrors(v => ({ ...v, nama: undefined })) }}
                placeholder="cth. Formula Basis Niacinamide"
                className="w-full text-sm px-3 py-2 rounded-xl border outline-none"
                style={{
                  borderColor: validationErrors.nama ? '#B14432' : '#D0DCF0',
                  backgroundColor: '#EBF4FF', color: '#003369',
                }}
              />
              {validationErrors.nama && <p className="text-xs mt-1" style={{ color: '#B14432' }}>{validationErrors.nama}</p>}
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#003369' }}>Catatan (opsional)</label>
              <textarea
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                rows={2}
                placeholder="Catatan formulasi…"
                className="w-full text-sm px-3 py-2 rounded-xl border outline-none resize-none"
                style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF', color: '#003369' }}
              />
            </div>

            {/* Ingredient table */}
            <IngredientTableForm
              ingredients={ingredients}
              totalPct={totalPct}
              pctColor={pctColor}
              errors={validationErrors}
              onIngredientChange={handleIngredientChange}
              onRemoveIngredient={i => setIngredients(prev => prev.filter((_, idx) => idx !== i))}
              onAddIngredient={() => setIngredients(prev => [...prev, { ...EMPTY_INGREDIENT }])}
            />

            {saveError && <p className="text-xs" style={{ color: '#B14432' }}>{saveError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowNewForm(false); setValidationErrors({}) }}
                className="text-sm px-4 py-2 rounded-full border"
                style={{ borderColor: '#D0DCF0', color: '#1A5BA1' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="text-sm font-semibold px-6 py-2 rounded-full text-white disabled:opacity-40"
                style={{ backgroundColor: '#1A5BA1' }}
              >
                {saving ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </div>

        ) : editingFormula ? (
          /* ── Edit formula form ── */
          <div className="flex flex-col gap-5 max-w-3xl">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base" style={{ color: '#003369' }}>
                Edit: {stripEditSuffix(editingFormula.nama)}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: '#F7ECD6', color: '#B4863C' }}>
                Disimpan sebagai formula baru
              </span>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: '#EBF4FF' }}>
              <IconInformationCircle className="shrink-0 mt-0.5" width={14} height={14} style={{ color: '#1A5BA1' }} />
              <p className="text-xs" style={{ color: '#1A5BA1' }}>
                Perubahan akan disimpan sebagai formula baru. Formula lama tetap tersimpan.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#003369' }}>Catatan perubahan</label>
              <textarea
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                rows={2}
                placeholder="Jelaskan apa yang berubah…"
                className="w-full text-sm px-3 py-2 rounded-xl border outline-none resize-none"
                style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF', color: '#003369' }}
              />
            </div>

            <IngredientTableForm
              ingredients={ingredients}
              totalPct={totalPct}
              pctColor={pctColor}
              errors={validationErrors}
              onIngredientChange={handleIngredientChange}
              onRemoveIngredient={i => setIngredients(prev => prev.filter((_, idx) => idx !== i))}
              onAddIngredient={() => setIngredients(prev => [...prev, { ...EMPTY_INGREDIENT }])}
            />

            {saveError && <p className="text-xs" style={{ color: '#B14432' }}>{saveError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setEditingFormula(null); setValidationErrors({}) }}
                className="text-sm px-4 py-2 rounded-full border"
                style={{ borderColor: '#D0DCF0', color: '#1A5BA1' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="text-sm font-semibold px-6 py-2 rounded-full text-white disabled:opacity-40"
                style={{ backgroundColor: '#1A5BA1' }}
              >
                {saving ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </div>

        ) : selectedFormula ? (
          /* ── Formula detail ── */
          <div className="max-w-3xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: '#003369' }}>{selectedFormula.nama}</h3>
                <p className="text-xs mt-0.5" style={{ color: '#003369', opacity: 0.5 }}>
                  Dibuat {new Date(selectedFormula.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {selectedFormula.catatan && ` · ${selectedFormula.catatan}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(selectedFormula)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                  style={{ borderColor: '#1A5BA1', color: '#1A5BA1' }}
                >
                  <IconPencil width={12} height={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedFormula.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                  style={{ borderColor: '#D0DCF0', color: '#B14432' }}
                >
                  <IconTrash width={12} height={12} />
                  Hapus
                </button>
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#D0DCF0' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#EBF4FF' }}>
                    <th className="text-left text-xs font-semibold px-4 py-2.5" style={{ color: '#003369' }}>Nama INCI</th>
                    <th className="text-left text-xs font-semibold px-4 py-2.5" style={{ color: '#003369' }}>Fungsi</th>
                    <th className="text-right text-xs font-semibold px-4 py-2.5 w-24" style={{ color: '#003369' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedFormula.bahan as Ingredient[]).map((b, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: '#EBF4FF' }}>
                      <td className="px-4 py-2.5 text-sm" style={{ color: '#003369' }}>{b.nama}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: '#003369', opacity: 0.6 }}>{b.fungsi}</td>
                      <td className="px-4 py-2.5 text-sm text-right font-mono" style={{ color: '#1A5BA1' }}>{b.persentase.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#EBF4FF' }}>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#003369' }} colSpan={2}>Total</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono font-bold" style={{
                      color: Math.abs((selectedFormula.bahan as Ingredient[]).reduce((s, b) => s + b.persentase, 0) - 100) < 0.1 ? '#2F7D52' : '#B14432',
                    }}>
                      {(selectedFormula.bahan as Ingredient[]).reduce((s, b) => s + b.persentase, 0).toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#EBF4FF' }}>
              <IconBeakerSm />
            </div>
            <p className="font-medium" style={{ color: '#003369' }}>Pilih atau buat formula</p>
            <p className="text-sm mt-1" style={{ color: '#003369', opacity: 0.5 }}>
              Pilih formula dari panel kiri atau klik &quot;Formula Baru&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function IconBeakerSm() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#1A5BA1" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 0 1 .45 1.317C20.25 17.773 19.128 19 17.7 19H6.3c-1.428 0-2.55-1.227-2.55-2.683a2.25 2.25 0 0 1 .45-1.317L5 14.5m14.8.5-1.41-.47M5 14.5l1.41-.47" />
    </svg>
  )
}
