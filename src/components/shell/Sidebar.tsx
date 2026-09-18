'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { ROLE_LABEL, useAuth } from '@/lib/auth'

const NAV = [
  { href: '/overview', label: 'Overview', icon: 'monitor' },
  { href: '/analisis', label: 'Analisis Formulasi', icon: 'command' },
  { href: '/laboratorium', label: 'Laboratorium', icon: 'folder-open' },
  { href: '/riwayat', label: 'Riwayat', icon: 'clock' },
  { href: '/profil', label: 'Profil', icon: 'user' },
]
const STAFF_NAV = { href: '/admin', label: 'Akun', icon: 'document-text' }

/** Nav items for the signed-in role: managers and super admins also see Akun. */
function useNav() {
  const { profile } = useAuth()
  const staff = profile?.role === 'manager' || profile?.role === 'superadmin'
  return staff ? [...NAV, STAFF_NAV] : NAV
}

function useWho() {
  const { profile, loading } = useAuth()
  return {
    name: profile?.full_name || profile?.email || (loading ? 'Memuat…' : 'Tamu'),
    role: profile ? ROLE_LABEL[profile.role] : 'Belum masuk',
    avatar: profile?.avatar_url ?? null,
  }
}

/** Under lg the rail becomes a top strip with the same links. */
export function MobileNav() {
  const path = usePathname()
  const nav = useNav()
  const who = useWho()
  const { signOut } = useAuth()
  return (
    <header className="sticky top-0 z-30 bg-sidebar-gradient px-4 pb-2 pt-3 text-white lg:hidden">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-serif text-[24px] font-bold italic">
          Novagon
        </Link>
        <span className="text-[12px] font-semibold text-white/80">
          {who.name} · {who.role} ·{' '}
          <button type="button" onClick={signOut} className="underline">
            Keluar
          </button>
        </span>
      </div>
      <nav aria-label="Menu utama" className="-mx-4 mt-2 overflow-x-auto px-4">
        <ul className="flex gap-5 whitespace-nowrap text-[14px] font-bold">
          {nav.map((item) => {
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

/** 290px gradient rail from the Figma frames: logo, nav items, profile pill. */
export function Sidebar() {
  const path = usePathname()
  const nav = useNav()
  const who = useWho()
  const { signOut } = useAuth()
  return (
    <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 flex-col bg-sidebar-gradient text-white lg:flex">
      <Link href="/" className="mt-[64px] px-[66px] font-serif text-[36px] font-bold italic leading-none">
        Novagon
      </Link>
      <nav aria-label="Menu utama" className="mt-[68px]">
        <ul>
          {nav.map((item) => {
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
      <div className="mt-auto mb-[210px] ml-[28px] w-[233px]">
        <Link href="/profil" className="flex h-[59px] items-center gap-[17px] rounded-[50px] border-2 border-sky bg-white pl-[9px] text-blue hover:bg-pale">
          <Avatar src={who.avatar} name={who.name} size={48} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[16px] font-bold" title={who.name}>
              {who.name}
            </span>
            <span className="block truncate text-[14px] font-semibold">{who.role}</span>
          </span>
        </Link>
        <button type="button" onClick={signOut} className="mt-2 w-full text-center text-[13px] font-semibold text-white/80 hover:text-white">
          Keluar
        </button>
      </div>
    </aside>
  )
}
