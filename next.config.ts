import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // web-push is a CommonJS module - tell Next.js not to bundle it on Vercel
  serverExternalPackages: ['web-push'],
}

export default nextConfig