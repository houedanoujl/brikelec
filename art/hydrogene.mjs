// Puzzle Hydrogène — relevé sur « hydrogene.jpg » (900×600)
import { svg, rows, pill, line, CUTS, FRAME } from './lib.mjs'

const BLUE = '#2a7ebb'
const LIGHT = '#c0e0f5'
const INK = '#1f5f8e'
const SLATE = '#5f6f7e'
const GREY = '#8d9dac'
const STEEL = '#3a4750'
const SUN = '#f5c242'
const ELEC = '#e1a801'

// « 2 » en indice : Trebuchet n'a pas « ₂ », le PDF le prend dans une police de
// repli plus large. On reprend le « 2 » de Trebuchet Bold (boîte d'encre
// normalisée 0..1) et on l'étire sur la boîte d'encre relevée.
const TWO = 'M1 1L0.0164 1L0.0164 0.949L0.4918 0.4909Q0.6342 0.3535 0.6342 0.2596Q0.6342 0.1482 0.4303 0.1482Q0.2746 0.1482 0.1793 0.2562L0 0.1636Q0.0533 0.0932 0.1675 0.0466Q0.2818 0 0.4201 0Q0.6506 0 0.7807 0.0687Q0.9109 0.1375 0.9109 0.2596Q0.9109 0.3716 0.7439 0.5386L0.4365 0.8451L1 0.8451Z'
function sub2 (x0, y0, x1, y1, fill = INK) {
  let i = 0
  const d = TWO.replace(/-?\d+(\.\d+)?/g, v => {
    const r = i++ % 2 === 0 ? x0 + v * (x1 - x0) : y0 + v * (y1 - y0)
    return +r.toFixed(2)
  })
  return `<path d="${d}" fill="${fill}"/>`
}

const pipe = (d, w = 7.5) =>
  `<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="${w}" stroke-linecap="butt" stroke-linejoin="round"/>`
const elec = d =>
  `<path d="${d}" fill="none" stroke="${ELEC}" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="10 8"/>`

const body = [
  rows('#e3f1fa', '#cfe5f3'),
  // conduites et flux électrique (sous les équipements)
  pipe('M217.5,150 H352.5'),
  pipe('M547.5,172.5 H646'),
  pipe('M813.75,210 V247.5 H750 V357'),
  pipe('M465,432 V405 H615 V442.5 H665'),
  elec('M195,382.5 H247.5 V153.75 H352.5'), // tracé depuis le pylône (phase relevée)
  // réservoir d'eau déminéralisée
  `<rect x="82.5" y="67.5" width="135" height="150" rx="12" fill="${LIGHT}" stroke="${BLUE}" stroke-width="4.5"/>`,
  `<path d="M82.5,131.25 Q116.25,112.5 150,131.25 T217.5,131.25" fill="none" stroke="${BLUE}" stroke-width="4.5"/>`,
  `<path d="M150,161.25 C150,161.25 137,177 137,189.5 A13,13 0 0 0 163,189.5 C163,177 150,161.25 150,161.25 Z" fill="${BLUE}"/>`,
  // électrolyseur
  `<rect x="352.5" y="75" width="195" height="142.5" rx="10" fill="#e6f3fb" stroke="${BLUE}" stroke-width="4.5"/>`,
  [416.25, 461.25].map(x => `<rect x="${x}" y="93.75" width="22.5" height="105" rx="2.5" fill="${SLATE}"/>`).join(''),
  [[420, 60], [427.5, 81], [472.5, 75]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.1" fill="#fff" stroke="${BLUE}" stroke-width="2.25"/>`).join(''),
  `<text x="368.55" y="166.5" font-size="28.5" font-weight="bold" fill="${INK}">H</text>`,
  sub2(389.25, 154.25, 398.25, 166.5),
  `<text x="500.28" y="166.5" font-size="28.5" font-weight="bold" fill="${INK}">O</text>`,
  sub2(521.5, 154.25, 530.5, 166.5),
  // compresseur
  `<rect x="645" y="131.25" width="120" height="75" rx="7.5" fill="${GREY}"/>`,
  `<rect x="682.5" y="105" width="25.5" height="30" fill="${SLATE}"/>`,
  line(765, 168.75, 800, 168.75, SLATE, 7.5),
  `<circle cx="817.5" cy="168.75" r="43.5" fill="${SLATE}"/>`,
  `<circle cx="817.5" cy="168.75" r="18" fill="#c9d3dc"/>`,
  // pylône
  `<path d="M98.1,532.5 L150,367.5 L201.9,532.5" fill="none" stroke="${STEEL}" stroke-width="5" stroke-linejoin="round"/>`,
  line(105, 382.5, 195, 382.5, STEEL, 5),
  line(52.5, 401.25, 247.5, 401.25, STEEL, 2),
  line(123.75, 442.5, 176.25, 442.5, STEEL, 4.5),
  line(111.25, 487.5, 188.75, 487.5, STEEL, 4.5, 'butt'),
  `<circle cx="240" cy="360" r="19.5" fill="${SUN}"/>`,
  // turbine à gaz
  `<polygon points="337.5,412.5 435,438.75 435,491.25 337.5,517.5" fill="${GREY}"/>`,
  `<polygon points="562.5,412.5 495,438.75 495,491.25 562.5,517.5" fill="${GREY}"/>`,
  `<rect x="435" y="431.25" width="60" height="67.5" rx="10" fill="${SLATE}"/>`,
  `<path d="M450,465 C452,456 455,443 463.5,443 C467,443 470.5,448.5 472.5,453.5 C474,449 477,444 480,444.5 C484,446 483.5,458 483.5,465 C481,472 476,476.5 471,476.25 C463,476 455,470 450,465 Z" fill="#5bb8f1"/>`,
  // stockage d'hydrogène
  line(697.5, 512.5, 683.75, 538.75, BLUE, 6.75),
  line(802.5, 512.5, 816.25, 538.75, BLUE, 6.75),
  line(750, 525, 750, 547, BLUE, 6.75),
  `<circle cx="750" cy="442.5" r="86.25" fill="${LIGHT}" stroke="${BLUE}" stroke-width="4.5"/>`,
  `<path d="M690,397.5 Q712,368 761.25,373.5" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round"/>`,
  `<text x="724" y="461.25" font-size="48" font-weight="bold" fill="${INK}">H</text>`,
  sub2(758.75, 440.5, 774, 461.25),
  // étiquettes
  pill(150, 0, 218, BLUE, 'Eau déminéralisée'),
  pill(450, 0, 176, BLUE, 'Électrolyseur'),
  pill(750, 0, 155, BLUE, 'Compresseur'),
  pill(150, 1, 291.5, BLUE, 'Électricité renouvelable'),
  pill(450, 1, 176, BLUE, 'Turbine à gaz'),
  pill(750, 1, 249.5, BLUE, 'Stockage d’hydrogène'),
  CUTS,
  FRAME,
].join('\n')

export default svg(900, 600, body, 'Puzzle Hydrogène')
