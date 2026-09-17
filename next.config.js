/** @type {import('next').NextConfig} */
const nextConfig = {
  // No ESLint config is checked in; type errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
}
module.exports = nextConfig
