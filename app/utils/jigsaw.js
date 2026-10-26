// Géométrie des découpes du puzzle, relevée sur les PDF du client
// (gabarit identique pour les 5 centrales : grille 3×2, cases de 300).
// Module JS pur : importé par Nuxt et par scripts/build-svg.mjs.

export const CELL = 300
export const COLS = 3
export const ROWS = 2
export const WIDTH = CELL * COLS
export const HEIGHT = CELL * ROWS

export const CUT_COLOR = '#1f2933'
export const CUT_WIDTH = 2.5
export const CUT_HALO = 7
export const CUT_DASH = '12 7.5'
export const FRAME_WIDTH = 6 // 3 px visibles à l'intérieur du cadre

// Lobe symétrique autour du milieu de l'arête, en repère local :
// u le long de l'arête (0 → 300), v vers le côté où le lobe dépasse.
// Ajusté par moindres carrés sur la position de chaque tiret (longueur d'arc
// comprise), pour que le motif des pointillés tombe exactement comme dans le PDF.
const N = [114.22, 0]
const C1 = [110.24, 16.06]
const C2 = [92.75, 15.18]
const P1 = [92.75, 32.44]
const C3 = [92.75, 36.12]
const C4 = [95.11, 58.65]
const A = [150, 58.65]
const mirror = ([u, v]) => [CELL - u, v]

// Segments d'une arête avec lobe : ['L', p] ou ['C', c1, c2, p]
const LOBE_EDGE = [
  ['L', N],
  ['C', C1, C2, P1],
  ['C', C3, C4, A],
  ['C', mirror(C4), mirror(C3), mirror(P1)],
  ['C', mirror(C2), mirror(C1), mirror(N)],
  ['L', [CELL, 0]],
]
const FLAT_EDGE = [['L', [CELL, 0]]]

// Sens des lobes du gabarit PDF. Arêtes verticales : v = +1 → le lobe part
// vers la droite (+x). Arêtes horizontales : v = +1 → vers le bas (+y).
export const PDF_LOBES = {
  // arête verticale à droite de la colonne c, rangée r : `v${c}${r}`
  v00: -1, v10: +1,
  v01: +1, v11: -1,
  // arête horizontale sous la rangée 0, colonne c : `h${c}`
  h0: -1, h1: +1, h2: -1,
}

const f = n => +n.toFixed(2)

// Points absolus d'une arête : origine o, direction t (unitaire), normale n
function place (segs, o, t, n) {
  const P = ([u, v]) => [f(o[0] + u * t[0] + v * n[0]), f(o[1] + u * t[1] + v * n[1])]
  return segs.map(s => [s[0], ...s.slice(1).map(P)])
}

function reverse (segs, start) {
  // start = point de départ de l'arête dans le sens direct
  const pts = [start, ...segs.map(s => s[s.length - 1])]
  const out = []
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i]
    const end = pts[i]
    out.push(s[0] === 'L' ? ['L', end] : ['C', s[2], s[1], end])
  }
  return out
}

const toD = segs => segs.map(s => s[0] + s.slice(1).map(p => p.join(',')).join(' ')).join(' ')

// Arête d'une case dans le sens direct (gauche→droite, haut→bas).
// lobe : 0 (plate), +1 / −1 (sens du lobe sur l'axe x ou y).
function edge (kind, x, y, lobe) {
  const segs = lobe ? LOBE_EDGE : FLAT_EDGE
  if (kind === 'h') return place(segs, [x, y], [1, 0], [0, lobe || 1])
  return place(segs, [x, y], [0, 1], [lobe || 1, 0])
}

// Sens des lobes des 4 côtés d'une case.
// decoys : lobes « leurres » sur les bords du plateau, pour que les bords plats
// ne trahissent pas la place des pièces. true = tous vers l'extérieur, ou
// objet { top, right, bottom, left } avec +1 (vers l'extérieur) / −1 (creux).
export function cellLobes (c, r, lobes = PDF_LOBES, decoys = false) {
  const d = decoys === true ? { top: 1, right: 1, bottom: 1, left: 1 } : decoys || { top: 0, right: 0, bottom: 0, left: 0 }
  return {
    top: r === 0 ? -d.top : lobes[`h${c}`],
    bottom: r === ROWS - 1 ? d.bottom : lobes[`h${c}`],
    left: c === 0 ? -d.left : lobes[`v${c - 1}${r}`],
    right: c === COLS - 1 ? d.right : lobes[`v${c}${r}`],
  }
}

// Contour fermé d'une pièce, en coordonnées du schéma (900×600).
export function piecePath (c, r, opts = {}) {
  const L = cellLobes(c, r, opts.lobes, opts.decoys)
  const x = c * CELL, y = r * CELL
  const top = edge('h', x, y, L.top)
  const right = edge('v', x + CELL, y, L.right)
  const bottom = reverse(edge('h', x, y + CELL, L.bottom), [x, y + CELL])
  const left = reverse(edge('v', x, y, L.left), [x, y])
  return `M${x},${y} ${toD([...top, ...right, ...bottom, ...left])} Z`
}

// Toutes les lignes de découpe du schéma assemblé (une par côté de case,
// comme dans le PDF où le motif de pointillés repart à chaque case).
export function cutPaths (lobes = PDF_LOBES) {
  const out = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      const x = (c + 1) * CELL, y = r * CELL
      out.push(`M${x},${y} ${toD(edge('v', x, y, lobes[`v${c}${r}`]))}`)
    }
  }
  for (let c = 0; c < COLS; c++) {
    const x = c * CELL, y = CELL
    out.push(`M${x},${y} ${toD(edge('h', x, y, lobes[`h${c}`]))}`)
  }
  return out
}

export function cutsSvg (lobes = PDF_LOBES) {
  const d = cutPaths(lobes)
  return `<g id="decoupes" fill="none" stroke-linejoin="round">` +
    d.map(p => `<path d="${p}" stroke="#fff" stroke-width="${CUT_HALO}"/>`).join('') +
    d.map(p => `<path d="${p}" stroke="${CUT_COLOR}" stroke-width="${CUT_WIDTH}" stroke-dasharray="${CUT_DASH}"/>`).join('') +
    `</g>`
}

export function frameSvg (w = WIDTH, h = HEIGHT) {
  return `<rect id="cadre" x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${CUT_COLOR}" stroke-width="${FRAME_WIDTH}"/>`
}
