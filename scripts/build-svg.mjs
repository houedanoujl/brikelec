// Construit les SVG finaux à partir des sources de art/<id>.mjs (qui exportent le SVG) :
//  - convertit chaque <text> (Trebuchet MS) en <path>, pour un rendu identique
//    sur tous les appareils (la police n'est pas installée sur Android) ;
//  - remplace <!--DECOUPES--> par les pointillés du puzzle et <!--CADRE--> par le cadre.
// Usage : node scripts/build-svg.mjs [id ...]
import { writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadFont } from './fonts.mjs'
import { cutsSvg, frameSvg } from '../app/utils/jigsaw.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'art')
const outDir = join(root, 'app/assets/svg')
mkdirSync(outDir, { recursive: true })

const attrs = s => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]))
const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// Un <text> peut contenir du texte brut et des <tspan> (dx, dy, font-size,
// font-weight, fill) — suffisant pour « DC→AC » ou « H₂ ».
function textToPath (attrStr, inner) {
  const a = attrs(attrStr)
  const base = {
    size: +(a['font-size'] || 16),
    weight: (a['font-weight'] || 'normal') === 'bold' ? 'bold' : 'regular',
    fill: a.fill || '#000',
    ls: +(a['letter-spacing'] || 0),
    sx: +(a['data-scale-x'] || 1), // compression horizontale éventuelle
  }
  const runs = []
  const re = /<tspan([^>]*)>([\s\S]*?)<\/tspan>|([^<]+)/g
  for (const m of inner.matchAll(re)) {
    if (m[3] !== undefined) { if (m[3].trim() || m[3].length) runs.push({ text: decode(m[3]), ...base }); continue }
    const t = attrs(m[1])
    runs.push({
      text: decode(m[2]),
      size: +(t['font-size'] || base.size),
      weight: t['font-weight'] ? (t['font-weight'] === 'bold' ? 'bold' : 'regular') : base.weight,
      fill: t.fill || base.fill,
      ls: +(t['letter-spacing'] ?? base.ls),
      sx: base.sx,
      dx: +(t.dx || 0),
      dy: +(t.dy || 0),
    })
  }
  const advance = r => {
    const f = loadFont(r.weight)
    return (f.getAdvanceWidth(r.text, r.size, { kerning: true }) + r.ls * [...r.text].length) * r.sx
  }
  const total = runs.reduce((s, r) => s + (r.dx || 0) + advance(r), 0)
  const anchor = a['text-anchor'] || 'start'
  let x = +a.x - (anchor === 'middle' ? total / 2 : anchor === 'end' ? total : 0)
  let y = +a.y
  const paths = []
  for (const r of runs) {
    x += r.dx || 0
    y += r.dy || 0
    const f = loadFont(r.weight)
    let cx = x
    const glyphs = f.stringToGlyphs(r.text)
    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i]
      const p = g.getPath(0, 0, r.size)
      // compression horizontale autour de l'origine du glyphe
      const d = p.commands.map(c => {
        const X = v => +(cx + v * r.sx).toFixed(2)
        const Y = v => +(y + v).toFixed(2)
        switch (c.type) {
          case 'M': return `M${X(c.x)} ${Y(c.y)}`
          case 'L': return `L${X(c.x)} ${Y(c.y)}`
          case 'Q': return `Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}`
          case 'C': return `C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}`
          default: return 'Z'
        }
      }).join('')
      if (d) paths.push(`<path fill="${r.fill}" d="${d}"/>`)
      let adv = g.advanceWidth * r.size / f.unitsPerEm
      if (i < glyphs.length - 1) adv += f.getKerningValue(g, glyphs[i + 1]) * r.size / f.unitsPerEm
      cx += (adv + r.ls) * r.sx
    }
    x = cx
  }
  const label = runs.map(r => r.text).join('')
  const extra = a.id ? ` id="${a.id}"` : ''
  return `<g${extra} aria-label="${esc(label)}">${paths.join('')}</g>`
}

async function build (file) {
  const id = basename(file, '.mjs')
  let svg = (await import(pathToFileURL(join(srcDir, file)).href + '?t=' + Date.now())).default
  svg = svg.replace(/<text([^>]*)>([\s\S]*?)<\/text>/g, (_, a, inner) => textToPath(a, inner))
  svg = svg.replace('<!--DECOUPES-->', cutsSvg())
  const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/)
  svg = svg.replace('<!--CADRE-->', frameSvg(+vb[1], +vb[2]))
  svg = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/\n\s*\n/g, '\n')
  writeFileSync(join(outDir, `${id}.svg`), svg)
  console.log(`✔ ${id}`)
}

const ids = process.argv.slice(2)
for (const f of readdirSync(srcDir).filter(f => f.endsWith('.mjs') && f !== 'lib.mjs')) {
  if (!ids.length || ids.includes(basename(f, '.mjs'))) await build(f)
}
