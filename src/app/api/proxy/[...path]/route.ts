/**
 * Next.js API Route — Proxy ke formulation backend
 *
 * Semua request dari browser ('use client' components) diarahkan ke sini.
 * Next.js server yang forward ke backend — bebas CORS karena server-to-server.
 *
 * Pattern URL:
 *   Browser → POST /api/proxy/v1/predict/H1
 *   Next.js  → POST {API_BASE_URL}/v1/predict/H1
 */

import { NextRequest, NextResponse } from 'next/server'

// Strip trailing slash dari base URL
const BACKEND =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://minolta-bargains-shakespeare-gear.trycloudflare.com').replace(/\/+$/, '')

const TIMEOUT_MS = 20_000

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/')
  const targetUrl = `${BACKEND}/${path}`

  // Forward query string kalau ada
  const searchParams = req.nextUrl.searchParams.toString()
  const fullUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)

  try {
    const upstreamRes = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      // Forward body untuk POST/PUT/PATCH
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      signal: ctrl.signal,
      // @ts-expect-error — Node 18+ fetch duplex option
      duplex: 'half',
    })

    const data = await upstreamRes.text()

    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': upstreamRes.headers.get('Content-Type') ?? 'application/json',
        // Expose ke browser
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy error'
    return NextResponse.json(
      { error: message, upstream: fullUrl },
      { status: 502 }
    )
  } finally {
    clearTimeout(timer)
  }
}

export const GET    = handler
export const POST   = handler
export const PUT    = handler
export const PATCH  = handler
export const DELETE = handler
