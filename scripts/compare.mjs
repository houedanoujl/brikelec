// Contrôle de fidélité 1:1 : rend chaque SVG à la résolution du JPEG d'origine
// (4×) et le compare pixel à pixel.
// Usage : node scripts/compare.mjs [id ...]   (par défaut : les 6 schémas)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import jpeg from 'jpeg-js'
import { PNG } from 'pngjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['solaire', 'hydrogene', 'biomasse', 'cycle', 'eolien', 'ensemble']
const outDir = join(root, 'reference/diff')
mkdirSync(outDir, { recursive: true })

// ΔE76 dans l'espace Lab (D65)
function lab (r, g, b) {
  const f = c => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92 }
  const R = f(r), G = f(g), B = f(b)
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
  let y = (R * 0.2126 + G * 0.7152 + B * 0.0722)
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883
  const t = v => v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116
  x = t(x); y = t(y); z = t(z)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

let allOk = true
for (const id of ids) {
  const ref = jpeg.decode(readFileSync(join(root, `reference/${id}.jpg`)), { useTArray: true })
  const { width: W, height: H } = ref
  const svg = readFileSync(join(root, `app/assets/svg/${id}.svg`), 'utf8')
  const out = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    background: 'white',
    font: { loadSystemFonts: false }, // textes déjà convertis en tracés
  }).render()
  const got = out.pixels // RGBA
  if (out.width !== W || out.height !== H) throw new Error(`${id}: taille ${out.width}×${out.height} ≠ ${W}×${H}`)

  // bande de lissage : pixels où la référence varie fortement dans un rayon de 4 px (≈1 px page)
  const lum = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) lum[i] = ref.data[i * 4] * 0.3 + ref.data[i * 4 + 1] * 0.59 + ref.data[i * 4 + 2] * 0.11
  const edge = new Uint8Array(W * H)
  const R = 4
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const xl = Math.max(0, x - R), xr = Math.min(W - 1, x + R), yt = Math.max(0, y - R), yb = Math.min(H - 1, y + R)
      const v = lum[i]
      if (Math.abs(lum[y * W + xl] - v) > 12 || Math.abs(lum[y * W + xr] - v) > 12 ||
          Math.abs(lum[yt * W + x] - v) > 12 || Math.abs(lum[yb * W + x] - v) > 12) edge[i] = 1
    }
  }

  const heat = new PNG({ width: W / 4, height: H / 4 })
  let counted = 0, bad = 0, sum = 0
  const cell = new Float32Array((W / 4) * (H / 4))
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const a = lab(ref.data[i * 4], ref.data[i * 4 + 1], ref.data[i * 4 + 2])
      const b = lab(got[i * 4], got[i * 4 + 1], got[i * 4 + 2])
      const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
      const c = ((y >> 2) * (W / 4)) + (x >> 2)
      cell[c] = Math.max(cell[c], edge[i] ? 0 : d)
      if (edge[i]) continue
      counted++; sum += d
      if (d > 6) bad++
    }
  }
  // carte : référence en gris clair, écarts en rouge
  for (let y = 0; y < H / 4; y++) {
    for (let x = 0; x < W / 4; x++) {
      const c = y * (W / 4) + x
      const si = ((y * 4) * W + x * 4) * 4
      const g = 170 + ref.data[si] * 0.33
      const k = Math.min(1, cell[c] / 25)
      heat.data[c * 4] = g * (1 - k) + 255 * k
      heat.data[c * 4 + 1] = g * (1 - k)
      heat.data[c * 4 + 2] = g * (1 - k)
      heat.data[c * 4 + 3] = 255
    }
  }
  writeFileSync(join(outDir, `${id}-diff.png`), PNG.sync.write(heat))
  writeFileSync(join(outDir, `${id}-render.png`), out.asPng())
  const okPct = 100 * (1 - bad / counted)
  const ok = okPct >= 98
  allOk &&= ok
  console.log(`${ok ? '✔' : '✘'} ${id.padEnd(10)} ${okPct.toFixed(2)} % des pixels sous ΔE 6  (ΔE moyen ${(sum / counted).toFixed(2)})`)
}
process.exit(allOk ? 0 : 1)
