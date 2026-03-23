import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack config (Next.js 16 default)
  turbopack: {},
  // Required for maplibre-gl worker
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'maplibre-gl': 'maplibre-gl',
    }
    return config
  },
}

export default nextConfig
