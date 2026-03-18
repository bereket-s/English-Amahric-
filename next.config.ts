import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: any = {
  turbopack: {
    root: path.join(__dirname),
  },
  // web-push is a CommonJS module - tell Next.js not to bundle it on Vercel
  serverExternalPackages: ['web-push'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig