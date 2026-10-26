// Géométrie des découpes du puzzle (grille 3×2, cases de 300).
// - Gabarit du PDF du client (lobes ronds) : sert au schéma assemblé 1:1.
// - Emboîtement logique du jeu : un tenon par flux qui passe d'un composant à
//   l'autre, placé à l'endroit où le flux franchit l'arête, de forme liée au
//   type de flux, et dirigé dans le sens du flux.
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

const f = n => +n.toFixed(2)
const mir = ([u, v]) => [-u, v]

// Tenon symétrique à partir de sa moitié gauche, en repère local centré :
// u le long de l'arête (0 = centre du tenon), v vers le côté où il dépasse.
// half commence par ['L', point de départ du col] et finit au sommet (u = 0).
function symmetric (half) {
  const ends = half.map(s => s[s.length - 1])
  const out = [...half]
  for (let i = half.length - 1; i >= 1; i--) {
    const s = half[i]
    const end = mir(ends[i - 1])
    out.push(s[0] === 'L' ? ['L', end] : ['C', mir(s[2]), mir(s[1]), end])
  }
  return out
}

// Formes de tenons. « fluide » reprend exactement le lobe du PDF : ajusté par
// moindres carrés sur la position de chaque tiret (longueur d'arc comprise).
export const TABS = {
  fluide: { // rond : eau, vapeur, gaz, hydrogène, air
    half: 57.25,
    segs: symmetric([
      ['L', [-35.78, 0]],
      ['C', [-39.76, 16.06], [-57.25, 15.18], [-57.25, 32.44]],
      ['C', [-57.25, 36.12], [-54.89, 58.65], [0, 58.65]],
    ]),
  },
  energie: { // flèche : électricité, lumière
    half: 46,
    segs: symmetric([['L', [-20, 0]], ['L', [-20, 20]], ['L', [-46, 20]], ['L', [0, 62]]]),
  },
  matiere: { // clé carrée : bois, combustible, structure
    half: 44,
    segs: symmetric([['L', [-22, 0]], ['L', [-22, 16]], ['L', [-44, 16]], ['L', [-44, 56]], ['L', [0, 56]]]),
  },
  meca: { // queue d'aronde crantée : arbre en rotation
    half: 46,
    segs: symmetric([['L', [-24, 0]], ['L', [-46, 56]], ['L', [-14, 56]], ['L', [-14, 44]], ['L', [0, 44]]]),
  },
}

// Gabarit du PDF : arêtes verticales `v${c}${r}` (à droite de la colonne c,
// rangée r) et horizontales `h${c}` (sous la rangée 0). dir = +1 : le tenon part
// vers +x (arête verticale) ou +y (arête horizontale).
export const PDF_EDGES = {
  v00: { type: 'fluide', dir: -1 }, v10: { type: 'fluide', dir: +1 },
  v01: { type: 'fluide', dir: +1 }, v11: { type: 'fluide', dir: -1 },
  h0: { type: 'fluide', dir: -1 }, h1: { type: 'fluide', dir: +1 }, h2: { type: 'fluide', dir: -1 },
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Segments d'une arête en repère local (u de 0 à 300) : ['L', p] ou ['C', c1, c2, p].
// spec : null (arête plate) ou { type, dir, at } (at = position du flux sur l'arête).
function edgeSegs (spec) {
  if (!spec) return [['L', [CELL, 0]]]
  const tab = TABS[spec.type]
  const at = clamp(spec.at ?? 150, tab.half + 14, CELL - tab.half - 14)
  const moved = tab.segs.map(s => [s[0], ...s.slice(1).map(([u, v]) => [u + at, v])])
  return [...moved, ['L', [CELL, 0]]]
}

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

// Arête d'une case dans le sens direct (gauche→droite, haut→bas)
function edge (kind, x, y, spec) {
  const segs = edgeSegs(spec)
  const s = spec ? spec.dir : 1
  if (kind === 'h') return place(segs, [x, y], [1, 0], [0, s])
  return place(segs, [x, y], [0, 1], [s, 0])
}

// Les 4 côtés d'une case (null : bord du plateau ou arête sans flux)
export function cellEdges (c, r, edges = PDF_EDGES) {
  return {
    top: r === 0 ? null : edges[`h${c}`] || null,
    bottom: r === ROWS - 1 ? null : edges[`h${c}`] || null,
    left: c === 0 ? null : edges[`v${c - 1}${r}`] || null,
    right: c === COLS - 1 ? null : edges[`v${c}${r}`] || null,
  }
}

// Ce que chaque côté d'une pièce envoie ou reçoit (pour les lecteurs d'écran
// et la légende) : le tenon pointe toujours dans le sens du flux.
export function cellFlows (c, r, edges) {
  const E = cellEdges(c, r, edges)
  const out = []
  if (E.top) out.push({ side: 'haut', type: E.top.type, sends: E.top.dir < 0 })
  if (E.right) out.push({ side: 'droite', type: E.right.type, sends: E.right.dir > 0 })
  if (E.bottom) out.push({ side: 'bas', type: E.bottom.type, sends: E.bottom.dir > 0 })
  if (E.left) out.push({ side: 'gauche', type: E.left.type, sends: E.left.dir < 0 })
  return out
}

// Contour fermé d'une pièce, en coordonnées du schéma (900×600).
export function piecePath (c, r, edges = PDF_EDGES) {
  const E = cellEdges(c, r, edges)
  const x = c * CELL, y = r * CELL
  const top = edge('h', x, y, E.top)
  const right = edge('v', x + CELL, y, E.right)
  const bottom = reverse(edge('h', x, y + CELL, E.bottom), [x, y + CELL])
  const left = reverse(edge('v', x, y, E.left), [x, y])
  return `M${x},${y} ${toD([...top, ...right, ...bottom, ...left])} Z`
}

// Forme seule d'un tenon, pointe vers le haut, pour les pictogrammes de légende
// (viewBox conseillée : -60 -66 120 72).
export function tabIconPath (type) {
  const segs = TABS[type].segs.map(s => [s[0], ...s.slice(1).map(([u, v]) => [f(u), f(-v)])])
  const start = segs[0][1]
  return `M${start.join(',')} ${toD(segs.slice(1))} Z`
}

// Toutes les lignes de découpe du schéma assemblé (une par côté de case,
// comme dans le PDF où le motif de pointillés repart à chaque case).
export function cutPaths (edges = PDF_EDGES) {
  const out = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      const x = (c + 1) * CELL, y = r * CELL
      out.push(`M${x},${y} ${toD(edge('v', x, y, edges[`v${c}${r}`]))}`)
    }
  }
  for (let c = 0; c < COLS; c++) {
    const x = c * CELL, y = CELL
    out.push(`M${x},${y} ${toD(edge('h', x, y, edges[`h${c}`]))}`)
  }
  return out
}

export function cutsSvg (edges = PDF_EDGES) {
  const d = cutPaths(edges)
  return `<g id="decoupes" fill="none" stroke-linejoin="round">` +
    d.map(p => `<path d="${p}" stroke="#fff" stroke-width="${CUT_HALO}"/>`).join('') +
    d.map(p => `<path d="${p}" stroke="${CUT_COLOR}" stroke-width="${CUT_WIDTH}" stroke-dasharray="${CUT_DASH}"/>`).join('') +
    `</g>`
}

export function frameSvg (w = WIDTH, h = HEIGHT) {
  return `<rect id="cadre" x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${CUT_COLOR}" stroke-width="${FRAME_WIDTH}"/>`
}
