import type { Metadata } from 'next'
import { Libre_Baskerville, Montserrat } from 'next/font/google'
import './globals.css'

const libre = Libre_Baskerville({
  subsets: ['latin'],
  variable: '--font-libre',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Novagon, AI Riset & Prediksi Formulasi',
  description:
    'Platform AI untuk formulator kosmetik: QTPP, analisis formula, prediksi stabilitas, kontribusi bahan, skrining keamanan in silico, dan laporan regulatori.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${libre.variable} ${montserrat.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
