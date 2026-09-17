'use client'

import { useEffect, useRef, useState } from 'react'
import { api, describeError } from '@/lib/api'
import { SKIN_TYPES } from '@/lib/catalog'
import { skinTypeFrom } from '@/lib/insight'
import type { SkinReport, Workspace } from '@/lib/store'
import { ArtIcon, Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Panel, Box } from '@/components/ui/Panel'
import { toFormula } from './analysis'

type Mode = 'choose' | 'camera' | 'preview'

/**
 * Skin Scanner: upload or camera, then heads H9 (concerns) and H10 (tone).
 * The photo never leaves the browser except as the prediction payload, and
 * it is not stored in the workspace beyond a downscaled preview.
 */
export function SkinScanner({ ws, update }: { ws: Workspace; update: (p: Partial<Workspace> | ((w: Workspace) => Partial<Workspace>)) => void }) {
  const [mode, setMode] = useState<Mode>(ws.skin.image ? 'preview' : 'choose')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }
  useEffect(() => stop, [])

  const openCamera = async () => {
    setError(null)
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } }, audio: false })
      setMode('camera')
      requestAnimationFrame(() => {
        if (video.current) video.current.srcObject = stream.current
      })
    } catch (e) {
      setError(`Kamera tidak tersedia: ${describeError(e)}`)
    }
  }

  const analyse = async (dataUrl: string) => {
    setBusy(true)
    setError(null)
    const image_b64 = dataUrl.split(',')[1]
    const body = { formula: toFormula(ws.formula), image_b64 }
    const report: SkinReport = { image: dataUrl }
    const notes: string[] = []
    try {
      const r = await api.predict('H9', body)
      if (r.prediction.kind === 'multilabel') {
        report.concerns = r.prediction.labels.map((l) => ({ name: l.name, p: l.p })).sort((a, b) => b.p - a.p)
        report.type = skinTypeFrom(report.concerns)
        report.detail = report.concerns.filter((c) => c.p >= 0.4).map((c) => c.name).join(', ')
      }
    } catch (e) {
      notes.push(`H9 (masalah kulit): ${describeError(e)}`)
    }
    try {
      const r = await api.predict('H10', body)
      if (r.prediction.kind === 'class') report.tone = { label: r.prediction.label, p: r.prediction.p }
    } catch (e) {
      notes.push(`H10 (warna kulit): ${describeError(e)}`)
    }
    if (!report.type) report.type = ws.skin.type
    report.note = notes.join(' · ') || undefined
    update({ skin: { ...ws.skin, ...report } })
    setBusy(false)
    setMode('preview')
  }

  const capture = () => {
    const v = video.current
    if (!v) return
    const c = document.createElement('canvas')
    c.width = Math.min(v.videoWidth, 1024)
    c.height = Math.round((v.videoHeight / v.videoWidth) * c.width)
    c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height)
    stop()
    analyse(c.toDataURL('image/jpeg', 0.85))
  }

  const onFile = (file: File | undefined) => {
    if (!file) return
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const c = document.createElement('canvas')
      const s = Math.min(1, 1024 / img.width)
      c.width = Math.round(img.width * s)
      c.height = Math.round(img.height * s)
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      analyse(c.toDataURL('image/jpeg', 0.85))
    }
    img.src = url
  }

  const skin = ws.skin
  const type = skin.type ? SKIN_TYPES[skin.type] : null

  return (
    <>
      <Panel title="Skin Scanner" className="mt-[18px]" bodyClassName="pt-[20px] pb-[26px]">
        {mode === 'choose' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="panel-white flex h-[173px] cursor-pointer flex-col items-center justify-center text-center hover:brightness-[0.98]">
              <ArtIcon name="gallery-add" />
              <span className="mt-[14px] text-[16px] font-bold text-navy">Upload Picture</span>
              <span className="mt-[6px] w-[205px] text-[13px] font-semibold text-grey-text">Unggah foto yang ingin dianalisis</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <button type="button" onClick={openCamera} className="panel-white flex h-[173px] flex-col items-center justify-center text-center hover:brightness-[0.98]">
              <ArtIcon name="camera" />
              <span className="mt-[14px] text-[16px] font-bold text-navy">Open Camera</span>
              <span className="mt-[6px] w-[205px] text-[13px] font-semibold text-grey-text">Buka kamera, tangkap gambar, dan mulai analisis</span>
            </button>
          </div>
        )}
        {mode === 'camera' && (
          <div>
            <div className="relative overflow-hidden rounded-[10px] border border-navy bg-black">
              <video ref={video} autoPlay playsInline muted className="aspect-video w-full object-cover" />
              <Corner className="left-4 top-4" />
              <Corner className="right-4 top-4 rotate-90" />
              <Corner className="bottom-4 right-4 rotate-180" />
              <Corner className="bottom-4 left-4 -rotate-90" />
            </div>
            <div className="mt-[18px] flex items-center justify-center gap-4">
              <button type="button" onClick={capture} disabled={busy} className="flex size-[107px] items-center justify-center rounded-full bg-btn-gradient shadow-tile disabled:opacity-60" aria-label="Tangkap gambar">
                <ArtIcon name="camera-lg" size={67} />
              </button>
              <button
                type="button"
                onClick={() => {
                  stop()
                  setMode('choose')
                }}
                className="btn-outline"
              >
                Batal
              </button>
            </div>
          </div>
        )}
        {mode === 'preview' && (
          <div>
            <div className="relative h-[180px] overflow-hidden rounded-[10px] border border-navy bg-black">
              {skin.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Foto kulit yang dianalisis" src={skin.image} className="size-full object-cover" />
              )}
            </div>
            <div className="mt-3 flex gap-3">
              <button type="button" onClick={() => setMode('choose')} className="btn-outline">
                Ambil ulang
              </button>
              {skin.image && (
                <button type="button" onClick={() => analyse(skin.image!)} disabled={busy} className="btn-outline">
                  {busy ? 'Menganalisis…' : 'Analisis ulang'}
                </button>
              )}
            </div>
          </div>
        )}
        {busy && mode !== 'preview' && <p className="mt-3 text-[16px] font-semibold text-blue">Menganalisis gambar…</p>}
        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-[16px] font-semibold text-bad">
            <Icon name="danger" size={20} /> {error}
          </p>
        )}
      </Panel>

      <Panel
        title="Laporan Kulit"
        className="mt-[18px]"
        right={<Badge tone={skin.concerns || skin.type ? 'blue' : 'grey'}>{skin.concerns ? 'Terdeteksi' : skin.type ? 'Manual' : 'Belum ada'}</Badge>}
        bodyClassName="pt-[18px] pb-[26px]"
      >
        <p className="label">Tipe Kulit:</p>
        <div className="grid gap-4 sm:grid-cols-[193px_minmax(0,1fr)]">
          <div className="size-[193px] overflow-hidden rounded-[10px] border border-navy bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/figma/skin-oily.png" className="size-full object-cover" />
          </div>
          <Box className="min-h-[193px] px-4 py-3">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipe kulit">
              {Object.entries(SKIN_TYPES).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={skin.type === k}
                  onClick={() => update({ skin: { ...skin, type: k as SkinReport['type'] } })}
                  className={`chip ${skin.type === k ? 'border-blue bg-blue text-white' : ''}`}
                >
                  {v.title}
                </button>
              ))}
            </div>
            {type ? (
              <>
                <p className="mt-3 text-[20px] font-bold text-black">{type.title}</p>
                <p className="text-justify text-[18px] font-semibold text-grey-text">{type.text}</p>
              </>
            ) : (
              <p className="mt-3 text-[16px] font-semibold text-grey-text">Pindai kulit atau pilih tipe kulit secara manual.</p>
            )}
            {skin.tone && <p className="mt-2 text-[14px] font-semibold text-navy">Warna kulit (ITA): {skin.tone.label} · p={Math.round(skin.tone.p * 100)}%</p>}
            {skin.note && <p className="mt-2 text-[13px] font-medium text-warn-dark">{skin.note}</p>}
          </Box>
        </div>
        <label htmlFor="skin-detail" className="label mt-[18px]">
          Detail Permasalahan Kulit:
        </label>
        <input
          id="skin-detail"
          name="skin_detail"
          className="field"
          value={skin.detail ?? ''}
          placeholder="Pori-pori dan tekstur"
          onChange={(e) => update({ skin: { ...skin, detail: e.target.value } })}
        />
      </Panel>

      <Panel title="3D Skin Model" className="mt-[18px]" bodyClassName="pt-[18px] pb-[26px]">
        <p className="text-[20px] font-semibold text-navy">Interaksi langsung dengan model 3D untuk mengecek area fokus kulitmu dari berbagai sisi!</p>
        <HeadModel focus={skin.detail} />
      </Panel>
    </>
  )
}

function Corner({ className }: { className: string }) {
  return <span className={`absolute h-[41px] w-[48px] rounded-tl-[14px] border-l-[5px] border-t-[5px] border-white ${className}`} aria-hidden="true" />
}

/** A turntable over the head render: drag or arrow keys rotate it. */
function HeadModel({ focus }: { focus?: string }) {
  const [rot, setRot] = useState(0)
  const drag = useRef<number | null>(null)
  return (
    <div className="mt-[30px] flex justify-center">
      <div
        tabIndex={0}
        role="img"
        aria-label={`Model kepala 3D${focus ? `, fokus: ${focus}` : ''}`}
        onPointerDown={(e) => (drag.current = e.clientX)}
        onPointerMove={(e) => {
          if (drag.current == null) return
          setRot((r) => r + (e.clientX - drag.current!) * 0.6)
          drag.current = e.clientX
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setRot((r) => r - 15)
          if (e.key === 'ArrowRight') setRot((r) => r + 15)
        }}
        className="panel-white flex h-[311px] w-[310px] cursor-grab select-none items-center justify-center active:cursor-grabbing"
        style={{ perspective: 900 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/head-3d.png" width={284} height={284} draggable={false} style={{ transform: `rotateY(${rot}deg)`, transition: drag.current == null ? 'transform 120ms' : 'none' }} />
      </div>
    </div>
  )
}
