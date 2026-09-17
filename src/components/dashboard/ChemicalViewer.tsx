'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Type declaration — 3Dmol.js loaded via CDN script, accessible on window
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $3Dmol: any
  }
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const DUMMY_INGREDIENTS = [
  { name: 'Niacinamide',           cas: '98-92-0'  },
  { name: 'Glycerin',              cas: '56-81-5'  },
  { name: 'Retinol',               cas: '68-26-8'  },
  { name: 'Ascorbic Acid (Vit C)', cas: '50-81-7'  },
  { name: 'Panthenol',             cas: '81-13-0'  },
  { name: 'Squalane',              cas: '111-01-3' },
]

interface CompoundInfo {
  cid: number
  iupacName: string
  molecularFormula: string
  molecularWeight: string
  inchiKey: string
}

type FetchStatus = 'idle' | 'loading-cid' | 'loading-props' | 'done' | 'error'
type ViewMode    = '2d' | '3d'
type MolStyle    = 'stick' | 'sphere' | 'cartoon' | 'surface'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-ink/40">
      <div className="w-8 h-8 rounded-full border-2 border-ocean-200 border-t-ocean-600 animate-spin" />
      <p className="text-xs">{label}</p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-2">
        <svg className="w-5 h-5 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-xs text-danger-600 font-medium">{message}</p>
    </div>
  )
}

function SkeletonLines() {
  return (
    <div className="space-y-2">
      {[75, 90, 65, 80].map((w, i) => (
        <div key={i} className="h-3 bg-slate2 rounded animate-pulse" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3D Viewer (isolated so useEffect runs cleanly on cid change)
// ---------------------------------------------------------------------------
function Viewer3D({ cid }: { cid: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mol3dStatus, setMol3dStatus] = useState<'loading' | 'done' | 'error' | 'no-conformer'>('loading')
  const [molStyle, setMolStyle] = useState<MolStyle>('stick')
  // keep viewer ref so we can re-style without re-fetching SDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null)
  const sdfRef = useRef<string>('')

  const applyStyle = useCallback((viewer: unknown, sdf: string, style: MolStyle) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = viewer as any
    v.clear()
    v.addModel(sdf, 'sdf')

    if (style === 'stick') {
      v.setStyle({}, { stick: { colorscheme: 'Jmol', radius: 0.12 }, sphere: { colorscheme: 'Jmol', radius: 0.25 } })
    } else if (style === 'sphere') {
      v.setStyle({}, { sphere: { colorscheme: 'Jmol', scale: 0.4 } })
    } else if (style === 'cartoon') {
      // cartoon falls back to stick for small molecules
      v.setStyle({}, { stick: { colorscheme: 'ssJmol', radius: 0.15 } })
    } else if (style === 'surface') {
      v.setStyle({}, { stick: { colorscheme: 'Jmol', radius: 0.1 } })
      v.addSurface(window.$3Dmol.SurfaceType.VDW, {
        opacity: 0.7,
        colorscheme: { gradient: 'rwb' },
      })
    }

    v.zoomTo()
    v.render()
  }, [])

  // initialise viewer + fetch SDF
  useEffect(() => {
    if (!containerRef.current) return
    setMol3dStatus('loading')

    // wait for 3Dmol script to be available (lazyOnload)
    let attempts = 0
    const MAX_ATTEMPTS = 40 // 4s total

    const waitFor3Dmol = setInterval(async () => {
      attempts++
      if (!window.$3Dmol) {
        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(waitFor3Dmol)
          setMol3dStatus('error')
        }
        return
      }
      clearInterval(waitFor3Dmol)

      try {
        // fetch 3D SDF conformer from PubChem
        const res = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`
        )
        if (res.status === 404) { setMol3dStatus('no-conformer'); return }
        if (!res.ok) throw new Error('Gagal mengambil SDF')
        const sdf = await res.text()
        sdfRef.current = sdf

        // create viewer — background matches card bg
        const viewer = window.$3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#FFFFFF',
          antialias: true,
          id: `viewer-${cid}`,
        })
        viewerRef.current = viewer
        applyStyle(viewer, sdf, molStyle)
        setMol3dStatus('done')
      } catch {
        setMol3dStatus('error')
      }
    }, 100)

    return () => {
      clearInterval(waitFor3Dmol)
      // clean up viewer on unmount / cid change
      if (viewerRef.current) {
        try { viewerRef.current.clear() } catch { /* ignore */ }
        viewerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid])

  // re-style without re-fetching SDF
  useEffect(() => {
    if (viewerRef.current && sdfRef.current) {
      applyStyle(viewerRef.current, sdfRef.current, molStyle)
    }
  }, [molStyle, applyStyle])

  return (
    <div className="flex flex-col gap-3">
      {/* Viewer container */}
      <div className="relative w-full bg-white rounded-xl border border-slate overflow-hidden" style={{ height: '280px' }}>
        {/* 3Dmol mounts into this div */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Overlay states */}
        {mol3dStatus === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Spinner label="Memuat konformer 3D…" />
          </div>
        )}
        {mol3dStatus === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <ErrorState message="Gagal memuat data 3D" />
          </div>
        )}
        {mol3dStatus === 'no-conformer' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <p className="text-xs text-ink/50 font-medium">Konformer 3D tidak tersedia</p>
              <p className="text-xs text-ink/40 mt-1">PubChem tidak memiliki data 3D untuk senyawa ini</p>
            </div>
          </div>
        )}

        {/* Interaction hint — only when loaded */}
        {mol3dStatus === 'done' && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-ink/60 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none">
            Drag untuk putar · Scroll untuk zoom
          </div>
        )}
      </div>

      {/* Style controls */}
      {mol3dStatus === 'done' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/40 shrink-0">Tampilan:</span>
          {(['stick', 'sphere', 'surface'] as MolStyle[]).map((s) => (
            <button
              key={s}
              onClick={() => setMolStyle(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                molStyle === s
                  ? 'bg-ocean-600 text-white border-ocean-600'
                  : 'border-slate text-ink/60 hover:border-ocean-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ChemicalViewer() {
  const [selected, setSelected]   = useState(DUMMY_INGREDIENTS[0])
  const [info, setInfo]           = useState<CompoundInfo | null>(null)
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle')
  const [errorMsg, setErrorMsg]   = useState('')
  const [viewMode, setViewMode]   = useState<ViewMode>('2d')

  async function fetchCompound(cas: string) {
    setFetchStatus('loading-cid')
    setInfo(null)
    setErrorMsg('')

    try {
      // Step 1: CAS → CID
      const cidRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cas)}/cids/JSON`
      )
      if (!cidRes.ok) throw new Error('Senyawa tidak ditemukan di PubChem')
      const cidJson = await cidRes.json()
      const cid: number = cidJson.IdentifierList?.CID?.[0]
      if (!cid) throw new Error('CID tidak tersedia')

      setFetchStatus('loading-props')

      // Step 2: CID → properties
      const propRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName,MolecularFormula,MolecularWeight,InChIKey/JSON`
      )
      if (!propRes.ok) throw new Error('Gagal mengambil properti senyawa')
      const propJson = await propRes.json()
      const props = propJson.PropertyTable?.Properties?.[0]

      setInfo({
        cid,
        iupacName:        props?.IUPACName        ?? '—',
        molecularFormula: props?.MolecularFormula  ?? '—',
        molecularWeight:  props?.MolecularWeight   ?? '—',
        inchiKey:         props?.InChIKey          ?? '—',
      })
      setFetchStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setFetchStatus('error')
    }
  }

  function handleSelect(ingredient: typeof DUMMY_INGREDIENTS[0]) {
    setSelected(ingredient)
    setViewMode('2d') // reset to 2D on new selection
    fetchCompound(ingredient.cas)
  }

  const imageUrl2d = info
    ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${info.cid}/PNG?image_size=300x300`
    : null

  return (
    <div className="rounded-xl border border-slate bg-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-serif text-lg text-ink">Visualisasi Struktur Kimia</h2>
          <p className="text-xs text-ink/50 mt-0.5">Data live dari PubChem · klik bahan untuk memuat</p>
        </div>
        {info && (
          <a
            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${info.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ocean-600 hover:text-ocean-700 underline underline-offset-2 shrink-0 ml-4"
          >
            Buka di PubChem ↗
          </a>
        )}
      </div>

      {/* Ingredient selector pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {DUMMY_INGREDIENTS.map((ing) => (
          <button
            key={ing.cas}
            onClick={() => handleSelect(ing)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 ${
              selected.cas === ing.cas
                ? 'bg-ocean-600 text-white border-ocean-600'
                : 'bg-paper text-ink/70 border-slate hover:border-ocean-300 hover:text-ink'
            }`}
          >
            {ing.name}
            <span className="ml-1.5 font-mono opacity-60">{ing.cas}</span>
          </button>
        ))}
      </div>

      {/* 2D / 3D tab toggle — only show once compound is loaded */}
      {fetchStatus === 'done' && (
        <div className="flex items-center gap-1 mb-5 bg-slate2 rounded-lg p-1 w-fit">
          {(['2d', '3d'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`text-xs font-medium px-4 py-1.5 rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-card text-ocean-700 shadow-sm'
                  : 'text-ink/50 hover:text-ink'
              }`}
            >
              {mode === '2d' ? 'Struktur 2D' : 'Visualisasi 3D'}
            </button>
          ))}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Left: viewer */}
        <div>
          {/* ---- 2D view ---- */}
          {(viewMode === '2d' || fetchStatus !== 'done') && (
            <div className="flex flex-col items-center justify-center bg-paper rounded-xl border border-slate min-h-[220px] p-4">
              {fetchStatus === 'loading-cid' && <Spinner label="Mencari CID…" />}
              {fetchStatus === 'loading-props' && <Spinner label="Memuat properti…" />}
              {fetchStatus === 'error' && <ErrorState message={errorMsg} />}
              {fetchStatus === 'idle' && (
                <p className="text-xs text-ink/40 text-center">
                  Pilih bahan aktif di atas<br />untuk menampilkan strukturnya
                </p>
              )}
              {fetchStatus === 'done' && imageUrl2d && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl2d}
                  alt={`Struktur 2D ${selected.name}`}
                  className="max-w-full max-h-52 object-contain"
                />
              )}
            </div>
          )}

          {/* ---- 3D view ---- */}
          {viewMode === '3d' && fetchStatus === 'done' && info && (
            <Viewer3D cid={info.cid} />
          )}
        </div>

        {/* Right: properties */}
        <div className="flex flex-col justify-center space-y-3">
          <div>
            <p className="text-xs text-ink/50 mb-1">Bahan aktif</p>
            <p className="font-serif text-lg text-ink">{selected.name}</p>
            <p className="font-mono text-xs text-ink/40 mt-0.5">CAS {selected.cas}</p>
          </div>

          {fetchStatus === 'done' && info ? (
            <>
              <div className="h-px bg-slate" />
              <dl className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-ink/50 mb-0.5">Nama IUPAC</dt>
                  <dd className="text-xs text-ink/80 leading-relaxed break-words">{info.iupacName}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-ink/50 mb-0.5">Rumus molekul</dt>
                    <dd className="font-mono text-sm text-ink font-medium">{info.molecularFormula}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink/50 mb-0.5">Berat molekul</dt>
                    <dd className="font-mono text-sm text-ink font-medium">{info.molecularWeight} g/mol</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs text-ink/50 mb-0.5">InChIKey</dt>
                  <dd className="font-mono text-[10px] text-ink/50 break-all">{info.inchiKey}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink/50 mb-0.5">PubChem CID</dt>
                  <dd className="font-mono text-xs text-ocean-700">{info.cid}</dd>
                </div>
              </dl>
            </>
          ) : fetchStatus === 'loading-cid' || fetchStatus === 'loading-props' ? (
            <SkeletonLines />
          ) : fetchStatus === 'idle' ? (
            <p className="text-xs text-ink/40">Data properti akan muncul di sini setelah bahan dipilih.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
