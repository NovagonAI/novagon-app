import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase'

/**
 * App pages need a session, and /login is skipped when one already exists,
 * so Sign In on the landing lands in the app for a signed-in visitor.
 * The landing page and the API proxies stay open.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })
  const {
    data: { user },
  } = await sb.auth.getUser()
  const atLogin = req.nextUrl.pathname === '/login'
  if (user && atLogin) {
    const url = req.nextUrl.clone()
    const next = req.nextUrl.searchParams.get('next')
    url.pathname = next && next.startsWith('/') ? next : '/overview'
    url.search = ''
    return NextResponse.redirect(url)
  }
  if (!user && !atLogin) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`
    return NextResponse.redirect(url)
  }
  return res
}

export const config = {
  matcher: ['/login', '/overview/:path*', '/analisis/:path*', '/laboratorium/:path*', '/riwayat/:path*', '/admin/:path*'],
}
