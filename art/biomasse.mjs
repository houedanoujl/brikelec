// Puzzle Biomasse — relevé sur « biomasse.jpg » (3600×2400 = 4× la page 900×600)
import { svg, rows, pill, line, CUTS, FRAME } from './lib.mjs'

const LABEL = '#b98a56'
const ROD = '#6b4f2b' // tiges, cerclages, contours des bûches, cheminée
const LOG = '#c9965d'
const LOG_CORE = '#e3bb87'
const BELT = '#4a4f55'
const STEEL_L = '#8d9dac' // rouleaux, cône, conduite
const STEEL_D = '#5f6f7e'
const SILO = '#b98a56'
const ROOF = '#8d6b3e'
const BOILER = '#a67a4b'

const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${extra}/>`

// Pile de bûches : 4 + 3 + 2, pas de 39 en x, 34,5 en y
const logs = [[75, 202.5], [114, 202.5], [153, 202.5], [192, 202.5],
  [94.5, 168], [133.5, 168], [172.5, 168], [114, 133.5], [153, 133.5]]
  .map(([x, y]) => circle(x, y, 19.5, LOG, ` stroke="${ROD}" stroke-width="3"`) + circle(x, y, 7.5, LOG_CORE)).join('')

// Bande du convoyeur : rectangle incliné de pente 3/7 (direction (7,-3))
const n = Math.hypot(7, 3)
const P = (s, t) => {
  const x = (s * 7 + t * 3) / n, y = (-s * 3 + t * 7) / n
  return `${x.toFixed(2)},${y.toFixed(2)}`
}
const S0 = 237.07, S1 = 463.66, T0 = 322.1, T1 = 345.6
const belt = `<polygon points="${P(S0, T0)} ${P(S1, T0)} ${P(S1, T1)} ${P(S0, T1)}" fill="${BELT}"/>`

const body = [
  rows('#f4ebdc', '#e2d2b8'),
  // liaisons (sous les équipements)
  line(213.75, 187.5, 345, 187.5, ROD, 7.5),
  line(551.25, 123.75, 700, 123.75, ROD, 7.5, 'butt'),
  line(750, 230, 750, 415, ROD, 7.5, 'butt'),
  line(450, 427.5, 665, 427.5, STEEL_L, 7.5, 'butt'),
  // stock de bois
  logs,
  // convoyeur
  belt,
  [[382.5, 196.5], [416.25, 182.25], [450, 168], [483.75, 153.75], [517.5, 139.5]].map(([x, y]) => circle(x, y, 6.75, SILO)).join(''),
  circle(356.25, 216, 13.5, STEEL_L),
  circle(551.25, 124.5, 13.5, STEEL_L),
  // silo
  `<polygon points="697.5,82.5 750,45 802.5,82.5" fill="${ROOF}"/>`,
  `<rect x="697.5" y="82.5" width="105" height="150" fill="${SILO}"/>`,
  line(697.5, 127.5, 802.5, 127.5, ROD, 3),
  line(697.5, 172.5, 802.5, 172.5, ROD, 3),
  // alternateur
  `<rect x="112.5" y="381" width="45" height="36" rx="4.5" fill="${STEEL_D}"/>`,
  `<rect x="45" y="412.5" width="172.5" height="97.5" rx="18" fill="#c9d3dc"/>`,
  `<rect x="45" y="453.75" width="172.5" height="9" fill="${STEEL_D}"/>`,
  `<rect x="217.5" y="453.75" width="120" height="7.5" fill="${STEEL_D}"/>`,
  `<polyline points="236.25,390 213.75,442.5 236.25,442.5 217.5,495" fill="none" stroke="#f5c242" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  // turbine à vapeur
  line(390, 375, 390, 412.5, STEEL_D, 6),
  line(333, 457.5, 355, 457.5, STEEL_D, 9),
  line(505, 457.5, 554.75, 457.5, STEEL_D, 9),
  `<polygon points="352.5,449.5 457.5,405.25 457.5,509.75 352.5,465.5" fill="${STEEL_L}"/>`,
  `<rect x="457.5" y="427.5" width="52.5" height="60" rx="5.5" fill="${STEEL_D}"/>`,
  // chaudière
  `<rect x="660" y="412.5" width="142.5" height="120" rx="6" fill="${BOILER}"/>`,
  `<rect x="679" y="431.5" width="44.5" height="26.5" fill="#e6f3fb"/>`,
  `<path d="M705.43,510 C716.2,460.92 734.15,460.92 744.92,510 Z M732.9,510 C744.95,456.06 756.55,456.06 768.6,510 Z" fill="#f28c28"/>`,
  // cheminée et fumée
  `<rect x="817.5" y="352.5" width="25.5" height="180" fill="${ROD}"/>`,
  circle(830, 336.5, 16, '#fff', ' stroke="#e2e9f0" stroke-width="2"'),
  circle(849.75, 318, 21, '#fff', ' stroke="#e2e9f0" stroke-width="2"'),
  // étiquettes
  pill(150, 0, 176, LABEL, 'Stock de bois'),
  pill(450, 0, 134, LABEL, 'Convoyeur'),
  pill(750, 0, 81.5, LABEL, 'Silo'),
  pill(150, 1, 155, LABEL, 'Alternateur'),
  pill(450, 1, 207.5, LABEL, 'Turbine à vapeur'),
  pill(750, 1, 260, LABEL, 'Chaudière et cheminée'),
  CUTS,
  FRAME,
].join('\n')

export default svg(900, 600, body, 'Puzzle Biomasse')
