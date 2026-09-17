import { SIDEBAR_ITEMS } from '@/lib/data'

export function Sidebar() {
  return (
    <aside className="w-48 h-full shrink-0 bg-card border-r border-slate flex flex-col overflow-y-auto py-4">
      {SIDEBAR_ITEMS.map((item) => (
        <div
          key={item.label}
          className={`px-4 py-2.5 text-sm cursor-default select-none ${
            item.active
              ? 'bg-ocean-50 text-ocean-700 font-medium border-r-2 border-ocean-500'
              : 'text-ink/60 hover:bg-slate2 transition-colors'
          }`}
        >
          {item.label}
        </div>
      ))}
    </aside>
  )
}
