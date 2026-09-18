import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase'

/** App pages need a session. The landing page, login and the API proxies stay open. */
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
  if (!user) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`
    return NextResponse.redirect(url)
  }
  return res
}

export const config = {
  matcher: ['/overview/:path*', '/analisis/:path*', '/laboratorium/:path*', '/riwayat/:path*', '/admin/:path*'],
}
