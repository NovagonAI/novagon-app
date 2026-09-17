'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { Panel, Box } from '@/components/ui/Panel'
import { FITZ_TEXT, SKIN_TYPE_TEXT, type SkinVerdict, fileToJpeg, skinApi, toJpeg } from '@/lib/skin'
import type { Workspace } from '@/lib/store'
import { HeadModel3D } from './HeadModel3D'

const SCAN_MS = 5000
const SCAN_FRAMES = 24
const MIN_UPLOAD = 20
const MAX_IMAGES = 30

type Mode = 'idle' | 'camera' | 'upload'
type Box = { x: number; y: number; w: number; h: number } | null

/**
 * Skin Scanner: "Aktifkan Kamera" opens the webcam with a live face box, the
 * shutter records a 5 s scan cut into 24 frames; "Upload Picture" collects at
 * least 20 photos in a horizontal strip. Either set goes to the skin-vision
 * service, which returns skin type and Fitzpatrick with confidences.
 */
export function SkinScanner({ ws, update }: { ws: Workspace; update: (p: Partial<Workspace> | ((w: Workspace) => Partial<Workspace>)) => void }) {
  const [mode, setMode] = useState<Mode>('idle')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [face, setFace] = useState<Box>(null)
  const [uploads, setUploads] = useState<string[]>([])
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const tracker = useRef<ReturnType<typeof setInterval>>()

  const stop = () => {
    clearInterval(tracker.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    setFace(null)
  }
  useEffect(() => stop, [])

  const openCamera = async () => {
    setError(null)
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      setMode('camera')
      requestAnimationFrame(() => {
        if (video.current) video.current.srcObject = stream.current
      })
      // live face box: one small frame to the service every 700 ms
      clearInterval(tracker.current)
      tracker.current = setInterval(async () => {
        const v = video.current
        if (!v || v.videoWidth === 0) return
        try {
          const r = await skinApi.face(toJpeg(v, 320, 0.6))
          setFace(r.face ? { x: r.face.x / r.width, y: r.face.y / r.height, w: r.face.w / r.width, h: r.face.h / r.height } : null)
        } catch {
          /* tracking is cosmetic; the scan itself reports errors */
        }
      }, 700)
    } catch (e) {
      setError(`Kamera tidak tersedia: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const analyse = async (images: string[]) => {
    setBusy(`Menganalisis ${images.length} gambar…`)
    setError(null)
    try {
      const verdict = await skinApi.analyze(images.slice(0, MAX_IMAGES), 'cf')
      update({ skin: { ...ws.skin, image: images[Math.floor(images.length / 2)], verdict, type: toLegacy(verdict.skin_type.label), detail: ws.skin.detail } })
      setMode('idle')
      stop()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
      setProgress(0)
    }
  }

  const scan = async () => {
    const v = video.current
    if (!v) return
    if (v.videoWidth === 0) await new Promise<void>((r) => (v.onloadeddata = () => r()))
    clearInterval(tracker.current)
    setBusy('Memindai wajah… tahan posisi 5 detik')
    const frames: string[] = []
    const every = SCAN_MS / SCAN_FRAMES
    for (let i = 0; i < SCAN_FRAMES; i++) {
      frames.push(toJpeg(v, 640))
      setProgress((i + 1) / SCAN_FRAMES)
      await new Promise((r) => setTimeout(r, every))
    }
    await analyse(frames)
  }

  const onFiles = async (files: FileList | null) => {
    if (!files) return
    setError(null)
    const list = [...uploads]
    for (const f of Array.from(files)) {
      if (list.length >= MAX_IMAGES) break
      try {
        list.push(await fileToJpeg(f))
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    }
    setUploads(list)
  }

  const v = ws.skin.verdict
  const skinText = v ? SKIN_TYPE_TEXT[v.skin_type.label] : null

  return (
    <>
      <Panel title="Skin Scanner" className="mt-[18px]" bodyClassName="pt-[20px] pb-[26px]">
        {mode === 'idle' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setMode('upload')} className="panel-white flex h-[173px] flex-col items-center justify-center text-center hover:brightness-[0.98]">
              <Icon name="gallery-add" size={51} className="text-blue" />
              <span className="mt-[14px] text-[16px] font-bold text-navy">Upload Picture</span>
              <span className="mt-[6px] w-[220px] text-[13px] font-semibold text-grey-text">Unggah minimal {MIN_UPLOAD} foto wajah untuk dianalisis</span>
            </button>
            <button type="button" onClick={openCamera} className="panel-white flex h-[173px] flex-col items-center justify-center text-center hover:brightness-[0.98]">
              <Icon name="camera" size={51} className="text-blue" />
              <span className="mt-[14px] text-[16px] font-bold text-navy">Aktifkan Kamera</span>
              <span className="mt-[6px] w-[220px] text-[13px] font-semibold text-grey-text">Buka kamera, lacak wajah, pindai 5 detik</span>
            </button>
          </div>
        )}

        {mode === 'camera' && (
          <div>
            <div className="relative overflow-hidden rounded-[10px] border border-navy bg-black">
              <video ref={video} autoPlay playsInline muted className="aspect-video w-full object-cover" />
              {face && (
                <div
                  className="pointer-events-none absolute rounded-[12px] border-[3px] border-ok shadow-[0_0_0_2000px_rgba(0,0,0,0.25)] transition-all duration-200"
                  style={{ left: `${face.x * 100}%`, top: `${face.y * 100}%`, width: `${face.w * 100}%`, height: `${face.h * 100}%` }}
                />
              )}
              <Corner className="left-4 top-4" />
              <Corner className="right-4 top-4 rotate-90" />
              <Corner className="bottom-4 right-4 rotate-180" />
              <Corner className="bottom-4 left-4 -rotate-90" />
              <span className={`absolute left-4 top-16 rounded-[24px] px-3 py-1 text-[12px] font-bold text-white ${face ? 'bg-ok' : 'bg-grey-nav'}`}>{face ? 'Wajah terdeteksi' : 'Mencari wajah…'}</span>
              {busy && progress > 0 && (
                <div className="absolute inset-x-0 bottom-0 h-[6px] bg-white/40">
                  <div className="h-full bg-sky transition-[width]" style={{ width: `${progress * 100}%` }} />
                </div>
              )}
            </div>
            <div className="mt-[18px] flex items-center justify-center gap-4">
              <button type="button" onClick={scan} disabled={!!busy} className="flex size-[107px] items-center justify-center rounded-full bg-btn-gradient shadow-tile disabled:opacity-60" aria-label="Pindai wajah 5 detik">
                <Icon name="camera-lg" size={67} className="text-white" />
              </button>
              <button
                type="button"
                onClick={() => {
                  stop()
                  setMode('idle')
                }}
                className="btn-outline"
                disabled={!!busy}
              >
                Batal
              </button>
            </div>
            <p className="mt-2 text-center text-[13px] font-semibold text-grey-text">Tekan tombol foto: {SCAN_FRAMES} frame diambil selama {SCAN_MS / 1000} detik, lalu dianalisis.</p>
          </div>
        )}

        {mode === 'upload' && (
          <div>
            <label className="btn-outline cursor-pointer">
              Pilih foto (bisa banyak sekaligus)
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
            </label>
            <span className="ml-3 text-[14px] font-semibold text-grey-text">
              {uploads.length}/{MIN_UPLOAD} minimal · maks {MAX_IMAGES}
            </span>
            {uploads.length > 0 && (
              <ul className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Foto yang diunggah">
                {uploads.map((u, i) => (
                  <li key={i} className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={`Foto ${i + 1}`} src={u} className="h-[110px] w-[110px] rounded-[10px] border border-navy object-cover" />
                    <button type="button" onClick={() => setUploads(uploads.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 text-navy" aria-label={`Hapus foto ${i + 1}`}>
                      <Icon name="close-circle" size={22} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex gap-3">
              <button type="button" onClick={() => analyse(uploads)} disabled={uploads.length < MIN_UPLOAD || !!busy} className="btn-primary h-[50px] min-h-0 text-[16px]">
                Analisis {uploads.length} foto
              </button>
              <button type="button" onClick={() => setMode('idle')} className="btn-outline h-[50px] min-h-0 text-[16px]" disabled={!!busy}>
                Batal
              </button>
            </div>
          </div>
        )}

        {busy && <p className="mt-3 text-[16px] font-semibold text-blue">{busy}</p>}
        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-[16px] font-semibold text-bad">
            <Icon name="danger" size={20} /> {error}
          </p>
        )}
      </Panel>

      <Panel title="Laporan Kulit" className="mt-[18px]" right={<Badge tone={v ? 'blue' : 'grey'}>{v ? 'Terdeteksi' : 'Belum ada'}</Badge>} bodyClassName="pt-[18px] pb-[26px]">
        {v ? (
          <SkinResult v={v} image={ws.skin.image} />
        ) : (
          <p className="text-[16px] font-semibold text-grey-text">Pindai wajah dengan kamera atau unggah minimal {MIN_UPLOAD} foto; hasil klasifikasi jenis kulit dan tipe Fitzpatrick tampil di sini.</p>
        )}
        <label htmlFor="skin-detail" className="label mt-[18px]">
          Detail Permasalahan Kulit:
        </label>
        <input id="skin-detail" name="skin_detail" className="field" value={ws.skin.detail ?? ''} placeholder="Pori-pori dan tekstur" onChange={(e) => update({ skin: { ...ws.skin, detail: e.target.value } })} />
        {skinText && <p className="mt-3 text-justify text-[16px] font-semibold text-grey-text">{skinText.text}</p>}
      </Panel>

      <Panel title="3D Skin Model" className="mt-[18px]" bodyClassName="pt-[18px] pb-[26px]">
        <p className="text-[20px] font-semibold text-navy">
          {v ? `Warna model mengikuti tipe Fitzpatrick ${v.fitzpatrick.label} (${v.fitzpatrick.hex}). Putar untuk melihat dari berbagai sisi.` : 'Interaksi langsung dengan model 3D untuk mengecek area fokus kulitmu dari berbagai sisi!'}
        </p>
        <div className="mx-auto mt-[24px] max-w-[420px]">
          <HeadModel3D hex={v?.fitzpatrick.hex ?? '#E0C9B4'} />
        </div>
      </Panel>
    </>
  )
}

function toLegacy(label: SkinVerdict['skin_type']['label']): Workspace['skin']['type'] {
  return label === 'Oily' ? 'oily' : label === 'Dry' ? 'dry' : label === 'Sensitive' ? 'sensitive' : 'normal'
}

/** Verdict block: type + confidence, Fitzpatrick + confidence, sample photos of the class. */
function SkinResult({ v, image }: { v: SkinVerdict; image?: string }) {
  const [samples, setSamples] = useState<Array<{ name: string; data: string }>>([])
  useEffect(() => {
    let alive = true
    skinApi
      .samples(v.skin_type.label, 4)
      .then((r) => alive && setSamples(r.images))
      .catch(() => alive && setSamples([]))
    return () => {
      alive = false
    }
  }, [v.skin_type.label])
  const pct = (x: number) => `${Math.round(x * 100)}%`
  return (
    <div className="grid gap-4 lg:grid-cols-[193px_minmax(0,1fr)]">
      <div className="size-[193px] overflow-hidden rounded-[10px] border border-navy bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image ? <img alt="Frame yang dianalisis" src={image} className="size-full object-cover" /> : <img alt="" src="/figma/skin-oily.png" className="size-full object-cover" />}
      </div>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Box className="px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-grey-text">Tipe Kulit</p>
            <p className="text-[24px] font-bold text-navy">{SKIN_TYPE_TEXT[v.skin_type.label].title}</p>
            <p className="text-[14px] font-semibold text-black">
              Confidence {pct(v.skin_type.confidence)} · {pct(v.skin_type.agreement)} frame setuju
            </p>
            <Bars probs={v.skin_type.probs} />
          </Box>
          <Box className="px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-grey-text">Tipe Fitzpatrick</p>
            <p className="flex items-center gap-2 text-[24px] font-bold text-navy">
              <span className="inline-block size-6 rounded-full border border-navy" style={{ background: v.fitzpatrick.hex }} /> Tipe {v.fitzpatrick.label}
            </p>
            <p className="text-[14px] font-semibold text-black">
              Confidence {pct(v.fitzpatrick.confidence)} · {pct(v.fitzpatrick.agreement)} frame setuju
            </p>
            <p className="text-[12px] font-medium text-grey-text">{FITZ_TEXT[v.fitzpatrick.label]}</p>
          </Box>
        </div>
        <p className="text-[12px] font-medium text-grey-text">
          {v.n_images} gambar · wajah terdeteksi di {v.faces_found} · agregasi {v.aggregation === 'cf' ? 'Certainty Factor' : 'rata-rata'} · {v.seconds}s · {v.note}
        </p>
        {samples.length > 0 && (
          <div>
            <p className="text-[13px] font-bold text-navy">Contoh kulit {v.skin_type.label} dari dataset (acak):</p>
            <ul className="mt-2 flex gap-2 overflow-x-auto">
              {samples.map((s) => (
                <li key={s.name} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={`Contoh ${v.skin_type.label}`} src={s.data} className="h-[96px] w-[96px] rounded-[10px] border border-line object-cover" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function Bars({ probs }: { probs: Record<string, number> }) {
  const rows = Object.entries(probs).sort((a, b) => b[1] - a[1])
  return (
    <ul className="mt-2 space-y-1">
      {rows.map(([k, p]) => (
        <li key={k} className="flex items-center gap-2 text-[11px] font-semibold text-grey-text">
          <span className="w-[74px] truncate">{k}</span>
          <span className="h-[6px] flex-1 overflow-hidden rounded bg-grey-track">
            <span className="block h-full rounded bg-blue" style={{ width: `${p * 100}%` }} />
          </span>
          <span className="w-[34px] text-right">{Math.round(p * 100)}%</span>
        </li>
      ))}
    </ul>
  )
}

function Corner({ className }: { className: string }) {
  return <span className={`absolute h-[41px] w-[48px] rounded-tl-[14px] border-l-[5px] border-t-[5px] border-white ${className}`} aria-hidden="true" />
}
