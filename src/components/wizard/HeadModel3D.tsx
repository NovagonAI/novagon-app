'use client'

import { useEffect, useRef, useState } from 'react'
import { loadThree } from '@/lib/three'

/**
 * The average female head (Dataset/Female Average Head.obj, served from
 * /female-head.obj) tinted with the measured skin colour. Standard material
 * under a soft three-point rig with sRGB output, so the tint reads as the
 * hex given instead of washing out. Drag to orbit, it springs back.
 */
export function HeadModel3D({ hex = '#E0C9B4', height = 520 }: { hex?: string; height?: number }) {
  const mount = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meshRef = useRef<any>(null)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

  const tint = (hexColor: string) => {
    const THREE = window.THREE
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(hexColor).convertSRGBToLinear(), roughness: 0.62, metalness: 0 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meshRef.current?.traverse((c: any) => {
      if (c.isMesh) c.material = mat
    })
  }

  useEffect(() => {
    if (meshRef.current && window.THREE) tint(hex)
  }, [hex])

  useEffect(() => {
    const el = mount.current
    if (!el) return
    let dead = false
    let raf = 0
    let cleanup = () => {}
    loadThree(['OBJLoader', 'OrbitControls'])
      .then(() => {
        if (dead) return
        const THREE = window.THREE
        const w = el.clientWidth || 300
        const h = height
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xffffff)
        const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 1000)
        camera.position.set(0, 2, 58)
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
        renderer.setSize(w, h)
        renderer.outputEncoding = THREE.sRGBEncoding
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.0
        el.innerHTML = ''
        el.appendChild(renderer.domElement)
        // three-point rig: warm key from the front-left, cool fill, rim from behind
        scene.add(new THREE.HemisphereLight(0xffffff, 0xd9e6f2, 0.45))
        const key = new THREE.DirectionalLight(0xfff2e6, 1.1)
        key.position.set(-18, 24, 40)
        scene.add(key)
        const fill = new THREE.DirectionalLight(0xdcecff, 0.45)
        fill.position.set(26, 6, 30)
        scene.add(fill)
        const rim = new THREE.DirectionalLight(0xffffff, 0.5)
        rim.position.set(0, 18, -40)
        scene.add(rim)
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
            obj.position.copy(centre).multiplyScalar(-s)
            scene.add(obj)
            meshRef.current = obj
            tint(hex)
            setStatus('done')
          },
          undefined,
          () => setStatus('error'),
        )
        const tick = () => {
          raf = requestAnimationFrame(tick)
          if (idle >= 0 && ++idle > 40) {
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
          {status === 'loading' ? 'Memuat model 3D' : 'Model 3D tidak bisa dimuat, butuh WebGL dan koneksi CDN.'}
        </p>
      )}
    </div>
  )
}
