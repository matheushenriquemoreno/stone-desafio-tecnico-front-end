import type { NextConfig } from 'next'

import { parseImageOrigins } from './src/lib/image-origin-policy'

const remotePatterns = parseImageOrigins(process.env.NEXT_PUBLIC_IMAGE_ORIGINS).map(
  (origin) => {
    const url = new URL(origin)

    return {
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      protocol: url.protocol.slice(0, -1) as 'http' | 'https',
    }
  },
)

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns,
  },
}

export default nextConfig
