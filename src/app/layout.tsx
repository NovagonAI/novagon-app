import type { Metadata } from 'next'
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono, Libre_Baskerville } from 'next/font/google'
import Script from 'next/script'
import { ThreeLoader } from '@/components/ThreeLoader'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  weight: ['400', '500', '600', '700'],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500'],
})

const LibreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'Novagon - AI Riset & Prediksi Formulasi',
  description: 'Platform AI untuk mempercepat riset dan prediksi formulasi produk kosmetik. Prediksi stabilitas, validasi BPOM, dan analisis kompatibilitas bahan aktif dalam hitungan detik.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fraunces.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans text-ink antialiased bg-paper">
        {children}
        {/* 3Dmol.js — loaded globally so ChemicalViewer can use window.$3Dmol */}
        <Script
          src="https://3dmol.csb.pitt.edu/build/3Dmol-min.js"
          strategy="lazyOnload"
        />
        {/* Three.js + OBJLoader + OrbitControls — chained in order via Client Component */}
        <ThreeLoader />
      </body>
    </html>
  )
}
