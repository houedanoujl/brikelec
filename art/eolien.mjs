// Puzzle Éolien — relevé sur reference/eolien.jpg (900×600)
import { svg, rows, pill, line, CUTS, FRAME } from './lib.mjs'

const BLUE = '#698ba4'   // vent et traits des étiquettes
const GREY = '#8696a3'   // contours, moyeu, nacelle
const DARK = '#5f6f7e'
const PALE = '#e8edf1'
const WHITE = '#f3f7fa'

// Vent : 3 vagues identiques, espacées de 52,5
const wave = dy =>
  `<path d="M37.5,${97.5 + dy} C72.5,${77.5 + dy} 107.5,${77.5 + dy} 142.5,${97.5 + dy} S212.5,${117.5 + dy} 247.5,${97.5 + dy}" fill="none" stroke="${BLUE}" stroke-width="8" stroke-linecap="round"/>`

// Rotor : 3 pales (trait gris 16,5 puis blanc 10,5), moyeu r 19,5
const hx = 450, hy = 142.5, L = 101.25
const blades = [-90, 30, 150].map(a => {
  const r = a * Math.PI / 180
  const x = +(hx + L * Math.cos(r)).toFixed(3), y = +(hy + L * Math.sin(r)).toFixed(3)
  return [line(hx, hy, x, y, GREY, 16.5), line(hx, hy, x, y, '#ffffff', 10.5)]
})

const body = [
  rows('#e3f0f8', '#d7e6d1'),
  // vent
  [0, 52.5, 105].map(wave).join(''),
  // pales du rotor
  blades.map(b => b[0]).join(''),
  blades.map(b => b[1]).join(''),
  `<circle cx="${hx}" cy="${hy}" r="19.5" fill="${GREY}"/>`,
  // nacelle
  `<polygon points="825,120 862.5,142.5 825,165" fill="${GREY}"/>`,
  `<rect x="645" y="105" width="180" height="75" rx="15" fill="${PALE}" stroke="${GREY}" stroke-width="3.5"/>`,
  `<circle cx="697.5" cy="142.5" r="24" fill="${GREY}"/>`,
  `<circle cx="750" cy="142.5" r="16.5" fill="${GREY}"/>`,
  `<rect x="776.25" y="127.5" width="37.5" height="30" rx="3" fill="${DARK}"/>`,
  // mât
  `<polygon points="142.5,354 157.5,354 163.5,540 136.5,540" fill="${WHITE}" stroke="${GREY}" stroke-width="2"/>`,
  `<rect x="144" y="502.5" width="12" height="37.5" fill="${GREY}"/>`,
  `<rect x="120" y="337.5" width="60" height="16.5" fill="${PALE}" stroke="${GREY}" stroke-width="2"/>`,
  // câble enterré (sous le terrain), tracé de droite à gauche
  `<path d="M670,517.5 H560" fill="none" stroke="#6b4f2a" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 7"/>`,
  // fondation
  `<rect x="322.5" y="396" width="255" height="144" fill="#b9a98f"/>`,
  `<rect x="322.5" y="396" width="255" height="19.5" fill="#8dc183"/>`,
  `<polygon points="375,412.5 525,412.5 495,502.5 405,502.5" fill="#9aa5ab"/>`,
  [[405, 396], [435, 429], [465, 462], [495, 495]].map(([a, b]) => line(a, 423.75, b, 491.25, DARK, 2.5)).join(''),
  `<rect x="435" y="337.5" width="30" height="75" fill="${WHITE}" stroke="${GREY}" stroke-width="2"/>`,
  // poste de raccordement
  `<rect x="675" y="412.5" width="150" height="105" rx="6" fill="#7b8d9b"/>`,
  [712.5, 750, 787.5].map(x => line(x, 423.75, x, 506.25, DARK, 3)).join(''),
  [697.5, 741.75, 786].map(x => `<rect x="${x}" y="373.5" width="16.5" height="39" fill="#f3f3f3" stroke="${DARK}" stroke-width="2"/>`).join(''),
  // étiquettes
  pill(150, 0, 81.5, BLUE, 'Vent'),
  pill(450, 0, 186.5, BLUE, 'Pales du rotor'),
  pill(750, 0, 270.5, BLUE, 'Nacelle et génératrice'),
  pill(150, 1, 71, BLUE, 'Mât'),
  pill(450, 1, 134, BLUE, 'Fondation'),
  pill(750, 1, 260, BLUE, 'Poste de raccordement'),
  CUTS,
  FRAME,
].join('\n')

export default svg(900, 600, body, 'Puzzle Éolien')
