/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // TRI-081: serve Umami through this site so tracker blockers don't drop it.
  // Blockers match cloud.umami.is and well-known script names; a short first-party
  // path avoids both. app/layout.tsx loads /p/t.js with data-host-url="/p", so the
  // tracker posts events to /p/api/send, handled by app/p/api/send/route.ts (which
  // adds the visitor's IP so Umami shows the right location).
  async rewrites() {
    return [
      { source: '/p/t.js', destination: 'https://cloud.umami.is/script.js' },
    ]
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
