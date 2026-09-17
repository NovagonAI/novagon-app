'use client'

import Script from 'next/script'

/**
 * Loads Three.js r128 UMD, then chains OBJLoader → OrbitControls in order.
 * Must be a Client Component so the onLoad handler is allowed.
 */
export function ThreeLoader() {
  return (
    <Script
      id="threejs"
      src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        function loadScript(src: string, cb?: () => void) {
          const s = document.createElement('script')
          s.src = src
          if (cb) s.onload = cb
          document.head.appendChild(s)
        }
        loadScript(
          'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js',
          () =>
            loadScript(
              'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'
            )
        )
      }}
    />
  )
}
