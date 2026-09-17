/** @type {import('next').NextConfig} */
const nextConfig = {
  // No ESLint config is checked in; type errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
  // The inference endpoint runs on the Cloudeka instance, reachable through
  // the JupyterLab proxy (plain http, token-gated). Browsers on the https
  // site cannot call it directly, so Vercel proxies /api/v1/* server-side to
  // API_UPSTREAM and appends API_UPSTREAM_TOKEN as the Jupyter token. Both
  // are Vercel env vars; the token never reaches the browser.
  async rewrites() {
    const upstream = (process.env.API_UPSTREAM ?? 'http://localhost:8000').replace(/\/+$/, '')
    const token = process.env.API_UPSTREAM_TOKEN
    return [{ source: '/api/v1/:path*', destination: `${upstream}/v1/:path*${token ? `?token=${token}` : ''}` }]
  },
}
module.exports = nextConfig
