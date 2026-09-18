/**
 * Client for the skin vision service (skin-vision repo, /v1/skin). Same-origin
 * path by default: next.config.js rewrites /api/skin/* to SKIN_UPSTREAM.
 */
const BASE = process.env.NEXT_PUBLIC_SKIN_BASE ?? '/api/skin'

export const SKIN_TYPES = ['Combination', 'Dry', 'Normal', 'Oily', 'Sensitive'] as const
export type SkinTypeLabel = (typeof SKIN_TYPES)[number]

export interface SkinVerdict {
  n_images: number
  faces_found: number
  aggregation: 'mean' | 'cf'
  skin_type: { label: SkinTypeLabel; confidence: number; agreement: number; probs: Record<string, number> }
  fitzpatrick: { label: string; index: number; confidence: number; agreement: number; probs: Record<string, number>; hex: string }
  /** Median skin colour measured on the face crops, else the Fitzpatrick band colour. */
  skin_hex?: string
  skin_hex_measured?: boolean
  per_image: Array<{ skin: string; fitz: string; face: { x: number; y: number; w: number; h: number } | null }>
  seconds: number
  note: string
}

async function call<T>(path: string, init: RequestInit = {}, timeoutMs = 120_000): Promise<T> {
  const url = BASE.startsWith('/') ? `${window.location.origin}${BASE}${path}` : `${BASE}${path}`
  const res = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init.headers ?? {}) }, signal: AbortSignal.timeout(timeoutMs) })
  const text = await res.text()
  if (!res.ok) {
    let detail = text.slice(0, 200)
    try {
      detail = JSON.parse(text).detail ?? detail
    } catch {
      /* not json */
    }
    throw new Error(`Skin service ${res.status}: ${detail}`)
  }
  return JSON.parse(text) as T
}

export const skinApi = {
  health: () => call<{ status: string; device: string; max_images: number }>('/health', {}, 10_000),
  face: (image: string) => call<{ width: number; height: number; face: { x: number; y: number; w: number; h: number } | null }>('/face', { method: 'POST', body: JSON.stringify({ image }) }, 8_000),
  analyze: (images: string[], aggregation: 'mean' | 'cf' = 'cf') =>
    call<SkinVerdict>('/analyze', { method: 'POST', body: JSON.stringify({ images, aggregation }) }, 180_000),
  samples: (type: string, n = 4) => call<{ images: Array<{ name: string; data: string }> }>(`/samples/${type}?n=${n}`, {}, 30_000),
}

/** Downscale a frame or file to a JPEG data URL the service can chew quickly. */
export function toJpeg(source: HTMLVideoElement | HTMLImageElement, maxSide = 640, quality = 0.85): string {
  const w = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth
  const h = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight
  const s = Math.min(1, maxSide / Math.max(w, h))
  const c = document.createElement('canvas')
  c.width = Math.round(w * s)
  c.height = Math.round(h * s)
  c.getContext('2d')?.drawImage(source, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', quality)
}

export function fileToJpeg(file: File, maxSide = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(toJpeg(img, maxSide))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`${file.name}: bukan gambar`))
    }
    img.src = url
  })
}

/** Skin type narratives keyed by the model's class names. */
export const SKIN_TYPE_TEXT: Record<SkinTypeLabel, { title: string; text: string }> = {
  Oily: {
    title: 'Oily',
    text: 'Jenis kulit yang ditandai dengan produksi sebum (minyak alami) berlebih oleh kelenjar sebasea, sehingga membuat permukaan wajah tampak mengkilap, terasa lengket, dan lebih rentan terhadap pori-pori tersumbat serta jerawat.',
  },
  Dry: {
    title: 'Dry',
    text: 'Produksi sebum rendah dan sawar kulit lemah: terasa kering, kasar, mudah mengelupas, dan cepat kehilangan air (TEWL tinggi). Butuh humektan, emolien, dan bahan pemulih barrier.',
  },
  Normal: {
    title: 'Normal',
    text: 'Produksi sebum seimbang, tekstur halus, pori tidak menonjol. Toleran terhadap sebagian besar bahan aktif, fokus pada perawatan dan perlindungan.',
  },
  Combination: {
    title: 'Combination',
    text: 'Area T (dahi, hidung, dagu) berminyak sementara pipi normal hingga kering. Formula perlu menyeimbangkan kontrol sebum dan hidrasi.',
  },
  Sensitive: {
    title: 'Sensitive',
    text: 'Mudah bereaksi terhadap rangsangan luar: kemerahan, perih, gatal. Hindari alkohol, parfum, dan iritan, pH mendekati fisiologis dan bahan penenang.',
  },
}

export const FITZ_TEXT: Record<string, string> = {
  I: 'Sangat cerah, selalu terbakar, tidak pernah menjadi cokelat.',
  II: 'Cerah, mudah terbakar, jarang menjadi cokelat.',
  III: 'Cerah-sedang, kadang terbakar, perlahan menjadi cokelat.',
  IV: 'Sedang (zaitun), jarang terbakar, mudah menjadi cokelat.',
  V: 'Cokelat, sangat jarang terbakar.',
  VI: 'Cokelat tua, tidak pernah terbakar.',
}
