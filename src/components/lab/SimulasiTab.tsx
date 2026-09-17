'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { WorkspaceWithRelations } from '@/lib/db'
import type { FormulaRow } from '@/lib/database.types'
import type { Ingredient } from '@/lib/lab-data'
import { HeadViewer } from '@/components/dashboard/HeadViewer'

interface Props {
  workspace: WorkspaceWithRelations
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ScanPhase =
  | 'idle'          // belum ada foto
  | 'camera'        // live camera aktif
  | 'processing'    // "generating 3D model"
  | 'ready'         // model 3D siap, bisa apply formula

// ---------------------------------------------------------------------------
// Icon helpers (inline SVG — tidak import file lain supaya self-contained)
// ---------------------------------------------------------------------------
function IcUpload() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M12 8v8M9 11l3-3 3 3" />
      <circle cx="17" cy="7" r="3" fill="#AAD3FF" strokeWidth="0" />
      <path d="M16 7h2M17 6v2" stroke="#1A5BA1" strokeWidth="1.5" />
    </svg>
  )
}

function IcCamera() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A5BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function IcCameraShutter() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function IcRotate() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  )
}

function IcSparkle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Camera component
// ---------------------------------------------------------------------------
function CameraView({ onCapture, onClose }: { onCapture: (dataUrl: string) => void; onClose: () => void }) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    setReady(false)
    setError(null)
    // Stop existing stream
    streamRef.current?.getTracks().forEach(t => t.stop())
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan di browser.')
    }
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [facingMode, startCamera])

  function handleCapture() {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width  = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    // File TIDAK disimpan — hanya dataUrl in-memory
    streamRef.current?.getTracks().forEach(t => t.stop())
    onCapture(dataUrl)
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#EBF4FF', border: '2px solid #AAD3FF' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#AAD3FF' }}>
        <p className="text-sm font-semibold" style={{ color: '#003369' }}>Skin Scanner</p>
        <button type="button" onClick={onClose} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#D0DCF0', color: '#003369' }}>
          Tutup
        </button>
      </div>

      {/* Video */}
      <div className="relative" style={{ minHeight: 340 }}>
        {error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 p-6 text-center">
            <p className="text-sm" style={{ color: '#B14432' }}>{error}</p>
            <button type="button" onClick={() => startCamera(facingMode)} className="text-xs font-medium px-4 py-2 rounded-full" style={{ backgroundColor: '#EBF4FF', color: '#1A5BA1', border: '1px solid #1A5BA1' }}>
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full object-cover"
              style={{ display: ready ? 'block' : 'none', maxHeight: 720 }}
            />
            {!ready && (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#AAD3FF', borderTopColor: '#1A5BA1' }} />
              </div>
            )}
            {/* Corner brackets — like gambar */}
            {ready && (
              <>
                <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 rounded-tl" style={{ borderColor: 'rgba(255,255,255,0.8)' }} />
                <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 rounded-tr" style={{ borderColor: 'rgba(255,255,255,0.8)' }} />
                <div className="absolute bottom-16 left-3 w-8 h-8 border-l-2 border-b-2 rounded-bl" style={{ borderColor: 'rgba(255,255,255,0.8)' }} />
                <div className="absolute bottom-16 right-3 w-8 h-8 border-r-2 border-b-2 rounded-br" style={{ borderColor: 'rgba(255,255,255,0.8)' }} />
              </>
            )}
          </>
        )}

        {/* Controls */}
        {ready && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-6">
            {/* Flip camera */}
            <button
              type="button"
              onClick={() => setFacingMode(m => m === 'user' ? 'environment' : 'user')}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              aria-label="Ganti kamera"
            >
              <IcRotate />
            </button>

            {/* Shutter */}
            <button
              type="button"
              onClick={handleCapture}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
              style={{ backgroundColor: '#1A5BA1' }}
              aria-label="Ambil foto"
            >
              <IcCameraShutter />
            </button>

            <div className="w-10" /> {/* spacer */}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main SimulasiTab
// ---------------------------------------------------------------------------
export function SimulasiTab({ workspace }: Props) {
  const [phase, setPhase]               = useState<ScanPhase>('idle')
  const [skinImageUrl, setSkinImageUrl] = useState<string | null>(null)
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('')
  const [appliedFormulaId, setAppliedFormulaId]   = useState<string>('')
  const [applyProgress, setApplyProgress] = useState(0)
  const [applying, setApplying]           = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const donePredictions = workspace.predictions.filter(p => p.status === 'done')
  const formulaWithPred = workspace.formulas.filter(f => donePredictions.some(p => p.formula_id === f.id))
  const allFormulas     = workspace.formulas

  const appliedFormula = allFormulas.find(f => f.id === appliedFormulaId) ?? null

  // Handle file upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target?.result as string
      setSkinImageUrl(url)
      // Reset file input — file tidak tersimpan
      e.target.value = ''
      triggerProcessing()
    }
    reader.readAsDataURL(file)
  }

  // Handle camera capture
  function handleCameraCapture(dataUrl: string) {
    setSkinImageUrl(dataUrl)
    setPhase('processing')
    setTimeout(() => setPhase('ready'), 2800)
  }

  function triggerProcessing() {
    setPhase('processing')
    setTimeout(() => setPhase('ready'), 2800)
  }

  // Apply formula with animated progress
  function handleApplyFormula() {
    if (!selectedFormulaId) return
    setApplying(true)
    setApplyProgress(0)
    const interval = setInterval(() => {
      setApplyProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setAppliedFormulaId(selectedFormulaId)
          setApplying(false)
          return 100
        }
        return p + 4
      })
    }, 40)
  }

  function handleReset() {
    setPhase('idle')
    setSkinImageUrl(null)
    setAppliedFormulaId('')
    setApplyProgress(0)
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base" style={{ color: '#003369' }}>Simulasi Formulasi pada Kulit</h3>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: '#003369', opacity: 0.55 }}>
            Foto atau upload gambar kulit, lalu terapkan formulasi ke model 3D untuk melihat simulasi efek produk.
          </p>
        </div>
        {phase !== 'idle' && (
          <button type="button" onClick={handleReset} className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: '#D0DCF0', color: '#B14432' }}>
            Reset
          </button>
        )}
      </div>

      {/* ── Phase: idle ── */}
      {phase === 'idle' && (
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#EBF4FF' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#1A5BA1' }}>Skin Scanner:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl py-8 px-4 transition-all text-center"
              style={{ backgroundColor: '#fff', border: '1.5px solid #AAD3FF' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#1A5BA1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#AAD3FF')}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#EBF4FF' }}>
                <IcUpload />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#003369' }}>Upload Picture</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#003369', opacity: 0.55 }}>
                  Unggah foto yang ingin dianalisis
                </p>
              </div>
            </button>

            {/* Camera */}
            <button
              type="button"
              onClick={() => setPhase('camera')}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl py-8 px-4 transition-all text-center"
              style={{ backgroundColor: '#fff', border: '1.5px solid #AAD3FF' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#1A5BA1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#AAD3FF')}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#EBF4FF' }}>
                <IcCamera />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#003369' }}>Open Camera</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#003369', opacity: 0.55 }}>
                  Buka kamera, tangkap gambar, dan mulai analisis
                </p>
              </div>
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* ── Phase: camera ── */}
      {phase === 'camera' && (
        <CameraView
          onCapture={handleCameraCapture}
          onClose={() => setPhase('idle')}
        />
      )}

      {/* ── Phase: processing ── */}
      {phase === 'processing' && (
        <div className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center" style={{ backgroundColor: '#EBF4FF', border: '1px solid #AAD3FF' }}>
          {skinImageUrl && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow mb-2" style={{ border: '2px solid #AAD3FF' }}>
              <img src={skinImageUrl} alt="Foto kulit" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#AAD3FF', borderTopColor: '#1A5BA1' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: '#003369' }}>Membuat model 3D kulit…</p>
            <p className="text-xs mt-1" style={{ color: '#003369', opacity: 0.5 }}>
              Menganalisis tekstur, pori, dan kontur permukaan kulit
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-64 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#D0DCF0' }}>
            <ProcessingBar />
          </div>
          <p className="text-[11px]" style={{ color: '#003369', opacity: 0.4 }}>
            Foto tidak disimpan ke server — diproses secara lokal
          </p>
        </div>
      )}

      {/* ── Phase: ready ── */}
      {phase === 'ready' && (
        <div className="flex flex-col gap-4">

          {/* ── Row 1: Laporan Kulit + Terapkan Formulasi side by side ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Laporan Kulit — spans 2 cols */}
            <div className="lg:col-span-2 rounded-2xl border p-5" style={{ borderColor: '#AAD3FF', backgroundColor: '#EBF4FF' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color: '#003369' }}>Laporan Kulit</p>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#1A5BA1', color: '#fff' }}>
                  Terdeteksi
                </span>
              </div>

              {/* Tipe Kulit */}
              <p className="text-xs font-semibold mb-2" style={{ color: '#1A5BA1' }}>Tipe Kulit:</p>
              <div className="flex gap-3 mb-4 rounded-xl border p-3" style={{ borderColor: '#AAD3FF', backgroundColor: '#fff' }}>
                {/* Foto referensi / placeholder */}
                <div className="shrink-0 rounded-lg overflow-hidden" style={{ width: 120, height: 120, border: '1px solid #D0DCF0', backgroundColor: '#F2F4F7' }}>
                  {skinImageUrl ? (
                    <img src={skinImageUrl} alt="Foto kulit" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#AAD3FF" strokeWidth="1.5" aria-hidden>
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    </div>
                  )}
                </div>
                {/* Skin type info */}
                <div className="flex flex-col justify-center gap-1">
                  <p className="text-sm font-bold" style={{ color: '#003369' }}>Oily</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#003369', opacity: 0.65 }}>
                    Jenis kulit yang ditandai dengan produksi sebum (minyak alami)
                    berlebih oleh kelenjar sebasea, sehingga membuat permukaan wajah
                    tampak mengkilap, terasa lengket, dan lebih rentan terhadap pori-
                    pori tersumbat serta jerawat.
                  </p>
                </div>
              </div>

              {/* Detail Permasalahan Kulit */}
              <p className="text-xs font-semibold mb-2" style={{ color: '#1A5BA1' }}>Detail Permasalahan Kulit:</p>
              <div className="flex flex-wrap gap-2">
                {['Pori-pori dan tekstur', 'Produksi sebum berlebih', 'Rentan jerawat'].map((issue) => (
                  <span
                    key={issue}
                    className="text-xs px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: '#AAD3FF', backgroundColor: '#fff', color: '#003369' }}
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>

            {/* Terapkan Formulasi — 1 col */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#84A0E4' }}>Terapkan Formulasi</p>

              {allFormulas.length === 0 ? (
                <div className="rounded-xl p-4 text-center flex-1" style={{ backgroundColor: '#EBF4FF', border: '1px solid #AAD3FF' }}>
                  <p className="text-xs" style={{ color: '#003369', opacity: 0.6 }}>
                    Belum ada formula. Buat formula di tab Formula terlebih dahulu.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                  {allFormulas.map(f => {
                    const hasPred    = donePredictions.some(p => p.formula_id === f.id)
                    const isSelected = f.id === selectedFormulaId
                    const isApplied  = f.id === appliedFormulaId
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFormulaId(f.id)}
                        className="w-full text-left px-3 py-2.5 rounded-xl border transition-all"
                        style={{
                          borderColor:       isApplied ? '#2F7D52' : isSelected ? '#1A5BA1' : '#D0DCF0',
                          backgroundColor:   isApplied ? '#DEEFE2' : isSelected ? '#EBF4FF' : '#fff',
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isApplied && <IcSparkle />}
                          <span className="text-xs font-medium truncate" style={{ color: '#003369' }}>{f.nama}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px]" style={{ color: '#003369', opacity: 0.45 }}>
                            {(f.bahan as Ingredient[]).length} bahan
                          </span>
                          {hasPred && (
                            <span className="text-[10px] font-medium px-1 py-0.5 rounded" style={{ backgroundColor: '#EBF4FF', color: '#1A5BA1' }}>
                              Prediksi
                            </span>
                          )}
                          {isApplied && (
                            <span className="text-[10px] font-medium px-1 py-0.5 rounded" style={{ backgroundColor: '#DEEFE2', color: '#2F7D52' }}>
                              ✓ Aktif
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Apply / progress */}
              {selectedFormulaId && (
                applying ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs" style={{ color: '#1A5BA1' }}>Menerapkan…</p>
                      <p className="text-xs font-mono" style={{ color: '#1A5BA1' }}>{applyProgress}%</p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#D0DCF0' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${applyProgress}%`, backgroundColor: '#1A5BA1' }} />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyFormula}
                    disabled={selectedFormulaId === appliedFormulaId}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold text-white transition-colors disabled:opacity-40"
                    style={{ backgroundColor: '#1A5BA1' }}
                  >
                    <IcSparkle />
                    {selectedFormulaId === appliedFormulaId ? 'Sudah diterapkan' : 'Terapkan ke Model 3D'}
                  </button>
                )
              )}

              {/* Applied formula ingredient list */}
              {appliedFormula && (
                <div className="rounded-xl border p-3" style={{ borderColor: '#2F7D52', backgroundColor: '#DEEFE2' }}>
                  <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#1E4F33' }}>Bahan aktif:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(appliedFormula.bahan as Ingredient[]).slice(0, 5).map((b, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <span style={{ color: '#003369', opacity: 0.75 }}>{b.nama}</span>
                        <span className="font-mono" style={{ color: '#1E4F33' }}>{b.persentase.toFixed(1)}%</span>
                      </div>
                    ))}
                    {(appliedFormula.bahan as Ingredient[]).length > 5 && (
                      <p className="text-[10px]" style={{ color: '#003369', opacity: 0.4 }}>
                        +{(appliedFormula.bahan as Ingredient[]).length - 5} lainnya
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Row 2: 3D Skin Model ── */}
          <div className="rounded-2xl border p-5" style={{ borderColor: '#AAD3FF', backgroundColor: '#EBF4FF' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#003369' }}>3D Skin Model</p>
            <p className="text-xs font-semibold mb-4" style={{ color: '#1A5BA1' }}>
              Interaksi langsung dengan model 3D untuk mengecek area fokus kulitmu dari berbagai sisi!
            </p>

            {/* Model centered with max width */}
            <div className="flex justify-center">
              <div style={{ width: '100%', maxWidth: 420 }}>
                <HeadViewer height={340} showCard={false} />
              </div>
            </div>

            {/* Bottom status */}
            <div className="flex items-center justify-center gap-2 mt-3 text-[11px]" style={{ color: '#003369', opacity: 0.5 }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2F7D52' }} />
              Model siap · {skinImageUrl ? 'Foto referensi tersedia' : 'Mode generik'} ·{' '}
              <span style={{ color: '#B14432' }}>Foto tidak disimpan</span>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// Animated processing progress bar
function ProcessingBar() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setPct(p => p >= 95 ? 95 : p + 3), 80)
    return () => clearInterval(iv)
  }, [])
  return (
    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#1A5BA1' }} />
  )
}
