/** @type {import('next').NextConfig} */
const nextConfig = {
  // No ESLint config is checked in. Type errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
  // The inference endpoint, the skin service and the Qwen server run on the
  // Cloudeka instance, reachable through the JupyterLab proxy (plain http,
  // token-gated). Browsers on the https site cannot call them directly, so
  // Vercel proxies /api/* server-side to the *_UPSTREAM env vars and appends
  // API_UPSTREAM_TOKEN as the Jupyter token. The token never reaches the browser.
  async rewrites() {
    const upstream = (process.env.API_UPSTREAM ?? 'http://localhost:8000').replace(/\/+$/, '')
    const token = process.env.API_UPSTREAM_TOKEN
    const skin = (process.env.SKIN_UPSTREAM ?? 'http://localhost:8010').replace(/\/+$/, '')
    const llm = (process.env.LLM_UPSTREAM ?? 'http://localhost:8001').replace(/\/+$/, '')
    return [
      { source: '/api/v1/:path*', destination: `${upstream}/v1/:path*${token ? `?token=${token}` : ''}` },
      { source: '/api/skin/:path*', destination: `${skin}/v1/skin/:path*${token ? `?token=${token}` : ''}` },
      { source: '/api/llm/:path*', destination: `${llm}/v1/:path*${token ? `?token=${token}` : ''}` },
    ]
  },
}
module.exports = nextConfig
