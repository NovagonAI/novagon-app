import { MobileNav, Sidebar } from '@/components/shell/Sidebar'
import { AuthProvider } from '@/lib/auth'
import { StoreProvider } from '@/lib/store'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <div className="flex min-h-screen flex-col bg-white lg:flex-row">
          <Sidebar />
          <MobileNav />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </StoreProvider>
    </AuthProvider>
  )
}
