'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { loadThree } from '@/lib/three'
import { handEffects, type EffectScore } from '@/lib/hand'
import type { Workspace } from '@/lib/store'

/* Colours from Dataset/placeholderhand.html: before is a dull warm beige, after is smoother and brighter. */
const BASE = '#d9b79c'
const BASE_SMOOTH = '#f3d3ba'
const EDGE = '#b58a68'
const EDGE_AFTER = '#e8b48f'
const POINT = '#a97c58'
const POINT_AFTER = '#f0b78f'
const CALM = '#e6c4a8'
const BRIGHT = '#fff1e2'

/* The patch on the back of the hand, in the mesh's own coordinates. */
const TARGET = [0.011, 0.086, 0.026] as const
const SCALE = [0.027, 0.03] as const

const FRAG = `
uniform vec2 uTarget; uniform vec2 uScale; uniform float uTime; uniform float uStrength;
uniform vec3 uCore; uniform vec3 uHalo;
varying vec3 vLocal;
void main() {
  vec2 p = (vLocal.xy - uTarget) / uScale;
  float d = dot(p, p);
  float core = 1.0 - smoothstep(0.15, 1.0, d);
  float halo = 1.0 - smoothstep(0.55, 1.55, d);
  float pulse = 0.92 + 0.08 * sin(uTime * 2.0);
  float alpha = (core * 0.62 + halo * 0.14) * uStrength * pulse;
  gl_FragColor = vec4(mix(uHalo, uCore, core), alpha);
}`
const VERT = `varying vec3 vLocal; void main() { vLocal = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

const ease = (t: number) => t * t * (3 - 2 * t)

/**
 * The hand from Dataset/placeholderhand.html with the formula's effect
 * profile played onto it: the rough "before" mesh cross-fades to the smooth
 * one by the smoothing score, the patch at the centre of the back of the
 * hand brightens by the brightening score, the base tone calms by the
 * soothing score and a sky ring marks UV protection. Drag to tilt.
 */
export function HandViz({ ws }: { ws: Workspace }) {
  const effects = useMemo(() => handEffects(ws.formula, ws.analysis), [ws.formula, ws.analysis])
  const mount = useRef<HTMLDivElement>(null)
  const state = useRef({ effects, progress: 0, playFrom: 0, playing: false })
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [progress, setProgress] = useState(0)
  const [play, setPlay] = useState(0)

  state.current.effects = effects
  const any = effects.some((e) => e.strength > 0.02)

  useEffect(() => {
    state.current.playing = true
    state.current.playFrom = performance.now()
  }, [play, effects])

  useEffect(() => {
    const el = mount.current
    if (!el) return
    let dead = false
    let raf = 0
    let cleanup = () => {}
    loadThree(['GLTFLoader'])
      .then(async () => {
        if (dead) return
        const THREE = window.THREE
        const w = el.clientWidth || 420
        const h = el.clientHeight || 360
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xf7fbff)
        // fingers point right: the hand is 0.252 long and 0.128 wide, keep both inside the view with margin
        const camera = new THREE.PerspectiveCamera(26, w / h, 0.01, 10)
        camera.position.set(0, 0, Math.max(0.175, 0.29 / (w / h)) / (2 * Math.tan((13 * Math.PI) / 180)))
        camera.lookAt(0, 0, 0)
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
        renderer.setSize(w, h)
        renderer.outputEncoding = THREE.sRGBEncoding
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.05
        el.innerHTML = ''
        el.appendChild(renderer.domElement)
        scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe6ee, 0.5))
        const key = new THREE.DirectionalLight(0xffffff, 0.62)
        key.position.set(-0.35, 0.42, 0.65)
        scene.add(key)
        const fill = new THREE.DirectionalLight(0xdcecff, 0.18)
        fill.position.set(0.35, 0.08, 0.45)
        scene.add(fill)

        const root = new THREE.Group()
        scene.add(root)
        const pose = new THREE.Group()
        pose.rotation.z = -Math.PI / 2
        root.add(pose)
        const col = (hex: string) => new THREE.Color(hex).convertSRGBToLinear()
        const loader = new THREE.GLTFLoader()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const load = (url: string) => new Promise<any>((res, rej) => loader.load(url, res, undefined, rej))
        const [hard, smooth] = await Promise.all([load('/hand-hard.glb'), load('/hand-smooth.glb')])
        if (dead) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const build = (gltf: any, kind: 'hard' | 'smooth') => {
          const wrapper = new THREE.Group()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parts: { base: any[]; edge: any[]; point: any[]; patch?: any } = { base: [], edge: [], point: [] }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          gltf.scene.traverse((obj: any) => {
            if (!obj.isMesh) return
            const geo = obj.geometry.clone()
            geo.computeVertexNormals()
            const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col(kind === 'hard' ? BASE : BASE_SMOOTH), roughness: kind === 'hard' ? 0.88 : 0.72, metalness: 0, flatShading: kind === 'hard', transparent: true }))
            mesh.renderOrder = 1
            wrapper.add(mesh)
            parts.base.push(mesh)
            const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo, kind === 'hard' ? 12 : 22), new THREE.LineBasicMaterial({ color: col(kind === 'hard' ? EDGE : EDGE_AFTER), transparent: true, opacity: kind === 'hard' ? 0.52 : 0.31, depthWrite: false }))
            lines.renderOrder = 2
            wrapper.add(lines)
            parts.edge.push(lines)
            const pg = new THREE.BufferGeometry()
            pg.setAttribute('position', geo.getAttribute('position').clone())
            const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: col(kind === 'hard' ? POINT : POINT_AFTER), size: kind === 'hard' ? 0.00165 : 0.00115, sizeAttenuation: true, transparent: true, opacity: kind === 'hard' ? 0.26 : 0.16, depthWrite: false }))
            pts.renderOrder = 3
            wrapper.add(pts)
            parts.point.push(pts)
            if (kind === 'smooth') {
              const patch = new THREE.Mesh(
                geo,
                new THREE.ShaderMaterial({
                  transparent: true,
                  depthWrite: false,
                  depthTest: true,
                  blending: THREE.NormalBlending,
                  uniforms: {
                    uTarget: { value: new THREE.Vector2(TARGET[0], TARGET[1]) },
                    uScale: { value: new THREE.Vector2(SCALE[0], SCALE[1]) },
                    uTime: { value: 0 },
                    uStrength: { value: 0 },
                    uCore: { value: col(BRIGHT) },
                    uHalo: { value: new THREE.Color(0.78, 0.91, 1.0) },
                  },
                  vertexShader: VERT,
                  fragmentShader: FRAG,
                }),
              )
              patch.renderOrder = 4
              wrapper.add(patch)
              parts.patch = patch
            }
          })
          wrapper.position.set(-0.016, -0.084, -0.003)
          pose.add(wrapper)
          return { ...parts, wrapper }
        }
        const H = build(hard, 'hard')
        const S = build(smooth, 'smooth')

        // sky ring for UV protection, around the same patch
        const ringPts = []
        for (let i = 0; i <= 72; i++) {
          const a = (i / 72) * Math.PI * 2
          ringPts.push(new THREE.Vector3(TARGET[0] + Math.cos(a) * SCALE[0] * 1.35, TARGET[1] + Math.sin(a) * SCALE[1] * 1.35, TARGET[2] + 0.002))
        }
        const ringMat = new THREE.LineBasicMaterial({ color: col('#78b9ff'), transparent: true, opacity: 0, depthTest: false, depthWrite: false })
        const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), ringMat)
        ring.renderOrder = 5
        S.wrapper.add(ring)

        // drag to tilt, springs back
        const DEF = { x: 0.22, y: -0.18 }
        root.rotation.set(DEF.x, DEF.y, 0)
        const LIM = { x: (22 * Math.PI) / 180, y: (32 * Math.PI) / 180 }
        let drag: { id: number; x: number; y: number; rx: number; ry: number } | null = null
        const cv = renderer.domElement
        cv.style.cursor = 'grab'
        cv.style.touchAction = 'none'
        cv.addEventListener('pointerdown', (e: PointerEvent) => {
          drag = { id: e.pointerId, x: e.clientX, y: e.clientY, rx: root.rotation.x, ry: root.rotation.y }
          cv.setPointerCapture(e.pointerId)
          cv.style.cursor = 'grabbing'
        })
        cv.addEventListener('pointermove', (e: PointerEvent) => {
          if (!drag || e.pointerId !== drag.id) return
          root.rotation.y = Math.max(-LIM.y, Math.min(LIM.y, drag.ry + (e.clientX - drag.x) * 0.008))
          root.rotation.x = Math.max(-LIM.x, Math.min(LIM.x, drag.rx + (e.clientY - drag.y) * 0.008))
        })
        const up = () => {
          drag = null
          cv.style.cursor = 'grab'
        }
        cv.addEventListener('pointerup', up)
        cv.addEventListener('pointercancel', up)

        const baseHard = col(BASE)
        const tmp = new THREE.Color()
        let last = performance.now()
        let shown = -1
        const tick = (now: number) => {
          raf = requestAnimationFrame(tick)
          const dt = Math.min(0.05, (now - last) / 1000)
          last = now
          const st = state.current
          if (st.playing) {
            const t = Math.min(1, (now - st.playFrom) / 2600)
            st.progress = t
            if (t >= 1) st.playing = false
          }
          const p = ease(st.progress)
          if (Math.round(p * 100) !== shown) {
            shown = Math.round(p * 100)
            setProgress(shown)
          }
          const get = (k: EffectScore['key']) => st.effects.find((e) => e.key === k)?.strength ?? 0
          const smoothMix = p * Math.max(get('halus'), get('lembap') * 0.6)
          H.base.forEach((m) => (m.material.opacity = 1 - smoothMix))
          H.edge.forEach((m) => (m.material.opacity = 0.52 * (1 - smoothMix)))
          H.point.forEach((m) => (m.material.opacity = 0.26 * (1 - smoothMix)))
          S.base.forEach((m) => (m.material.opacity = smoothMix))
          S.edge.forEach((m) => (m.material.opacity = 0.31 * smoothMix))
          S.point.forEach((m) => (m.material.opacity = 0.16 * smoothMix))
          // calming shifts the base tone away from red, moisture adds sheen, oil control mattes it
          tmp.copy(baseHard).lerp(col(CALM), p * get('tenang'))
          H.base.forEach((m) => {
            m.material.color.copy(tmp)
            m.material.roughness = 0.88 - 0.25 * p * get('lembap') + 0.1 * p * get('matte')
          })
          S.base.forEach((m) => (m.material.roughness = 0.72 - 0.25 * p * get('lembap') + 0.1 * p * get('matte')))
          if (S.patch) {
            const u = S.patch.material.uniforms
            u.uTime.value = now * 0.001
            u.uStrength.value = p * Math.max(get('cerah'), get('lembap') * 0.6, get('tenang') * 0.35)
            u.uCore.value.copy(col(BRIGHT)).lerp(col('#ffffff'), get('cerah') * 0.6)
          }
          ringMat.opacity = 0.55 * p * get('lindung')
          if (!drag) {
            root.rotation.x = THREE.MathUtils.damp(root.rotation.x, DEF.x, 6.5, dt)
            root.rotation.y = THREE.MathUtils.damp(root.rotation.y, DEF.y, 6.5, dt)
          }
          renderer.render(scene, camera)
        }
        raf = requestAnimationFrame(tick)
        setStatus('done')
        cleanup = () => {
          cancelAnimationFrame(raf)
          renderer.dispose()
        }
      })
      .catch(() => setStatus('error'))
    return () => {
      dead = true
      cleanup()
    }
  }, [])

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="relative h-[360px] overflow-hidden rounded-[10px] border border-line bg-[#f7fbff]">
        <div ref={mount} className="h-full w-full" />
        {status !== 'done' && (
          <p className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-grey-text">
            {status === 'loading' ? 'Memuat model tangan' : 'Model 3D tidak bisa dimuat, butuh WebGL dan koneksi CDN.'}
          </p>
        )}
        {status === 'done' && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between text-[12px] font-bold text-navy">
            <span>Sebelum</span>
            <span className="mx-3 h-[6px] flex-1 overflow-hidden rounded-full bg-mist">
              <span className="block h-full rounded-full bg-btn-gradient transition-[width] duration-100" style={{ width: `${progress}%` }} />
            </span>
            <span>Sesudah</span>
          </div>
        )}
      </div>
      <div>
        <ul className="space-y-[10px]">
          {effects.map((e) => (
            <li key={e.key}>
              <div className="flex items-baseline justify-between text-[14px] font-bold text-navy">
                <span>{e.label}</span>
                <span>{Math.round(e.strength * progress)}%</span>
              </div>
              <div className="mt-1 h-[8px] overflow-hidden rounded-full bg-mist">
                <div className="h-full rounded-full bg-btn-gradient transition-[width] duration-100" style={{ width: `${e.strength * progress}%` }} />
              </div>
              {e.drivers.length > 0 && <p className="mt-[2px] truncate text-[11px] font-medium text-grey-text">{e.drivers.join(', ')}</p>}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={() => setPlay((n) => n + 1)} className="btn-outline h-[38px] min-h-0 px-4 text-[14px]">
            Putar ulang
          </button>
          {!any && <p className="text-[12px] font-semibold text-grey-text">Belum ada bahan aktif dengan efek terlihat pada formula ini.</p>}
        </div>
      </div>
    </div>
  )
}
