/**
 * three.js r128 as UMD globals, loaded once from the CDN, plus the example
 * loaders and controls the app uses (OBJLoader, GLTFLoader, OrbitControls).
 * One global keeps the head, hand and molecule viewers on the same build.
 */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $3Dmol: any
  }
}

const CORE = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
const EXTRAS: Record<string, string> = {
  OBJLoader: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js',
  GLTFLoader: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
  OrbitControls: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
}

const pending = new Map<string, Promise<void>>()

function script(src: string): Promise<void> {
  const known = pending.get(src)
  if (known) return known
  const p = new Promise<void>((res, rej) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => res()
    s.onerror = () => rej(new Error(`gagal memuat ${src}`))
    document.head.appendChild(s)
  })
  pending.set(src, p)
  return p
}

export async function loadThree(extras: Array<keyof typeof EXTRAS> = []): Promise<void> {
  if (!window.THREE) await script(CORE)
  for (const name of extras) if (!window.THREE[name]) await script(EXTRAS[name])
}

const MOL = 'https://3dmol.csb.pitt.edu/build/3Dmol-min.js'
export async function load3Dmol(): Promise<void> {
  if (!window.$3Dmol) await script(MOL)
}
