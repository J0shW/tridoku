/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Puzzle files are public. Allowing cross-origin reads lets preview deployments
  // fetch production's puzzles for dates their branch doesn't have yet.
  async headers() {
    return [
      {
        source: '/puzzles/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ]
  },
}

export default nextConfig
