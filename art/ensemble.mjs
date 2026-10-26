// La centrale du futur — relevé sur reference/ensemble.jpg (page 1200×900)
import { svg, line } from './lib.mjs'

const r2 = v => +v.toFixed(2)
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${extra}/>`
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`
const poly = pts => pts.map(p => p.map(r2).join(',')).join(' ')

// ---------------------------------------------------------------- décor
const SKY = '#d7eef6'
const HILL = '#bee1b9'
const MEADOW = '#8dc183'

// nuages : unions de 4 cercles (relevés)
const cloud = (cs, n) => `<g class="cloud cloud-${n}" fill="#fff">${cs.map(([x, y, r]) => circle(x, y, r, '#fff').replace(' fill="#fff"', '')).join('')}</g>`
const clouds = [
  cloud([[97.5, 225, 22.5], [124.5, 215.75, 28], [155.5, 225, 22.5], [125.75, 232, 26]], 1),
  cloud([[420, 97.5, 25], [450, 87.25, 31.25], [484.5, 97.5, 25], [451.5, 106.25, 28.25]], 2),
  cloud([[750, 172.5, 20], [774, 164.25, 24.85], [801.5, 172.5, 20], [775.25, 179.5, 22.6]], 3),
].join('')

// collines
const pl = s => s.trim().split(/\s+/).map(t => t.split(':').map(Number))
const rightHill = pl(`585:591.75 590:591.25 645:588.25 650:587 655:586.5 755:566.75 760:565.25 790:556.25 795:554.5 800:553 850:535.25 855:534 865:530.5 870:529 875:527.25 880:525.75 885:524.75 890:523.5 895:521.75 900:520.5 905:519.5 910:518.25 915:517 920:516 925:515 930:514 935:513 940:512 945:511.25 950:510.5 955:509.75 960:509 965:508.25 970:507.75 975:507.25 980:506.75 985:506.25 990:506 995:505.5 1000:505.5 1005:505.25 1010:505.25 1015:505.25 1020:505.25 1025:505.25 1030:505.25 1035:505.5 1040:506 1045:506.25 1050:506.75 1055:507.5 1060:507.75 1065:508.5 1070:509.25 1075:510 1080:510.75 1085:511.75 1090:513 1095:514 1100:515.5 1105:516.75 1110:518.25 1115:519.5 1125:522.75 1140:529.25 1145:530.75 1150:533.25 1155:535.5 1160:538.25 1165:540.75 1170:543.5 1175:546.5 1180:549.25 1185:552.5 1190:555.75 1195:559.5 1200:563.25`)
const meadowTop = pl(`0:622.5 10:622 20:621.25 30:620.5 40:619.75 50:619.25 60:618.75 70:618 80:617.5 90:617.1 165:614 170:613.75 180:613.5 190:613.5 195:613.25 300:612.5 320:612.75 340:613 360:613.5 380:614 400:614.75 410:615 586:626 592:626.5 640:628.9 700:630.25 800:631 900:631.75 1007:631.75 1010:631.5 1020:630.75 1030:630 1040:629.25 1050:628.25 1060:627.5 1070:626.5 1080:625.75 1090:624.75 1100:623.75 1115:622 1120:621.5 1130:620.5 1140:619.25 1150:618 1160:616.75 1170:615.5 1180:614 1190:613 1195:612 1200:611.5`)
const hills = [
  `<path d="M-4.65,580.08 C70.46,542.17 152.32,527.41 210.99,527.63 C313.53,526.7 379.07,557.58 435.9,573.37 L600,620 L600,660 L-5,660 Z" fill="${HILL}"/>`,
  `<path d="M470,640 L520,600 L${rightHill.map(p => p.join(',')).join(' L')} L1205,660 L470,660 Z" fill="${HILL}"/>`,
  `<path d="M${meadowTop.map(p => p.join(',')).join(' L')} L1200,775 L0,775 Z" fill="${MEADOW}"/>`,
].join('')

const road = rect(0, 772.5, 1200, 46.5, '#7d8790') +
  `<line x1="-1.5" y1="795.75" x2="1200" y2="795.75" stroke="#f2f3f4" stroke-width="3" stroke-dasharray="30 18"/>` +
  rect(0, 819, 1200, 81, '#6fa56b')

const titles =
  `<text x="52.5" y="89.9" font-size="47.75" font-weight="bold" letter-spacing="0.15" fill="#1e3a5e">LA <tspan dx="-2.6">CENTRALE DU FUTUR</tspan></text>` +
  `<text x="52.6" y="127.4" font-size="22.5" fill="#314b63">Hydrogène · Biomasse · Solaire · Éolien · Cycle combiné</text>`

// pylône, câble et petit poste
const STEEL = '#3a4750'
const pylon = [
  `<path d="M1110,630 L1128.75,450 L1147.5,630" fill="none" stroke="${STEEL}" stroke-width="3.5" stroke-linejoin="round"/>`,
  line(1102.5, 465, 1155, 465, STEEL, 3.5),
  line(1110, 487.5, 1147.5, 487.5, STEEL, 3),
  line(1119, 525, 1138.5, 525, STEEL, 3, 'butt'),
  line(1114.5, 570, 1143.25, 570, STEEL, 3, 'butt'),
  `<path d="M1102.5,465 C1068,482 1033,526 1000.5,576" fill="none" stroke="${STEEL}" stroke-width="2"/>`,
  rect(979, 591.25, 41.5, 37.25, '#7b8d9b'),
  line(990, 576, 990, 591, STEEL, 3.5),
  line(1009.5, 576, 1009.5, 591, STEEL, 3.5),
].join('')

const tree = (cx, cy, r, tw, bottom) =>
  rect(r2(cx - tw / 2), cy, tw, r2(bottom - cy), '#6b4f2a') + circle(cx, cy, r, '#4e9a59')
const trees = tree(52.5, 723.75, 24, 7, 764) + tree(153.75, 711.5, 21.5, 6.5, 748) + tree(525, 733.5, 19, 6, 765.75)

// ---------------------------------------------------------------- éolien
const MAST = '#f3f7fa'
const BLADE = '#8697a4'
// s = échelle (éolienne 1 = 1), mast = [demi-largeur haut, y bas, demi-largeur bas]
function turbine (hx, hy, s, [hwTop, yb, hwBot]) {
  const ang = [-78, 42, 162].map(a => a * Math.PI / 180)
  const tip = a => [r2(hx + 86.5 * s * Math.cos(a)), r2(hy + 86.5 * s * Math.sin(a))]
  const mast = `<polygon points="${poly([[hx - hwTop, hy], [hx + hwTop, hy], [hx + hwBot, yb], [hx - hwBot, yb]])}" fill="${MAST}" stroke="${BLADE}" stroke-width="${r2(1.5 * s)}" stroke-linejoin="round"/>`
  const blades = ang.map(a => { const [x, y] = tip(a); return line(hx, hy, x, y, BLADE, r2(9.5 * s)) + line(hx, hy, x, y, '#fff', r2(6 * s)) }).join('')
  return mast + `<g class="rotor" style="transform-origin: ${hx}px ${hy}px">${blades}${circle(hx, hy, r2(8.25 * s), BLADE)}</g>`
}
const eolien = [
  turbine(112.5, 345, 1, [3, 570, 7]),
  turbine(240, 372.75, 0.85, [2.85, 563.9, 5.92]),
  turbine(360, 407.25, 0.7, [2.5, 568.5, 5.37]),
].join('')

// ---------------------------------------------------------------- hydrogène
const H2B = '#2a7eba'
const H2T = '#1f5e8e'
// « ₂ » (glyphe de repli) : tracé relevé, origine = bas gauche de l'encre
const SUB2 = 'M0,-14.56 C1.75,-16.15 4.25,-17 6.94,-17 C9.85,-17 11.69,-15 11.69,-12.15 C11.69,-10.45 11.15,-9.15 10.22,-7.94 L6.16,-3.25 L12.56,-3.25 L12.56,0.03 L0.28,0.03 L0.28,-1.22 L6.63,-8.72 C7.45,-9.65 7.88,-10.35 7.88,-11.35 C7.88,-12.95 6.85,-14.03 5.38,-14.03 C4.15,-14.03 3.15,-13.25 2.19,-12.06 Z'
const sub2 = (x, y, k) => `<path transform="translate(${x},${y}) scale(${k})" d="${SUB2}" fill="${H2T}"/>`
const hydrogene = [
  line(79.75, 630, 95, 614.75, H2B, 6),
  line(167.75, 630, 152.5, 614.75, H2B, 6),
  circle(123.75, 573.75, 54, '#c0e0f5', ` stroke="${H2B}" stroke-width="4.5"`),
  `<path d="M${r2(132.3 + 53.6 * Math.cos(-142.3 * Math.PI / 180))},${r2(584.4 + 53.6 * Math.sin(-142.3 * Math.PI / 180))} A53.6,53.6 0 0 1 ${r2(132.3 + 53.6 * Math.cos(-74.7 * Math.PI / 180))},${r2(584.4 + 53.6 * Math.sin(-74.7 * Math.PI / 180))}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
  `<text x="102.67" y="588.75" font-size="39" font-weight="bold" fill="${H2T}">H</text>`,
  sub2(130.75, 588.75, 1),
  rect(201.5, 571.75, 92, 56.75, '#e6f3fb', ` rx="7.25" stroke="${H2B}" stroke-width="3.5"`),
  `<text x="230.6" y="611.25" font-size="31.25" font-weight="bold" fill="${H2T}">H</text>`,
  sub2(253.2, 611.1, 0.785),
  `<path d="M123.25,629.5 V619.5 H201.5 M293.5,619.5 H438.75" fill="none" stroke="${H2B}" stroke-width="7" stroke-linecap="round" stroke-linejoin="miter"/>`,
].join('')

// ---------------------------------------------------------------- biomasse
const WOOD = '#ba8a56'
const BARK = '#6b4e2a'
const logs = [[754.5, [213.75, 239.25, 264.75, 290.25]], [739.5, [226.5, 252, 277.5]], [724.5, [239.25, 264.75]]]
  .map(([y, xs]) => xs.map(x => circle(x, y, 12, WOOD, ` stroke="${BARK}" stroke-width="2"`)).join('')).join('')
const smoke = cs => `<g class="smoke">${cs.map(([x, y, r]) => circle(x, y, r, '#fff', ' stroke="#e3e9f0" stroke-width="2.5"')).join('')}</g>`
const biomasse = [
  line(264.75, 726, 335, 675.6, '#6b4f2a', 7.25, 'butt'),
  logs,
  rect(322.5, 667.5, 52.5, 91.5, '#b98a56'),
  `<ellipse cx="348.75" cy="667.5" rx="26.25" ry="10.5" fill="#d0a570"/>`,
  rect(375, 709.5, 30, 6, '#6b4f2a'),
  rect(457.5, 625, 18, 72, '#6b4f2a'),
  rect(405, 696, 82.5, 63, '#a67a4b'),
  smoke([[466.5, 624, 11.5], [481.5, 609, 14.5]]),
].join('')

// ---------------------------------------------------------------- cycle combiné
const ROOF = '#5f6f7e'
const BODY = '#8d9dac'
const DARK = '#5e6c79'
const ring = (cx, cy, ro, ri) => circle(cx, cy, ro, '#6b7b8b') + circle(cx, cy, ri, '#c6d0da')
const cycle = [
  // colonne rayée
  rect(438.75, 495, 33.75, 135, '#a9b5c1'),
  [506.25, 522.75, 539.25, 555.75, 572.25, 588.75, 605.25].map(y => rect(438.75, y - 1, 33.75, 2, '#7e8e9d')).join(''),
  // bâtiment 1
  rect(472.5, 534, 112.5, 96, BODY),
  rect(468.75, 523.5, 120, 10.5, ROOF),
  ring(528.75, 581.25, 24, 12),
  // réservoir 1
  rect(592.5, 558.75, 52.5, 71, '#c9d3dc', ' rx="10.5"'),
  rect(592.5, 588.75, 52.5, 7.5, '#6b7b8b'),
  // tuyauterie haute
  `<path d="M705,422 V393.75 H858.75 V540" fill="none" stroke="${DARK}" stroke-width="6" stroke-linejoin="round"/>`,
  // grand bâtiment
  rect(660, 420, 90, 210, '#7b8d9b'),
  [682.5, 705, 727.5].map(x => line(x, 427.5, x, 622.5, DARK, 3)).join(''),
  // cheminée
  `<polygon points="750,442.5 762,430.5 762,450" fill="${DARK}"/>`,
  rect(761.25, 315, 27, 315, DARK),
  rect(761.25, 315, 27, 22.5, '#d9544f'),
  rect(761.25, 337.5, 27, 22.5, '#f3f3f3'),
  rect(761.25, 360, 27, 22.5, '#d9544f'),
  smoke([[774.75, 294, 19], [796.5, 271.5, 23.5], [825, 252, 20.5], [852, 234, 16]]),
  // bâtiment 2
  rect(802.5, 547.5, 112.5, 82.5, BODY),
  rect(798, 537, 121.5, 10.5, ROOF),
  ring(847.5, 588.75, 19.5, 9),
  // réservoir 2
  rect(916.5, 573.5, 45, 56.5, '#c9d3dc', ' rx="10.5"'),
  // dalle
  rect(405, 628.5, 600, 19.5, '#aab4bd'),
  `<path d="M487.5,727.5 H675 V631.25" fill="none" stroke="#8fa0af" stroke-width="6" stroke-linejoin="round"/>`,
].join('')

// ---------------------------------------------------------------- solaire
const SUN = '#f5c242'
const sunRays = Array.from({ length: 12 }, (_, k) => {
  const a = k * 30 * Math.PI / 180
  const p = r => [r2(1050 + r * Math.cos(a)), r2(112.5 + r * Math.sin(a))]
  const [x1, y1] = p(63.5), [x2, y2] = p(86.25)
  return line(x1, y1, x2, y2, SUN, 6)
}).join('')
const sun = `<g class="sun" style="transform-origin: 1050px 112.5px">${sunRays}${circle(1050, 112.5, 46.5, SUN)}</g>`
function panel (dx, dy) {
  const t = 663.75 + dy, b = 701.25 + dy, m = 682.5 + dy
  const X = (x, y) => r2(x + dx - (y - t) * 0.32)
  const P = '#a9c1db'
  const v = x => line(X(x, t), t, X(x, b), b, P, 1.5, 'butt')
  return `<polygon points="${X(817.5, t)},${t} ${X(885, t)},${t} ${X(885, b)},${b} ${X(817.5, b)},${b}" fill="#244570" stroke="${P}" stroke-width="1.5"/>` +
    v(840) + v(862.5) + line(X(817.5, m), m, X(885, m), m, P, 1.5, 'butt')
}
const panels = [0, 48.75].map(dy => [0, 75, 150, 225, 300].map(dx => panel(dx, dy)).join('')).join('')

// ---------------------------------------------------------------- légende
const LT = '#1e2933'
const pills = [
  ['hydrogene', 71.6, 201.65, '#2a7eba', 94.125, 'HYDROGÈNE', 120.91],
  ['biomasse', 296.9, 186.2, '#b98a56', 319.5, 'BIOMASSE', 351.16],
  ['cycle', 489.9, 265.2, '#6b7b8b', 512.75, 'CYCLE COMBINÉ', 552.4],
  ['solaire', 762.4, 170.2, '#244570', 784.75, 'SOLAIRE', 816.15],
  ['eolien', 950.1, 154.8, '#8696a3', 972.75, 'ÉOLIEN', 1001.91],
].map(([id, x, w, c, dot, txt, tx]) =>
  `<g id="legende-${id}">` +
  rect(x, 838.375, w, 42.125, '#fff', ` rx="21.06" stroke="${c}" stroke-width="3.875"`) +
  circle(dot, 859.5, 8, c) +
  `<text x="${tx}" y="867.75" font-size="21.75" font-weight="bold" fill="${LT}">${txt}</text></g>`
).join('')

const body = [
  `<g id="decor">`,
  rect(0, 0, 1200, 900, SKY),
  clouds, hills, road, titles, pylon,
  `</g>`,
  `<g id="eolien" data-plant="eolien">${eolien}</g>`,
  `<g id="cycle" data-plant="cycle">${cycle}</g>`,
  `<g id="biomasse" data-plant="biomasse">${biomasse}</g>`,
  `<g id="hydrogene" data-plant="hydrogene">${hydrogene}</g>`,
  `<g id="decor-arbres">${trees}</g>`,
  `<g id="solaire" data-plant="solaire">${sun}${panels}</g>`,
  `<g id="legende">${pills}</g>`,
].join('\n')

export default svg(1200, 900, body, 'La centrale du futur')
