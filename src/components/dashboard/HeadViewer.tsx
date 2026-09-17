'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE: any
  }
}

export type LoadStatus  = 'waiting' | 'loading' | 'done' | 'error'
export type ShadingMode = 'normal' | 'wireframe' | 'flat'

const MAX_AZIMUTH = Math.PI / 3   // ±60°
const MAX_POLAR   = Math.PI / 4.5 // ±40°
const REST_POLAR  = Math.PI / 2   // straight-on

// Spring-back: small factor = slow & smooth return
const SPRING = 0.03
// Delay after releasing mouse before spring-back starts (ms)
const SPRING_DELAY_MS = 600

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

interface HeadViewerProps {
  height?:   number
  showCard?: boolean
  onLoad?:   () => void
}

export function HeadViewer({ height = 400, showCard = true, onLoad }: HeadViewerProps = {}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [status,  setStatus]  = useState<LoadStatus>('waiting')
  const [shading, setShading] = useState<ShadingMode>('normal')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meshRef        = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef    = useRef<any>(null)
  const rafRef         = useRef<number>(0)
  // Store the actual cleanup function in a ref — avoids attaching props to a number
  const cleanupRef     = useRef<(() => void) | null>(null)

  // Spring-back state: true while user is actively dragging OR within delay window
  const springFrozenRef  = useRef(false)
  const springTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Apply shading on change
  useEffect(() => {
    if (!meshRef.current || !window.THREE) return
    const THREE = window.THREE
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meshRef.current.traverse((child: any) => {
      if (!child.isMesh) return
      if (shading === 'wireframe') {
        child.material = new THREE.MeshBasicMaterial({ color: 0x1A5BA1, wireframe: true })
      } else if (shading === 'flat') {
        child.material = new THREE.MeshLambertMaterial({ color: 0xE0C9B4, flatShading: true })
      } else {
        child.material = new THREE.MeshPhongMaterial({
          color: 0xE0C9B4, specular: 0x1a1a1a, shininess: 14,
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shading])

  useEffect(() => {
    if (!mountRef.current) return
    setStatus('waiting')
    let destroyed = false
    let attempts  = 0
    const MAX_ATTEMPTS = 100

    const pollId = setInterval(() => {
      attempts++
      const THREE = window.THREE
      if (!THREE || !THREE.OBJLoader || !THREE.OrbitControls) {
        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(pollId)
          if (!destroyed) setStatus('error')
        }
        return
      }
      clearInterval(pollId)
      if (destroyed) return
      setStatus('loading')

      // ── Scene ────────────────────────────────────────────────────────────
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xF2F4F7)

      // ── Camera ───────────────────────────────────────────────────────────
      const w = mountRef.current!.clientWidth  || 480
      const h = mountRef.current!.clientHeight || height
      const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 1000)
      camera.position.set(0, 6, 58)

      // ── Renderer ─────────────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h)
      renderer.shadowMap.enabled = true
      mountRef.current!.appendChild(renderer.domElement)

      // ── Lights (dimmed) ───────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff, 0.30))
      const key = new THREE.DirectionalLight(0xfff0e0, 0.60)
      key.position.set(20, 45, 30)
      key.castShadow = true
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xd0e8ff, 0.22)
      fill.position.set(-20, 12, -12)
      scene.add(fill)
      const rim = new THREE.DirectionalLight(0xffffff, 0.12)
      rim.position.set(0, -12, -30)
      scene.add(rim)

      // ── OrbitControls ─────────────────────────────────────────────────────
      const controls = new THREE.OrbitControls(camera, renderer.domElement)
      controls.enableDamping   = true
      controls.dampingFactor   = 0.10
      controls.autoRotate      = false
      controls.enableZoom      = true
      controls.minDistance     = 22
      controls.maxDistance     = 120
      controls.minAzimuthAngle = -MAX_AZIMUTH
      controls.maxAzimuthAngle =  MAX_AZIMUTH
      controls.minPolarAngle   = REST_POLAR - MAX_POLAR
      controls.maxPolarAngle   = REST_POLAR + MAX_POLAR
      controlsRef.current = controls

      // ── Drag detection ────────────────────────────────────────────────────
      // Freeze spring-back while dragging; start delay timer on release
      const el = renderer.domElement

      function onPointerDown() {
        springFrozenRef.current = true
        if (springTimerRef.current) {
          clearTimeout(springTimerRef.current)
          springTimerRef.current = null
        }
      }

      function onPointerUp() {
        // Start the delay before spring-back resumes
        springTimerRef.current = setTimeout(() => {
          springFrozenRef.current = false
          springTimerRef.current  = null
        }, SPRING_DELAY_MS)
      }

      el.addEventListener('mousedown',  onPointerDown)
      el.addEventListener('touchstart', onPointerDown, { passive: true })
      window.addEventListener('mouseup',  onPointerUp)
      window.addEventListener('touchend', onPointerUp)

      // ── OBJ Loader ───────────────────────────────────────────────────────
      const loader = new THREE.OBJLoader()
      loader.load(
        '/female-head.obj',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj: any) => {
          if (destroyed) return
          const box    = new THREE.Box3().setFromObject(obj)
          const centre = new THREE.Vector3()
          box.getCenter(centre)
          const size   = new THREE.Vector3()
          box.getSize(size)
          const scale  = 38 / Math.max(size.x, size.y, size.z)
          obj.scale.setScalar(scale)
          obj.position.sub(centre.multiplyScalar(scale))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          obj.traverse((child: any) => {
            if (!child.isMesh) return
            child.castShadow = child.receiveShadow = true
            child.material = new THREE.MeshPhongMaterial({
              color: 0xE0C9B4, specular: 0x1a1a1a, shininess: 14,
            })
          })
          scene.add(obj)
          meshRef.current = obj
          setStatus('done')
          onLoad?.()
        },
        undefined,
        () => { if (!destroyed) setStatus('error') }
      )

      // ── Animation loop ────────────────────────────────────────────────────
      const spherical = new THREE.Spherical()

      function animate() {
        rafRef.current = requestAnimationFrame(animate)

        // Spring-back toward rest position — only when not dragging and delay passed
        if (!springFrozenRef.current) {
          spherical.setFromVector3(
            camera.position.clone().sub(controls.target)
          )
          const dAz = 0          - spherical.theta   // rest azimuth = 0
          const dPo = REST_POLAR - spherical.phi

          if (Math.abs(dAz) > 0.001 || Math.abs(dPo) > 0.001) {
            spherical.theta += dAz * SPRING
            spherical.phi   += dPo * SPRING
            spherical.makeSafe()
            const newPos = new THREE.Vector3()
              .setFromSpherical(spherical)
              .add(controls.target)
            camera.position.copy(newPos)
            camera.lookAt(controls.target)
          }
        }

        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      // ── Resize ───────────────────────────────────────────────────────────
      function onResize() {
        if (!mountRef.current) return
        const nw = mountRef.current.clientWidth
        const nh = mountRef.current.clientHeight
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      // ── Store cleanup in ref (NOT on the interval ID number) ──────────────
      cleanupRef.current = () => {
        destroyed = true
        if (springTimerRef.current) clearTimeout(springTimerRef.current)
        el.removeEventListener('mousedown',  onPointerDown)
        el.removeEventListener('touchstart', onPointerDown)
        window.removeEventListener('mouseup',   onPointerUp)
        window.removeEventListener('touchend',  onPointerUp)
        window.removeEventListener('resize', onResize)
        cancelAnimationFrame(rafRef.current)
        controls.dispose()
        renderer.dispose()
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement)
        }
        meshRef.current = controlsRef.current = null
      }
    }, 100)

    return () => {
      clearInterval(pollId)
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      } else {
        destroyed = true
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Viewport ──────────────────────────────────────────────────────────────
  const viewport = (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-slate"
      style={{ height, backgroundColor: '#F2F4F7' }}
    >
      <div ref={mountRef} className="w-full h-full" />

      {status === 'waiting' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(242,244,247,0.92)' }}>
          <Spinner label="Menunggu Three.js…" />
        </div>
      )}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(242,244,247,0.92)' }}>
          <Spinner label="Memuat model kepala…" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(242,244,247,0.92)' }}>
          <ErrorState message="Gagal memuat model 3D" />
        </div>
      )}
      {status === 'done' && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-ink/50 text-white text-[10px] px-2.5 py-1 rounded-full pointer-events-none whitespace-nowrap">
          Drag untuk putar · Scroll untuk zoom
        </div>
      )}
    </div>
  )

  // ── Shading controls ──────────────────────────────────────────────────────
  const shadingControls = status === 'done' && (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-xs text-ink/40 shrink-0">Tampilan:</span>
      {([
        { id: 'normal',    label: 'Normal'    },
        { id: 'flat',      label: 'Flat'      },
        { id: 'wireframe', label: 'Wireframe' },
      ] as { id: ShadingMode; label: string }[]).map(({ id, label }) => (
        <button
          key={id}
          onClick={() => setShading(id)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            shading === id
              ? 'bg-ocean-600 text-white border-ocean-600'
              : 'border-slate text-ink/60 hover:border-ocean-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  if (!showCard) return <>{viewport}{shadingControls}</>

  return (
    <div className="rounded-2xl border bg-card p-6" style={{ borderColor: '#D0DCF0' }}>
      <div className="mb-5">
        <h2 className="font-serif text-lg font-semibold italic" style={{ color: '#003369' }}>
          Model Kepala 3D
        </h2>
        <p className="text-xs mt-0.5" style={{ color: '#003369', opacity: 0.5 }}>
          Rata-rata kepala wanita dewasa · interaktif · rotasi terbatas
        </p>
      </div>
      {viewport}
      {shadingControls}
    </div>
  )
}
