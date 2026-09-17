'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'

const NAV = [
  { href: '/overview', label: 'Overview', icon: 'monitor' },
  { href: '/analisis', label: 'Analisis Formulasi', icon: 'command' },
  { href: '/laboratorium', label: 'Laboratorium', icon: 'folder-open' },
  { href: '/riwayat', label: 'Riwayat', icon: 'clock' },
]

/** Under lg the rail becomes a top strip with the same four links. */
export function MobileNav() {
  const path = usePathname()
  return (
    <header className="sticky top-0 z-30 bg-sidebar-gradient px-4 pb-2 pt-3 text-white lg:hidden">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-serif text-[24px] font-bold italic">
          Novagon
        </Link>
        <span className="text-[12px] font-semibold text-white/80">Formulator · PT Paragon</span>
      </div>
      <nav aria-label="Menu utama" className="-mx-4 mt-2 overflow-x-auto px-4">
        <ul className="flex gap-5 whitespace-nowrap text-[14px] font-bold">
          {NAV.map((item) => {
            const active = path === item.href || path.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link href={item.href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-2 py-1 ${active ? 'text-white' : 'text-grey-nav'}`}>
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}

/** 290px gradient rail from the Figma frames: logo, four items, profile pill. */
export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 flex-col bg-sidebar-gradient text-white lg:flex">
      <Link href="/" className="mt-[64px] px-[66px] font-serif text-[36px] font-bold italic leading-none">
        Novagon
      </Link>
      <nav aria-label="Menu utama" className="mt-[68px]">
        <ul>
          {NAV.map((item) => {
            const active = path === item.href || path.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-[56px] items-center gap-[11px] pl-[36px] text-[16px] font-bold transition-colors hover:text-white ${active ? 'text-white' : 'text-grey-nav'}`}
                >
                  <Icon name={item.icon} size={24} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="mt-auto mb-[236px] ml-[28px] flex h-[59px] w-[233px] items-center gap-[17px] rounded-[50px] border-2 border-sky bg-white pl-[9px] text-blue">
        <span className="h-12 w-12 shrink-0 rounded-full bg-grey-track" aria-hidden="true" />
        <span className="leading-tight">
          <span className="block text-[16px] font-bold">Formulator</span>
          <span className="block text-[16px] font-semibold">PT Paragon</span>
        </span>
      </div>
    </aside>
  )
}
