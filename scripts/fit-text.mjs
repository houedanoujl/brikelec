// Outil de relevé : retrouve taille, position et graisse d'un texte du PDF.
// Usage : node scripts/fit-text.mjs <id> "<texte>" x0 y0 x1 y1 [bold|regular] [encre=#rrggbb] [tol]
// (zone en unités de page ; l'encre est la couleur du texte)
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import jpeg from 'jpeg-js'
import { loadFont } from './fonts.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [id, text, x0, y0, x1, y1, weight = 'bold', ink = '#1f2832', tolS = '60'] = process.argv.slice(2)
const img = jpeg.decode(readFileSync(join(root, `public/reference/${id}.jpg`)), { useTArray: true })
const S = img.width / (id === 'ensemble' ? 1200 : 900)
const c = [1, 3, 5].map(i => parseInt(ink.slice(i, i + 2), 16))
const tol = +tolS
let bx0 = 1e9, bx1 = -1, by0 = 1e9, by1 = -1
for (let y = Math.round(y0 * S); y < y1 * S; y++) {
  for (let x = Math.round(x0 * S); x < x1 * S; x++) {
    const i = (y * img.width + x) * 4
    const d = Math.max(Math.abs(img.data[i] - c[0]), Math.abs(img.data[i + 1] - c[1]), Math.abs(img.data[i + 2] - c[2]))
    if (d <= tol) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y) }
  }
}
const ink0 = bx0 / S, ink1 = (bx1 + 1) / S, inkT = by0 / S, inkB = (by1 + 1) / S
const font = loadFont(weight)
// boîte d'encre du texte à la taille 100
const p = font.getPath(text, 0, 0, 100)
const bb = p.getBoundingBox()
const size = 100 * (ink1 - ink0) / (bb.x2 - bb.x1)
const k = size / 100
const x = ink0 - bb.x1 * k
const adv = font.getAdvanceWidth(text, size)
// ligne de base : alignée sur le bas d'un glyphe sans jambage (bb.y2 = bas)
const baseline = inkB - bb.y2 * k
console.log(JSON.stringify({
  ink: [ink0, inkT, ink1, inkB].map(v => +v.toFixed(2)),
  size: +size.toFixed(2),
  x: +x.toFixed(2),
  middle: +(x + adv / 2).toFixed(2),
  baseline: +baseline.toFixed(2),
  heightCheck: +((bb.y2 - bb.y1) * k).toFixed(2) + ' vs ' + (inkB - inkT).toFixed(2),
}))
