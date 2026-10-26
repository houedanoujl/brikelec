// Puzzle Solaire — relevé sur « Puzzle Solaire.pdf » (900×600)
import { svg, rows, pill, flow, line, CUTS, FRAME } from './lib.mjs'

const SUN = '#f5c242'
const NAVY = '#26456f'
const PANEL = '#244570'
const GRID = '#aac1db'
const STEEL = '#3a4750'
const GREEN = '#3f9b5a'

// Soleil : disque et 12 rayons (tous les 30°)
const cx = 150, cy = 142.5
const rays = Array.from({ length: 12 }, (_, k) => {
  const a = (k * 30) * Math.PI / 180
  const p = r => [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2)]
  const [x1, y1] = p(67.5), [x2, y2] = p(93.75)
  return line(x1, y1, x2, y2, SUN, 7)
}).join('')

// Panneau incliné : bords obliques (pente relevée 0,1889), 9 colonnes, 2 rangées
const SLOPE = 0.1889
function panel (dy) {
  const top = 75 + dy, bottom = 138.75 + dy, mid = 106.5 + dy
  const X = (x80, y) => +(x80 + (80 + dy - y) * SLOPE).toFixed(2)
  const v = (x80, w) => line(X(x80, top), top, X(x80, bottom), bottom, GRID, w, 'butt')
  return `<polygon points="${X(351.625, top)},${top} ${X(546.625, top)},${top} ${X(546.625, bottom)},${bottom} ${X(351.625, bottom)},${bottom}" fill="${PANEL}"/>` +
    [375.5, 396.5, 439.25, 460.25, 503, 524].map(x => v(x, 1.5)).join('') +
    [415.375, 479.125].map(x => v(x, 2.25)).join('') +
    line(X(351.625, mid), mid, X(546.625, mid), mid, GRID, 1.5, 'butt') +
    `<polygon points="${X(351.625, top)},${top} ${X(546.625, top)},${top} ${X(546.625, bottom)},${bottom} ${X(351.625, bottom)},${bottom}" fill="none" stroke="${GRID}" stroke-width="2"/>`
}

const body = [
  rows('#fff6d9', '#e3eedd'),
  // flux (sous les équipements)
  flow('M206.5,142.5 H341'),
  flow('M540,127.5 H668'),
  flow('M750,225.25 V376'),
  flow('M359.75,453.75 H196.75'), // tracé de droite à gauche (phase du motif relevée)
  flow('M538.75,453.75 H680'),
  // soleil
  rays,
  `<circle cx="${cx}" cy="${cy}" r="49.5" fill="${SUN}"/>`,
  // panneaux photovoltaïques
  panel(0), panel(78.75),
  // onduleur
  `<rect x="667.5" y="75" width="165" height="150" rx="9" fill="#dce3e9" stroke="${NAVY}" stroke-width="4.5"/>`,
  `<text x="691.85" y="161.1" font-size="33" font-weight="bold" fill="${NAVY}">DC</text>`,
  `<rect x="734.8" y="150.4" width="26" height="1.9" fill="${NAVY}"/>`,
  `<path d="M757.3,145.4 L758.9,145.4 L765.2,151.35 L758.9,157.3 L757.3,157.3 L762,151.35 Z" fill="${NAVY}"/>`,
  `<text x="770.92" y="161.1" font-size="33" font-weight="bold" fill="${NAVY}">AC</text>`,
  // pylône
  line(150, 367.5, 98.1, 530.5, STEEL, 5),
  line(150, 367.5, 201.9, 530.5, STEEL, 5),
  line(105, 382.5, 195, 382.5, STEEL, 5),
  line(51.5, 401.25, 248.5, 401.25, STEEL, 2, 'butt'),
  line(123.75, 442.5, 176.25, 442.5, STEEL, 4.5),
  line(111.25, 487.5, 188.75, 487.5, STEEL, 4.5),
  // stockage par batteries
  `<rect x="427.5" y="381" width="45" height="20" rx="3" fill="${GREEN}"/>`,
  `<rect x="360" y="397.5" width="179.75" height="112.5" rx="7.5" fill="#e8f2e9" stroke="${GREEN}" stroke-width="4.5"/>`,
  [378.75, 419.25, 459.75, 500.25].map(x => `<rect x="${x}" y="416.25" width="30" height="75" rx="3" fill="${GREEN}"/>`).join(''),
  // transformateur
  [697.5, 741.75, 786].map(x => `<rect x="${x}" y="373.5" width="16.5" height="42" fill="#f3f3f3" stroke="#5f6f7e" stroke-width="2"/>`).join(''),
  `<rect x="675" y="413.5" width="150" height="104" rx="7" fill="#7b8d9b"/>`,
  [712.5, 750, 787.5].map(x => line(x, 423.75, x, 506.25, '#5f6f7e', 3)).join(''),
  // étiquettes
  pill(150, 0, 102.5, NAVY, 'Soleil'),
  pill(450, 0, 291.5, NAVY, 'Panneaux photovoltaïques'),
  pill(750, 0, 123.5, NAVY, 'Onduleur'),
  pill(150, 1, 218, NAVY, 'Réseau électrique'),
  pill(450, 1, 270.5, NAVY, 'Stockage par batteries'),
  pill(750, 1, 186.5, NAVY, 'Transformateur', { sx: 0.98 }),
  CUTS,
  FRAME,
].join('\n')

export default svg(900, 600, body, 'Puzzle Solaire')
