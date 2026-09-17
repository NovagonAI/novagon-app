'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE: any
  }
}

const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
]

let loading: Promise<void> | null = null
/** Three r128 UMD plus OBJLoader and OrbitControls, loaded once in order. */
function loadThree(): Promise<void> {
  if (typeof window !== 'undefined' && window.THREE?.OBJLoader && window.THREE?.OrbitControls) return Promise.resolve()
  if (loading) return loading
  loading = CDN.reduce<Promise<void>>(
    (p, src) =>
      p.then(
        () =>
          new Promise((res, rej) => {
            const s = document.createElement('script')
            s.src = src
            s.onload = () => res()
            s.onerror = () => rej(new Error(`gagal memuat ${src}`))
            document.head.appendChild(s)
          }),
      ),
    Promise.resolve(),
  )
  return loading
}

/**
 * The average female head (Dataset/Female Average Head.obj, served from
 * /female-head.obj) tinted with the Fitzpatrick colour the model returned.
 * Drag to orbit; it springs back to face the viewer.
 */
export function HeadModel3D({ hex = '#E0C9B4', height = 311 }: { hex?: string; height?: number }) {
  const mount = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meshRef = useRef<any>(null)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    if (!meshRef.current || !window.THREE) return
    const THREE = window.THREE
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meshRef.current.traverse((c: any) => {
      if (c.isMesh) c.material = new THREE.MeshPhongMaterial({ color: new THREE.Color(hex), specular: 0x222222, shininess: 12 })
    })
  }, [hex])

  useEffect(() => {
    const el = mount.current
    if (!el) return
    let dead = false
    let raf = 0
    let cleanup = () => {}
    loadThree()
      .then(() => {
        if (dead) return
        const THREE = window.THREE
        const w = el.clientWidth || 300
        const h = height
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xffffff)
        const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 1000)
        camera.position.set(0, 4, 56)
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
        renderer.setSize(w, h)
        el.innerHTML = ''
        el.appendChild(renderer.domElement)
        scene.add(new THREE.HemisphereLight(0xffffff, 0xbfd6ef, 0.9))
        const key = new THREE.DirectionalLight(0xffffff, 0.7)
        key.position.set(20, 30, 40)
        scene.add(key)
        const controls = new THREE.OrbitControls(camera, renderer.domElement)
        controls.enablePan = false
        controls.enableZoom = false
        controls.minPolarAngle = Math.PI / 2 - 0.6
        controls.maxPolarAngle = Math.PI / 2 + 0.5
        controls.minAzimuthAngle = -1.1
        controls.maxAzimuthAngle = 1.1
        let idle = 0
        controls.addEventListener('start', () => (idle = -1))
        controls.addEventListener('end', () => (idle = 0))
        new THREE.OBJLoader().load(
          '/female-head.obj',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (obj: any) => {
            if (dead) return
            const box = new THREE.Box3().setFromObject(obj)
            const size = box.getSize(new THREE.Vector3())
            const centre = box.getCenter(new THREE.Vector3())
            const s = 36 / Math.max(size.x, size.y, size.z)
            obj.scale.setScalar(s)
            // centre after scaling: the offset lives in parent units
            obj.position.copy(centre).multiplyScalar(-s)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            obj.traverse((c: any) => {
              if (c.isMesh) c.material = new THREE.MeshPhongMaterial({ color: new THREE.Color(hex), specular: 0x222222, shininess: 12 })
            })
            scene.add(obj)
            meshRef.current = obj
            setStatus('done')
          },
          undefined,
          () => setStatus('error'),
        )
        const tick = () => {
          raf = requestAnimationFrame(tick)
          if (idle >= 0 && ++idle > 40) {
            // spring back to the front view after a pause
            const az = controls.getAzimuthalAngle()
            if (Math.abs(az) > 0.01) camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -az * 0.05)
          }
          controls.update()
          renderer.render(scene, camera)
        }
        tick()
        cleanup = () => {
          cancelAnimationFrame(raf)
          controls.dispose()
          renderer.dispose()
        }
      })
      .catch(() => setStatus('error'))
    return () => {
      dead = true
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height])

  return (
    <div className="panel-white relative w-full overflow-hidden" style={{ height }}>
      <div ref={mount} className="h-full w-full" />
      {status !== 'done' && (
        <p className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-grey-text">
          {status === 'loading' ? 'Memuat model 3D…' : 'Model 3D tidak bisa dimuat (butuh WebGL dan koneksi CDN).'}
        </p>
      )}
    </div>
  )
}
