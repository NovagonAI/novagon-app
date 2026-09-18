'use client'

import { useEffect, useRef, useState } from 'react'
import { load3Dmol } from '@/lib/three'

type Status = 'idle' | 'loading' | 'done' | 'flat' | 'no-structure' | 'error'

const cidCache = new Map<string, number | null>()

const PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug'
const getJson = async (url: string) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(12_000) })
  return r.ok ? r.json() : null
}

/**
 * PubChem name lookup, cached per session. Compound names first, then
 * substance names (vendor entries carry INCI spellings), then autocomplete
 * only when the suggestion still starts with the name asked for, so
 * "Hyaluronic Acid" becomes its disaccharide but "Aqua" does not become
 * aquamycin. Blends and polymers still resolve to nothing.
 */
async function lookupCid(name: string): Promise<number | null> {
  const key = name.trim().toLowerCase()
  if (cidCache.has(key)) return cidCache.get(key)!
  let cid: number | null = null
  try {
    const q = encodeURIComponent(name.trim())
    cid = (await getJson(`${PUG}/compound/name/${q}/cids/JSON`))?.IdentifierList?.CID?.[0] ?? null
    if (!cid) cid = (await getJson(`${PUG}/substance/name/${q}/cids/JSON`))?.InformationList?.Information?.find((i: { CID?: number[] }) => i.CID?.length)?.CID?.[0] ?? null
    if (!cid) {
      const terms: string[] = (await getJson(`https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${q}/json?limit=3`))?.dictionary_terms?.compound ?? []
      const hit = terms.find((t) => t.toLowerCase().startsWith(key))
      if (hit) cid = (await getJson(`${PUG}/compound/name/${encodeURIComponent(hit)}/cids/JSON`))?.IdentifierList?.CID?.[0] ?? null
    }
  } catch {
    cid = null
  }
  cidCache.set(key, cid)
  return cid
}

/**
 * Interactive 3D conformer of one ingredient from PubChem, drawn with 3Dmol.js
 * (the viewer Cornel wired first). Drag rotates, wheel zooms. Falls back to a
 * short note when PubChem has no structure for the name.
 */
export function MoleculeViewer({ name, size = 240, className = '' }: { name: string; size?: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewer = useRef<any>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [style, setStyle] = useState<'stick' | 'sphere'>('stick')

  useEffect(() => {
    let dead = false
    const run = async () => {
      if (!box.current || !name) return
      setStatus('loading')
      try {
        await load3Dmol()
        const cid = await lookupCid(name)
        if (dead) return
        if (!cid) return setStatus('no-structure')
        // conformers exist for small molecules only, larger ones fall back to the flat 2D record
        let flat = false
        let r = await fetch(`${PUG}/compound/cid/${cid}/SDF?record_type=3d`, { signal: AbortSignal.timeout(15_000) })
        if (r.status === 404) {
          flat = true
          r = await fetch(`${PUG}/compound/cid/${cid}/SDF?record_type=2d`, { signal: AbortSignal.timeout(15_000) })
        }
        if (dead) return
        if (r.status === 404) return setStatus('no-structure')
        if (!r.ok) throw new Error(String(r.status))
        const sdf = await r.text()
        if (!viewer.current) viewer.current = window.$3Dmol.createViewer(box.current, { backgroundColor: '#f5f5f5', antialias: true })
        const v = viewer.current
        v.clear()
        v.addModel(sdf, 'sdf')
        v.setStyle({}, style === 'stick' ? { stick: { colorscheme: 'Jmol', radius: 0.14 }, sphere: { colorscheme: 'Jmol', radius: 0.28 } } : { sphere: { colorscheme: 'Jmol', scale: 0.42 } })
        v.zoomTo()
        v.render()
        v.spin('y', 0.4)
        setStatus(flat ? 'flat' : 'done')
      } catch {
        if (!dead) setStatus('error')
      }
    }
    run()
    return () => {
      dead = true
    }
  }, [name, style])

  return (
    <div className={`relative overflow-hidden rounded-full bg-[#f5f5f5] ${className}`} style={{ width: size, height: size }}>
      <div ref={box} className="absolute inset-0" style={{ width: size, height: size }} />
      {status !== 'done' && status !== 'flat' && (
        <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-[11px] font-semibold text-grey-text">
          {status === 'loading' ? 'Memuat struktur 3D dari PubChem' : status === 'no-structure' ? 'PubChem tidak punya struktur 3D untuk nama ini' : status === 'error' ? 'Struktur 3D gagal dimuat' : ''}
        </p>
      )}
      {status === 'flat' && <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-[24px] bg-white/80 px-2 py-[1px] text-[10px] font-bold text-grey-text">struktur 2D</span>}
      {(status === 'done' || status === 'flat') && (
        <button
          type="button"
          onClick={() => setStyle(style === 'stick' ? 'sphere' : 'stick')}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-[24px] bg-navy/70 px-3 py-[2px] text-[10px] font-bold text-white"
        >
          {style === 'stick' ? 'stick' : 'sphere'}
        </button>
      )}
    </div>
  )
}
