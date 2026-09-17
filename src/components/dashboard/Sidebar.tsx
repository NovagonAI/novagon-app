'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconSquares2x2, IconFlask } from '@/components/ui/Icons'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    Icon: IconSquares2x2,
  },
  {
    label: 'Laboratorium',
    href: '/lab',
    Icon: IconFlask,
  },
]

export function LabSidebar() {
  const pathname = usePathname()

  // /lab matches both /lab and /lab/[workspaceId]
  const isActive = (href: string) => {
    if (href === '/lab') return pathname.startsWith('/lab')
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-52 h-full shrink-0 bg-card border-r border-slate flex flex-col overflow-y-auto py-4">
      {NAV_ITEMS.map(({ label, href, Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              active
                ? 'bg-ocean-50 text-ocean-700 font-medium border-r-2 border-ocean-500'
                : 'text-ink/60 hover:bg-slate2 hover:text-ink/80'
            }`}
          >
            <Icon
              width={16}
              height={16}
              className="shrink-0"
              style={{ color: active ? '#1A5BA1' : undefined }}
            />
            {label}
          </Link>
        )
      })}
    </aside>
  )
}

// Alias — dashboard/page.tsx masih pakai nama lama
export { LabSidebar as Sidebar }
