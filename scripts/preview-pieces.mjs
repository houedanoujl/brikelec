// Vue éclatée des pièces d'un puzzle (emboîtement logique), pour relecture.
// Usage : node scripts/preview-pieces.mjs <id> [sortie.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { piecePath, CELL, COLS, CUT_COLOR, CUT_DASH } from '../app/utils/jigsaw.js'
import { PLANT_BY_ID } from '../app/data/plants.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [id, out = join(root, `reference/diff/${id}-pieces.png`)] = process.argv.slice(2)
const plant = PLANT_BY_ID[id]
const svg = readFileSync(join(root, `app/assets/svg/${id}.svg`), 'utf8')
const art = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  .replace(/<g id="decoupes"[\s\S]*?<\/g>/, '').replace(/<rect id="cadre"[^>]*\/>/, '')
// comme dans le jeu : étiquettes retirées du dessin, chacune redessinée sur sa pièce
const labels = {}
const bare = art.replace(/<g class="label" data-cell="(\d)">([\s\S]*?<\/g>)<\/g>/g, (m, k) => { labels[k] = m; return '' })

const GAP = 90
const pieces = [...Array(6).keys()].map((i) => {
  const c = i % COLS, r = Math.floor(i / COLS)
  const d = piecePath(c, r, plant.edges)
  const dx = c * GAP + GAP / 2, dy = r * GAP + GAP / 2
  return `<g transform="translate(${dx} ${dy})">
    <clipPath id="p${i}"><path d="${d}"/></clipPath>
    <path d="${d}" fill="${plant.bg[r]}"/>
    <g clip-path="url(#p${i})">${bare}</g>
    <path d="${d}" fill="none" stroke="#fff" stroke-width="7"/>
    <path d="${d}" fill="none" stroke="${CUT_COLOR}" stroke-width="2.5" stroke-dasharray="${CUT_DASH}"/>
    ${labels[i] || ''}
  </g>`
}).join('')
const W = CELL * 3 + GAP * 3, H = CELL * 2 + GAP * 2
const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#e6f3f9"/>${pieces}</svg>`
writeFileSync(out, new Resvg(doc, { fitTo: { mode: 'width', value: 1800 } }).render().asPng())
console.log(`✔ ${out}`)
