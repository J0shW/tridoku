import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// Lucide Triangle path (viewBox 0 0 24 24)
// stroke: primary color, fill: primary at 20% opacity, stroke-width: 2
const TRIANGLE_PATH = "M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"

// Colors from globals.css (converted from oklch)
const LIGHT_PRIMARY = '#008781'
const DARK_PRIMARY = '#00afb8'
const LIGHT_BG = '#faf4ee'
const DARK_BG = '#1d140d'

// Fill = primary at 20% opacity
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const LIGHT_FILL = hexToRgba(LIGHT_PRIMARY, 0.2)
const DARK_FILL = hexToRgba(DARK_PRIMARY, 0.2)

// Build SVG for a given size with explicit colors (for PNG generation)
function buildIconSvg(size, strokeColor, fillColor, bgColor = null) {
  const pad = size * 0.1
  const inner = size - pad * 2

  // Background rect (optional, for apple-icon)
  const bgRect = bgColor
    ? `<rect width="${size}" height="${size}" rx="${size * 0.2}" ry="${size * 0.2}" fill="${bgColor}"/>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bgRect}
  <g transform="translate(${pad}, ${pad}) scale(${inner / 24})">
    <path
      d="${TRIANGLE_PATH}"
      fill="${fillColor}"
      stroke="${strokeColor}"
      stroke-width="${2 * (24 / inner)}"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>`
}

// Build the responsive SVG for icon.svg (uses CSS media queries)
function buildResponsiveSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <style>
    @media (prefers-color-scheme: light) {
      .tri { stroke: ${LIGHT_PRIMARY}; fill: ${LIGHT_FILL}; }
    }
    @media (prefers-color-scheme: dark) {
      .tri { stroke: ${DARK_PRIMARY}; fill: ${DARK_FILL}; }
    }
  </style>
  <path
    class="tri"
    d="${TRIANGLE_PATH}"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>`
}

async function svgToPng(svgString, outputPath) {
  const buf = Buffer.from(svgString, 'utf8')
  await sharp(buf, { density: 144 }).png().toFile(outputPath)
  console.log('Written:', outputPath)
}

// 1. icon.svg — responsive SVG with media queries
const svgPath = join(publicDir, 'icon.svg')
writeFileSync(svgPath, buildResponsiveSvg(), 'utf8')
console.log('Written:', svgPath)

// 2. icon-light-32x32.png — 32x32 light mode
const lightSvg = buildIconSvg(32, LIGHT_PRIMARY, LIGHT_FILL)
await svgToPng(lightSvg, join(publicDir, 'icon-light-32x32.png'))

// 3. icon-dark-32x32.png — 32x32 dark mode
const darkSvg = buildIconSvg(32, DARK_PRIMARY, DARK_FILL, DARK_BG)
await svgToPng(darkSvg, join(publicDir, 'icon-dark-32x32.png'))

// 4. apple-icon.png — 180x180, light bg with padding
const appleSvg = buildIconSvg(180, LIGHT_PRIMARY, LIGHT_FILL, LIGHT_BG)
await svgToPng(appleSvg, join(publicDir, 'apple-icon.png'))

console.log('All favicons generated!')
