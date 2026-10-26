<script setup>
// Bandeau « Abidjan alimentée par la centrale du futur ».
// Même main que les schémas du client : aplats, formes simples, palette
// des bleus gris, ciel, verts et marine. Aucun dégradé.
//
// level (0 à 5) : centrales allumées. Chaque fenêtre porte data-step (1 à 5) ;
// elle s'allume quand level >= step. À 5, Tour F et haubans du pont s'allument.
// L'état au repos est porté par les classes CSS (rendu serveur, mouvement réduit) ;
// GSAP anime les passages : mise sous tension à chaque palier, vie de la ville,
// final à 5/5 (Tour F, haubans, vitraux, feux d'artifice).

const props = defineProps({
  level: { type: Number, default: 0 },
  celebrate: { type: Boolean, default: false },
})

const lvl = computed(() => Math.max(0, Math.min(5, Math.round(props.level || 0))))

const ariaLabel = computed(() => {
  const n = lvl.value
  if (n === 0) return 'Abidjan au crépuscule : aucune centrale n’alimente encore la ville'
  if (n === 5) return 'Abidjan illuminée : les 5 centrales sur 5 alimentent la ville'
  return `Abidjan : ${n} centrale${n > 1 ? 's' : ''} sur 5 alimente${n > 1 ? 'nt' : ''} la ville`
})

const rootClass = computed(() => {
  const c = [`lv-${lvl.value}`]
  for (let k = 1; k <= lvl.value; k++) c.push(`on-${k}`)
  if (lvl.value > 0) c.push('powered')
  if (props.celebrate) c.push('celebrate')
  return c
})

// ------------------------------------------------------------ ciel (3 bandes)
// Teintes interpolées entre crépuscule (0) et nuit éclairée (5).
const SKY_0 = ['#1f2f47', '#2b3f5c', '#34496a']
const SKY_5 = ['#17345e', '#22497b', '#2f6094']
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('')
const sky = computed(() => SKY_0.map((c, i) => mix(c, SKY_5[i], lvl.value / 5)))
// ville éteinte : grise et sombre ; chaque centrale lui rend couleurs et lumière
const satAt = n => +(n / 5).toFixed(3)
const briAt = n => +(0.72 + 0.28 * n / 5).toFixed(3)
const sat = computed(() => satAt(lvl.value))
const bri = computed(() => briAt(lvl.value))
const fid = `abj-${useId().replace(/[^\w-]/g, '')}`
const furl = `url(#${fid})`

// ------------------------------------------------------------ pseudo-hasard
function mulberry32 (seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261026)
const r2 = v => Math.round(v * 100) / 100
const step = () => 1 + Math.floor(rand() * 5)

const GROUND = 238 // pied des immeubles (quai du Plateau)

// ------------------------------------------------------------ fenêtres
// Grille de fenêtres dans un rectangle ; chaque fenêtre a un pas 1 à 5.
const windows = []
function grid (x, y, w, h, { ww = 3.2, wh = 4.2, gx = 6.4, gy = 8, mx = 5, mt = 7, mb = 6 } = {}) {
  const cols = Math.max(1, Math.floor((w - 2 * mx + (gx - ww)) / gx))
  const rows = Math.max(1, Math.floor((h - mt - mb + (gy - wh)) / gy))
  const ox = x + (w - (cols * gx - (gx - ww))) / 2
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = step()
      windows.push({
        x: r2(ox + c * gx), y: r2(y + mt + r * gy), w: ww, h: wh, s,
        tw: rand() < 0.18, d: r2(rand() * 3),
      })
    }
  }
}

// ------------------------------------------------------------ arrière-plan
// Silhouettes lointaines (Adjamé, Treichville), sans fenêtres.
const far = []
{
  let x = -10
  while (x < 1210) {
    const w = 18 + Math.floor(rand() * 34)
    const h = 14 + Math.floor(rand() * 34)
    far.push({ x, y: GROUND - h, w, h })
    x += w - 2
  }
}

// ------------------------------------------------------------ Plateau
// [x, largeur, sommet, teinte, toit] — de l'arrière vers l'avant.
const PLATEAU = [
  [542, 26, 128, '#8d9dac', 'flat'],
  [476, 34, 150, '#6b7b8b', 'flat'],
  [506, 38, 116, '#7b8d9b', 'step'],
  [536, 30, 168, '#5f6f7e', 'flat'],
  [646, 40, 104, '#8d9dac', 'mast'],
  [688, 30, 142, '#6b7b8b', 'flat'],
  [714, 44, 126, '#7b8d9b', 'step'],
  [756, 32, 162, '#5f6f7e', 'flat'],
  [784, 38, 182, '#6b7b8b', 'flat'],
  [484, 28, 186, '#5f6f7e', 'flat'],
  [664, 34, 176, '#5f6f7e', 'flat'],
]
const towers = PLATEAU.map(([x, w, top, fill, roof]) => {
  const t = { x, w, top, fill, roof, h: GROUND - top, from: windows.length }
  const body = roof === 'step' ? top + 14 : top
  grid(x, body, w, GROUND - body)
  if (roof === 'step') grid(x + 7, top, w - 14, 14, { mt: 5, mb: 3 })
  t.to = windows.length
  return t
})
// les fenêtres d'un immeuble masquées par un immeuble placé devant lui sont retirées
{
  const front = (w, i) => towers.slice(i + 1).some(f => w.x + w.w > f.x && w.x < f.x + f.w && w.y + w.h > f.top - 3)
  const kept = windows.filter((w, k) => !towers.some((t, i) => k >= t.from && k < t.to && front(w, i)))
  windows.splice(0, windows.length, ...kept)
}

// ------------------------------------------------------------ rives (Cocody)
// Petits immeubles et maisons à gauche et à droite.
const LOW = [
  [8, 40, 200, '#5f6f7e'], [44, 30, 214, '#6b7b8b'], [72, 46, 196, '#7b8d9b'],
  [120, 36, 206, '#6b7b8b'], [152, 40, 192, '#5f6f7e'], [188, 26, 212, '#7b8d9b'],
  [968, 36, 204, '#6b7b8b'], [1002, 30, 186, '#5f6f7e'], [1030, 54, 148, '#7b8d9b'],
  [1086, 34, 200, '#6b7b8b'], [1118, 44, 180, '#5f6f7e'], [1160, 46, 206, '#7b8d9b'],
]
const lows = LOW.map(([x, w, top, fill]) => {
  grid(x, top, w, GROUND - top, { mx: 5, mt: 6 })
  return { x, w, top, fill }
})

// Reflets des fenêtres dans la lagune (traits horizontaux), mêmes pas.
const reflections = []
for (let i = 0; i < 70; i++) {
  const x = 440 + rand() * 400
  reflections.push({ x: r2(x), y: r2(252 + rand() * 40), w: r2(4 + rand() * 9), s: step() })
}
for (let i = 0; i < 40; i++) {
  const left = rand() < 0.45
  const x = left ? 10 + rand() * 270 : 960 + rand() * 230
  reflections.push({ x: r2(x), y: r2(254 + rand() * 38), w: r2(3 + rand() * 7), s: step() })
}
const ripples = Array.from({ length: 26 }, () => ({
  x: r2(rand() * 1180), y: r2(250 + rand() * 46), w: r2(16 + rand() * 40),
}))

// Nuages de nuit (cercles, comme ceux de l'illustration du client)
const NIGHT_CLOUDS = [
  { y: 40, s: 1, c: [[0, 0, 12], [14, -5, 15], [30, 0, 12], [15, 5, 13]] },
  { y: 78, s: 0.8, c: [[0, 0, 11], [13, -6, 14], [27, 0, 11], [14, 4, 12]] },
  { y: 26, s: 0.65, c: [[0, 0, 12], [14, -5, 15], [30, 0, 12], [15, 5, 13]] },
]

// Étoiles
const stars = Array.from({ length: 22 }, () => ({
  x: r2(rand() * 1200), y: r2(6 + rand() * 120), r: rand() < 0.3 ? 1.3 : 0.8,
}))

// ------------------------------------------------------------ Tour F
// D'après les rendus : prisme élancé à grandes facettes, renflé aux deux tiers,
// quatre tronçons séparés par des plis obliques, couronne biseautée, flèche fine.
const TF = { cx: 612, base: GROUND, top: 50, antenna: 6 }
const TF_SECTIONS = [GROUND, 186, 128, 76, TF.top] // plis, de bas en haut
function hw (y) { // demi-largeur à la hauteur y
  if (y >= 128) return 15 + 6 * (GROUND - y) / (GROUND - 128)
  return 21 - 12 * Math.pow((128 - y) / (128 - TF.top), 1.25)
}
// pli oblique : le bord droit est plus haut que le gauche (8 pour la couronne)
const fold = (k, u) => {
  const y = TF_SECTIONS[k]
  if (k === 0) return y
  return y - (k === TF_SECTIONS.length - 1 ? 8 : 4) * (u + 1) / 2
}
const DIVIDERS = [[-0.3, 0.35], [-0.45, 0.2], [-0.2, 0.45], [-0.4, 0.25]]
const TONES = [[0, 1, 2], [1, 0, 2], [0, 2, 1], [1, 0, 2]]
const tfPoint = (u, k) => { const y = fold(k, u); return [r2(TF.cx + u * hw(y)), r2(y)] }
const facets = []
const mullions = []
for (let k = 0; k < TF_SECTIONS.length - 1; k++) {
  const us = [-1, ...DIVIDERS[k], 1]
  for (let j = 0; j < 3; j++) {
    const pts = [tfPoint(us[j], k), tfPoint(us[j + 1], k), tfPoint(us[j + 1], k + 1), tfPoint(us[j], k + 1)]
    facets.push({ pts: pts.map(p => p.join(',')).join(' '), t: TONES[k][j] })
    // montants verticaux de la façade vitrée
    for (let m = 1; m <= 3; m++) {
      const u = us[j] + (us[j + 1] - us[j]) * m / 4
      const a = tfPoint(u, k), b = tfPoint(u, k + 1)
      mullions.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1] })
    }
  }
}
const tfOutline = (() => {
  const L = [], R = []
  for (let y = TF.base; y > TF.top + 8; y -= 4) {
    L.push(`${r2(TF.cx - hw(y))},${y}`)
    R.unshift(`${r2(TF.cx + hw(y))},${y}`)
  }
  const last = TF_SECTIONS.length - 1
  return [...L, tfPoint(-1, last).join(','), tfPoint(1, last).join(','), ...R].join(' ')
})()
// étages éclairés : ils s'allument palier par palier, comme les autres fenêtres
const tfFloors = []
for (let y = 66; y <= 232; y += 7) {
  const w = hw(y) * 0.8
  tfFloors.push({ x: r2(TF.cx - w), y, w: r2(w * 2), s: step() })
}

// ------------------------------------------------------------ pont ADO
// D'après le rendu : pylône en béton clair en Y inversé (mât unique au sommet
// biseauté, deux jambes avec une arche entre elles), grand éventail de haubans
// vers l'est, faisceau serré vers l'ouest, tablier sur piles régulières, lampadaires.
const BR = { cx: 850, top: 60, split: 136, deck: 240, foot: 264, spread: 36 }
const brPylon = (() => {
  const { cx, top, split, foot, spread } = BR
  return `M${cx - 5},${top + 5} L${cx + 5},${top} L${cx + 7},${split} L${cx + spread + 6},${foot} L${cx + spread - 6},${foot} ` +
    `L${cx + 9},${split + 28} Q${cx},${split + 12} ${cx - 9},${split + 28} L${cx - spread + 6},${foot} L${cx - spread - 6},${foot} L${cx - 7},${split} Z`
})()
// comme sur le vrai pont : l'ancrage le plus haut sur le mât va au point le plus
// éloigné du tablier, les suivants de plus en plus près, donc aucun croisement
const haubans = (() => {
  const list = []
  for (let i = 0; i < 10; i++) list.push({ side: 'r', i, x1: BR.cx + 2, y1: BR.top + 10 + i * 4.2, x2: BR.cx + 48 + (9 - i) * 30, y2: BR.deck })
  for (let i = 0; i < 5; i++) list.push({ side: 'l', i, x1: BR.cx - 2, y1: BR.top + 12 + i * 4, x2: BR.cx - 150 - (4 - i) * 12, y2: BR.deck })
  return list
})()
const brPiers = [598, 676, 754, 946, 1024, 1102, 1180].map(x => `${x - 6},246 ${x + 6},246 ${x + 4},251 ${x + 4},266 ${x - 4},266 ${x - 4},251`)
// lampadaires : les lampes s'allument palier par palier, comme les fenêtres
const lamps = []
for (let x = 562; x <= 1190; x += 36) lamps.push({ x, s: step() })

// ------------------------------------------------------------ cathédrale Saint-Paul
// D'après les photos de la façade : tour-personnage (deux jambes écartées, fût,
// bras droit tendu vers l'ouest, grand bloc de tête), un seul câble épais vers la
// pointe de la nef ; nef claire en deux courbes concaves depuis la pointe, doubles
// croix sombres, portes en arc (qui s'allument).
const CA_TOWER = [
  '296,238 309,238 328,142 320,139', // jambe gauche, écartée
  '338,238 350,238 344,142 333,142', // jambe droite
  '320,144 344,144 343,100 323,100', // fût
  '324,101 341,101 346,38 333,33', // bloc de tête
]
const CA_ARM = 'M327,104 L297,102' // bras droit, sans courbure
const CA_PEAK = [381, 126] // pointe de la nef, où arrive le câble
const CA_WALL = `M346,238 Q372,206 ${CA_PEAK.join(',')} Q402,198 478,203 L478,238 Z`
const CA_ROOF = `M${CA_PEAK.join(',')} Q402,198 478,203 L478,197 Q405,190 384,124 Z` // toit bleu visible au-dessus du mur
const CA_CABLE = { x1: 343, y1: 62, x2: CA_PEAK[0] - 1, y2: CA_PEAK[1] + 1 }
const cross = (x, y, h) => `M${x - 2},${y} V${y + h} M${x + 2},${y + 2} V${y + h + 2} M${x - 6},${y + 6} H${x + 6} M${x - 4},${y + 10} H${x + 8}`
const CA_CROSSES = [cross(412, 206, 22), cross(446, 208, 22)]
// portes en arc : elles s'allument palier par palier, comme les fenêtres
const arch = (x, w, h) => `M${x},238 V${238 - h + w / 2} Q${x + w / 2},${238 - h - w / 3} ${x + w},${238 - h + w / 2} V238 Z`
const CA_ARCHES = [arch(370, 11, 30), arch(392, 9, 18), arch(463, 8, 12)]
const naveWindows = [{ x: 372, y: 214, w: 7, h: 24 }, { x: 394, y: 225, w: 5, h: 13 }, { x: 465, y: 230, w: 4, h: 8 }].map(d => ({ ...d, s: step() }))

// ------------------------------------------------------------ palmiers
function palm (x, h, lean, scale = 1) {
  const cx = x + lean, cy = GROUND - h
  const trunk = `M${x},${GROUND} Q${r2(x + lean * 0.2)},${r2(GROUND - h * 0.55)} ${cx},${cy}`
  const fr = [[-24, 8], [-18, -6], [-4, -12], [12, -9], [23, 4], [16, 14], [-12, 15]]
  const fronds = fr.map(([dx, dy], i) => {
    const ex = cx + dx * scale, ey = cy + dy * scale
    const mx = cx + dx * scale * 0.5, my = cy + dy * scale * 0.5 - 7 * scale
    const nx = cx + dx * scale * 0.55, ny = cy + dy * scale * 0.55 - 1 * scale
    return { d: `M${cx},${cy} Q${r2(mx)},${r2(my)} ${r2(ex)},${r2(ey)} Q${r2(nx)},${r2(ny)} ${cx},${cy} Z`, k: i % 2 }
  })
  return { trunk, fronds, cx, cy }
}
const palms = [
  palm(30, 52, 6), palm(112, 66, -8, 1.1), palm(200, 44, 5, 0.9),
  palm(476, 42, -5, 0.85), palm(948, 48, 6), palm(1074, 60, -7, 1.05), palm(1188, 50, -6),
]

// ------------------------------------------------------------ câble électrique
// Prolonge la ligne du pylône de la centrale (au-dessus) et descend au poste.
const CABLE = 'M-12,16 Q110,102 210,116 L254,116 Q274,140 280,208'
// ------------------------------------------------------------ vie de la ville
// Voitures sur le tablier du pont (sens est : y 242,6 ; sens ouest : y 245,4)
const CARS = Array.from({ length: 12 }, (_, i) => ({ dir: i % 2 ? -1 : 1, y: i % 2 ? 244.4 : 241.6 }))
// Pinasses sur la lagune
const BOATS = [{ y: 266, s: 1 }, { y: 286, s: 0.8 }]

// ------------------------------------------------------------ animations (GSAP)
const root = ref(null)
const fwLayer = ref(null)
const { gsap, reduced, run, loop } = useGsap(root)
const { play } = useSound()

const OFF = '#3a4b63', ON = '#ffd76a'
const REFL_OFF = '#2a4a72', REFL_ON = '#c9a24e'
const FCT_OFF = ['#a9b9c8', '#8a9db0', '#6d8297'], FCT_ON = ['#e6f3fb', '#b9d9f0', '#8fbadf']
const SUB = [280, 214] // poste électrique : point de départ de la vague
const q = sel => [...(root.value?.querySelectorAll(sel) || [])]
const between = (a, b) => a + Math.random() * (b - a)
const skyAt = n => SKY_0.map((c, i) => mix(c, SKY_5[i], n / 5))

// délai d'allumage d'une fenêtre : distance au poste (la vague part du câble)
function waveDelay (el) {
  const x = +(el.getAttribute('x') ?? el.getAttribute('cx')), y = +(el.getAttribute('y') ?? el.getAttribute('cy'))
  return Math.hypot(x - SUB[0], y - SUB[1]) / 950 * 1.9 + Math.random() * 0.18
}

// Mise sous tension : impulsion sur le câble, poste, vague de fenêtres, reflets, ciel
function powerUp (from, to) {
  return run(() => {
    const tl = gsap.timeline()
    const glow = root.value.querySelector('.cable-glow')
    const spark = root.value.querySelector('.spark')
    const path = root.value.querySelector('.cable')
    tl.set([glow, spark], { opacity: 1 })
      .fromTo(glow, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'power1.inOut' }, 0)
      .to(spark, { duration: 1.1, ease: 'power1.inOut', motionPath: { path, align: path, alignOrigin: [0.5, 0.5] } }, 0)
      .to(spark, { opacity: 0, scale: 2.4, transformOrigin: '50% 50%', duration: 0.35 }, 1.1)
      .to(glow, { opacity: 0, duration: 0.8 }, 1.2)
      .fromTo('.sub-light', { fill: '#ffffff' }, { fill: '#6aa86a', duration: 0.18, repeat: 3, yoyo: true, ease: 'none' }, 1.05)
      .fromTo('.sky', { fill: (i) => skyAt(from)[i] }, { fill: (i) => skyAt(to)[i], duration: 1.6, ease: 'sine.inOut' }, 1.0)
      // la couleur revient dans la ville en même temps que la vague de lumières
      .fromTo('.f-sat', { attr: { values: satAt(from) } }, { attr: { values: satAt(to) }, duration: 2.6, ease: 'sine.inOut' }, 1.15)
      .fromTo('.f-bri', { attr: { slope: briAt(from) } }, { attr: { slope: briAt(to) }, duration: 2.6, ease: 'sine.inOut' }, 1.15)
      .call(() => play('city'), null, 1.15)

    for (let step = from + 1; step <= to; step++) {
      const lag = 1.15 + (step - from - 1) * 0.35
      for (const el of q(`.win[data-step="${step}"]`)) {
        const d = lag + waveDelay(el)
        tl.fromTo(el, { fill: OFF, opacity: 1 }, { fill: ON, duration: 0.16, ease: 'none', immediateRender: true }, d)
          .to(el, { keyframes: [{ opacity: 0.35, duration: 0.05 }, { opacity: 1, duration: 0.07 }, { opacity: 0.55, duration: 0.05 }, { opacity: 1, duration: 0.14 }] }, d + 0.16)
      }
      for (const el of q(`.refl[data-step="${step}"]`)) {
        tl.fromTo(el, { stroke: REFL_OFF }, { stroke: REFL_ON, duration: 0.5, immediateRender: true }, lag + 0.4 + waveDelay(el))
      }
    }
    tl.set('.win, .refl', { clearProps: 'fill,stroke,opacity' })
    if (to >= 5) tl.add(finale(), '-=0.6')
    return tl
  })
}

// Final 5/5 : Tour F de la base à la pointe, haubans aux couleurs du drapeau,
// vitraux de la cathédrale, feux d'artifice
function finale () {
  const tl = gsap.timeline()
  const tone = el => (el.classList.contains('t0') ? 0 : el.classList.contains('t1') ? 1 : 2)
  tl.fromTo('.fct', { fill: (i, el) => FCT_OFF[tone(el)], stroke: '#1f2832' },
    { fill: (i, el) => FCT_ON[tone(el)], stroke: '#fff6d9', duration: 0.3, stagger: 0.012, immediateRender: true }, 0)
    .fromTo('.beacon', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'back.out(4)' }, '>-0.1')
    .fromTo('.hauban', { stroke: '#8d9dac' }, { stroke: (i, el) => (el.classList.contains('left') ? '#ff9a3c' : '#2fbf71'), duration: 0.3, stagger: 0.09, immediateRender: true }, 0.5)
    .fromTo('.pylon-a', { fill: '#d5dbe1' }, { fill: '#f2a25a', duration: 0.9 }, 1.4)
    .fromTo('.cathedral-windows .win', { fill: ON }, { fill: '#fff1c4', duration: 0.4, stagger: 0.08, repeat: 1, yoyo: true }, 1.2)
    .set('.fct, .hauban, .pylon-a, .beacon', { clearProps: 'fill,stroke,scale,transform' })
    .call(startFinaleLoops)
  // salves de feux d'artifice pendant une douzaine de secondes
  const shots = [[520, 70, 0], [760, 48, 1], [980, 78, 2], [650, 96, 3], [430, 58, 0], [880, 40, 2], [700, 66, 1], [560, 90, 3], [1040, 60, 0], [800, 84, 2]]
  shots.forEach(([x, y, c], i) => tl.call(() => burst(x, y, c), null, 1.4 + i * 1.15 + Math.random() * 0.3))
  return tl
}

const FW_COLORS = ['#ed7f06', '#ffffff', '#0d9330', '#ffd76a']
const NS = 'http://www.w3.org/2000/svg'
// Une fusée : traînée qui monte (DrawSVG), puis gerbe d'étincelles qui retombe
function burst (x, y, c) {
  if (!fwLayer.value || reduced.value) return
  run(() => {
    const color = FW_COLORS[c % FW_COLORS.length]
    const trail = document.createElementNS(NS, 'line')
    Object.entries({ x1: x, y1: 250, x2: x, y2: y, stroke: color, 'stroke-width': 1.6, 'stroke-linecap': 'round' }).forEach(([k, v]) => trail.setAttribute(k, v))
    fwLayer.value.appendChild(trail)
    const sparks = Array.from({ length: 22 }, (_, i) => {
      const s = document.createElementNS(NS, 'circle')
      Object.entries({ cx: x, cy: y, r: i % 3 ? 1.4 : 2, fill: i % 4 ? color : '#ffffff', opacity: 0 }).forEach(([k, v]) => s.setAttribute(k, v))
      fwLayer.value.appendChild(s)
      return s
    })
    const tl = gsap.timeline({ onComplete: () => { trail.remove(); sparks.forEach(s => s.remove()) } })
    tl.fromTo(trail, { drawSVG: '0% 8%' }, { drawSVG: '92% 100%', duration: 0.65, ease: 'power2.out' })
      .to(trail, { opacity: 0, duration: 0.2 })
      .call(() => play('burst'), null, 0.62)
      .set(sparks, { opacity: 1 }, 0.62)
    sparks.forEach((s, i) => {
      const a = (i / sparks.length) * Math.PI * 2 + Math.random() * 0.25
      const r = between(22, 40)
      tl.to(s, { x: Math.cos(a) * r, duration: 1.1, ease: 'power3.out' }, 0.62)
        .to(s, { y: Math.sin(a) * r, duration: 0.7, ease: 'power3.out' }, 0.62)
        .to(s, { y: `+=${between(14, 22)}`, opacity: 0, duration: 0.9, ease: 'power1.in' }, 1.25)
    })
  })
}

// Boucles d'ambiance (pause automatique hors écran) ---------------------------
let pulseLoop = null
let finaleLoops = false
function startPulses () {
  if (pulseLoop || reduced.value || lvl.value < 1) return
  pulseLoop = run(() => {
    const path = root.value.querySelector('.cable')
    const tl = gsap.timeline({ repeat: -1 })
    q('.pdot').forEach((dot, i) => {
      tl.fromTo(dot, { opacity: 1 }, { duration: 3, ease: 'none', motionPath: { path, align: path, alignOrigin: [0.5, 0.5] } }, i * 1)
        .to(dot, { opacity: 0, duration: 0.2 }, i * 1 + 2.8)
    })
    return loop(tl)
  })
}
function updatePulseSpeed () { pulseLoop?.timeScale(1 + lvl.value * 0.25) }

function updateTraffic () {
  // plus de centrales, plus de circulation : 2 voitures au crépuscule, 12 à 5/5
  const n = 2 + lvl.value * 2
  q('.car').forEach((car, i) => gsap.to(car, { opacity: i < n ? 1 : 0, duration: 0.8 }))
}

function startAmbient () {
  if (reduced.value) return
  run(() => {
    // circulation sur le pont ADO
    q('.car').forEach((car, i) => {
      const east = CARS[i].dir > 0
      const dur = between(7, 11)
      loop(gsap.fromTo(car, { x: east ? 548 : 1206 }, { x: east ? 1206 : 548, duration: dur, ease: 'none', repeat: -1, delay: -Math.random() * dur }))
    })
    // pinasses : traversée lente et léger tangage
    q('.boat').forEach((boat, i) => {
      const dur = i ? 64 : 48
      loop(gsap.fromTo(boat, { x: -70 }, { x: 1270, duration: dur, ease: 'none', repeat: -1, delay: -dur * (i ? 0.3 : 0.65) }))
      loop(gsap.to(boat.querySelector('.hull'), { y: 1.2, rotation: 1.5, svgOrigin: '0 0', duration: between(1.6, 2.2), yoyo: true, repeat: -1, ease: 'sine.inOut' }))
    })
    // nuages de nuit qui traversent lentement le ciel, d'est en ouest
    q('.night-cloud').forEach((cl, i) => {
      const dur = between(80, 120)
      loop(gsap.fromTo(cl, { x: 1260 }, { x: -90, duration: dur, ease: 'none', repeat: -1, delay: -dur * (0.2 + i * 0.3) }))
    })
    // rides de l'eau
    q('.ripples line').forEach((l) => {
      loop(gsap.to(l, { x: between(-10, 10), opacity: between(0.35, 1), duration: between(2.2, 4.5), yoyo: true, repeat: -1, ease: 'sine.inOut' }))
    })
    // un avion traverse le ciel de temps en temps
    const plane = root.value.querySelector('.plane')
    loop(gsap.timeline({ repeat: -1, repeatDelay: 16, delay: 4 })
      .fromTo(plane, { x: 1240, opacity: 1 }, { x: -60, duration: 26, ease: 'none' }))
    loop(gsap.to('.plane .strobe', { opacity: 0.1, duration: 0.5, repeat: -1, yoyo: true, ease: 'steps(1)' }))
    // des habitants allument et éteignent leurs lumières
    loop(gsap.timeline({ repeat: -1, repeatDelay: 0.9 }).call(() => {
      const lit = q('.win').filter(w => +w.dataset.step <= lvl.value)
      for (let k = 0; k < 2 && lit.length; k++) {
        const w = lit[Math.floor(Math.random() * lit.length)]
        gsap.to(w, { opacity: 0.25, duration: 0.2, yoyo: true, repeat: 1, repeatDelay: between(0.4, 1.6) })
      }
    }))
  })
  updateTraffic()
  startPulses()
  if (lvl.value >= 5) startFinaleLoops()
}

// À 5/5 : balise de la Tour F, lumière qui court le long des haubans, feux d'artifice réguliers
function startFinaleLoops () {
  if (finaleLoops || reduced.value) return
  finaleLoops = true
  run(() => {
    loop(gsap.to('.beacon', { opacity: 0.25, duration: 0.8, repeat: -1, yoyo: true, ease: 'steps(1)' }))
    loop(gsap.to('.hauban', { opacity: 0.45, duration: 0.35, ease: 'sine.inOut', stagger: { each: 0.07, repeat: -1, yoyo: true } }))
    if (props.celebrate) {
      loop(gsap.timeline({ repeat: -1, repeatDelay: 5, delay: 14 })
        .call(() => burst(between(440, 1040), between(40, 96), Math.floor(Math.random() * 4)))
        .call(() => burst(between(440, 1040), between(40, 96), Math.floor(Math.random() * 4)), null, 0.7))
    }
  })
}

// Les changements de palier pendant le chargement (restauration de la partie)
// s'appliquent sans animation ; ensuite, chaque palier gagné joue la mise sous tension.
let ready = false
onMounted(() => nextTick(() => {
  startAmbient()
  setTimeout(() => { ready = true }, 900)
}))
watch(lvl, (n, o) => {
  updateTraffic()
  if (n > o && ready && !reduced.value) {
    startPulses()
    updatePulseSpeed()
    powerUp(o, n)
  } else if (n > o) {
    startPulses()
    updatePulseSpeed()
    if (n >= 5) startFinaleLoops()
  } else if (n < o) {
    finaleLoops = false
  }
}, { flush: 'post' })
defineExpose({ powerUp, burst })
</script>

<template>
  <div ref="root" class="abidjan" :class="rootClass">
    <svg
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMax slice"
      role="img"
      :aria-label="ariaLabel"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- la ville éteinte est en gris ; elle reprend ses couleurs palier par palier.
           Les lumières (fenêtres, reflets, phares, énergie) restent hors du filtre. -->
      <defs>
        <filter :id="fid" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
          <feColorMatrix class="f-sat" type="saturate" :values="sat" />
          <feComponentTransfer>
            <feFuncR class="f-bri" type="linear" :slope="bri" />
            <feFuncG class="f-bri" type="linear" :slope="bri" />
            <feFuncB class="f-bri" type="linear" :slope="bri" />
          </feComponentTransfer>
        </filter>
      </defs>

      <g :filter="furl">
        <!-- ciel en trois bandes -->
        <rect class="sky" x="0" y="0" width="1200" height="110" :style="{ fill: sky[0] }" />
        <rect class="sky" x="0" y="110" width="1200" height="74" :style="{ fill: sky[1] }" />
        <rect class="sky" x="0" y="184" width="1200" height="60" :style="{ fill: sky[2] }" />
        <!-- silhouettes lointaines -->
        <g class="far">
          <rect v-for="(b, i) in far" :key="'f' + i" :x="b.x" :y="b.y" :width="b.w" :height="b.h + 2" rx="1" />
        </g>
      </g>
      <g class="stars">
        <circle v-for="(s, i) in stars" :key="'st' + i" :cx="s.x" :cy="s.y" :r="s.r" />
      </g>
      <g :filter="furl" aria-hidden="true">
        <g v-for="(n, i) in NIGHT_CLOUDS" :key="'nc' + i" class="night-cloud" :transform="`translate(${200 + i * 380} ${n.y})`">
          <g :transform="`scale(${n.s})`">
            <circle v-for="(c, k) in n.c" :key="k" :cx="c[0]" :cy="c[1]" :r="c[2]" />
          </g>
        </g>
      </g>

      <!-- câble électrique et pylône -->
      <g class="line" :filter="furl">
        <path class="pylon" d="M216,238 L232,104 L248,238" fill="none" stroke-width="2.5" stroke-linejoin="round" />
        <line class="pylon" x1="210" y1="116" x2="254" y2="116" stroke-width="2.5" stroke-linecap="round" />
        <line class="pylon" x1="219" y1="132" x2="245" y2="132" stroke-width="2" stroke-linecap="round" />
        <line class="pylon" x1="223" y1="168" x2="241" y2="168" stroke-width="2" />
        <line class="pylon" x1="219" y1="204" x2="245" y2="204" stroke-width="2" />
        <path class="cable" :d="CABLE" fill="none" stroke-width="1.6" />
      </g>
      <g class="energy">
        <path class="cable-glow" :d="CABLE" fill="none" stroke-width="3.5" stroke-linecap="round" />
        <circle v-for="i in 3" :key="'pd' + i" class="pdot" cx="0" cy="0" r="2.4" />
        <circle class="spark" cx="0" cy="0" r="4.5" />
      </g>

      <!-- rives : petits immeubles -->
      <g :filter="furl">
        <rect v-for="(b, i) in lows" :key="'lw' + i" :x="b.x" :y="b.top" :width="b.w" :height="GROUND - b.top + 2" rx="1.5" :fill="b.fill" />
      </g>

      <!-- avion (feux clignotants) -->
      <g class="plane" aria-hidden="true">
        <line x1="-7" y1="34" x2="7" y2="34" stroke-width="1.8" stroke-linecap="round" class="plane-body" />
        <line x1="-1" y1="31" x2="2" y2="37" stroke-width="1.4" stroke-linecap="round" class="plane-body" />
        <circle cx="-7" cy="34" r="1.3" class="nav-red" />
        <circle cx="7" cy="34" r="1.3" class="strobe" />
      </g>

      <!-- feux d'artifice (5/5), créés à la volée -->
      <g ref="fwLayer" class="fw-layer" aria-hidden="true" />

      <!-- cathédrale Saint-Paul -->
      <g class="cathedral" :filter="furl">
        <path class="roof" :d="CA_ROOF" />
        <path class="nave" :d="CA_WALL" />
        <path v-for="(a, i) in CA_ARCHES" :key="'ar' + i" class="arch" :d="a" />
        <path v-for="(c, i) in CA_CROSSES" :key="'cr' + i" class="cross" :d="c" fill="none" stroke-width="1.6" stroke-linecap="square" />
        <!-- un seul câble épais, du haut de la tour à la pointe de la nef -->
        <line class="ca-cable" :x1="CA_CABLE.x1" :y1="CA_CABLE.y1" :x2="CA_CABLE.x2" :y2="CA_CABLE.y2" stroke-width="2.6" stroke-linecap="round" />
        <!-- tour en forme de personnage : deux jambes écartées, fût, bras, tête -->
        <polygon v-for="(pts, i) in CA_TOWER" :key="'ct' + i" class="mast" :points="pts" />
        <path class="mast-stroke" :d="CA_ARM" fill="none" stroke-width="6.5" stroke-linecap="round" />
      </g>

      <!-- portes de la cathédrale (lumières, hors du filtre gris) -->
      <g class="cathedral-windows">
        <rect
          v-for="(w, i) in naveWindows" :key="'nw' + i" class="win"
          :data-step="w.s" :x="w.x" :y="w.y" :width="w.w" :height="w.h" rx="1.5"
        />
      </g>

      <!-- Plateau -->
      <g :filter="furl">
        <g v-for="(t, i) in towers" :key="'tw' + i">
          <rect v-if="t.roof === 'step'" :x="t.x" :y="t.top + 14" :width="t.w" :height="GROUND - t.top - 12" rx="1.5" :fill="t.fill" />
          <rect v-if="t.roof === 'step'" :x="t.x + 7" :y="t.top" :width="t.w - 14" height="16" rx="1.5" :fill="t.fill" />
          <rect v-else :x="t.x" :y="t.top" :width="t.w" :height="GROUND - t.top + 2" rx="1.5" :fill="t.fill" />
          <rect v-if="t.roof !== 'step'" :x="t.x - 1.5" :y="t.top - 3" :width="t.w + 3" height="4" rx="1" class="cap" />
          <template v-if="t.roof === 'mast'">
            <line :x1="t.x + t.w / 2" :y1="t.top - 3" :x2="t.x + t.w / 2" :y2="t.top - 26" class="antenna" stroke-width="1.5" />
          </template>
        </g>
      </g>

      <!-- fenêtres (toutes, générées) -->
      <g>
        <rect
          v-for="(w, i) in windows" :key="'w' + i"
          class="win" :class="{ tw: w.tw }" :data-step="w.s"
          :x="w.x" :y="w.y" :width="w.w" :height="w.h" rx="0.6"
        />
      </g>

      <!-- Tour F -->
      <g class="tour-f" :filter="furl">
        <rect x="590" y="226" width="44" height="14" rx="1.5" class="podium" />
        <polygon :points="tfOutline" class="tf-body" />
        <polygon
          v-for="(f, i) in facets" :key="'fa' + i"
          :points="f.pts" :class="'fct t' + f.t"
        />
        <line
          v-for="(m, i) in mullions" :key="'mu' + i" class="tf-mull"
          :x1="m.x1" :y1="m.y1" :x2="m.x2" :y2="m.y2" stroke-width=".5"
        />
        <line :x1="TF.cx + 2" :y1="TF.top + 2" :x2="TF.cx + 2" :y2="TF.antenna + 2" class="tf-antenna" stroke-width="1.3" />
        <circle class="beacon" :cx="TF.cx + 2" :cy="TF.antenna" r="2.4" />
      </g>
      <!-- étages de la Tour F (lumières, hors du filtre gris) -->
      <g class="tf-floors">
        <rect v-for="(f, i) in tfFloors" :key="'tff' + i" class="win tfw" :data-step="f.s" :x="f.x" :y="f.y" :width="f.w" height="1.4" rx=".7" />
      </g>

      <!-- quai et lagune Ébrié -->
      <g :filter="furl">
        <rect x="0" y="237" width="1200" height="6" class="quay" />
        <rect x="0" y="243" width="1200" height="57" class="lagoon" />
        <g class="ripples">
          <line v-for="(r, i) in ripples" :key="'rp' + i" :x1="r.x" :y1="r.y" :x2="r.x + r.w" :y2="r.y" stroke-width="1.4" stroke-linecap="round" />
        </g>
      </g>
      <g>
        <line
          v-for="(r, i) in reflections" :key="'rf' + i" class="refl" :data-step="r.s"
          :x1="r.x" :y1="r.y" :x2="r.x + r.w" :y2="r.y" stroke-width="1.6" stroke-linecap="round"
        />
      </g>

      <!-- pinasses -->
      <g v-for="(b, i) in BOATS" :key="'bt' + i" class="boat" :transform="`translate(-70 ${b.y})`" :filter="furl" aria-hidden="true">
        <g :transform="`scale(${b.s})`">
          <line x1="-30" y1="3" x2="-19" y2="3" class="wake" stroke-width="1.2" stroke-linecap="round" />
          <line x1="-26" y1="6" x2="-17" y2="6" class="wake" stroke-width="1" stroke-linecap="round" />
          <g class="hull">
            <polygon points="-17,0 17,0 13,5 -13,5" class="hull-body" />
            <rect x="-17" y="-1.4" width="34" height="1.8" rx=".9" class="hull-band" />
            <rect x="-8" y="-7" width="11" height="6" rx="1" class="cabin" />
            <circle cx="10" cy="-3" r="1.3" class="boat-light" />
          </g>
        </g>
      </g>

      <!-- poste électrique -->
      <g class="substation" :filter="furl">
        <rect x="268" y="208" width="24" height="30" rx="2" class="sub-body" />
        <rect x="272" y="214" width="16" height="3" rx="1" class="sub-light" />
        <rect x="272" y="221" width="16" height="2" rx="1" class="sub-line" />
        <rect x="272" y="227" width="16" height="2" rx="1" class="sub-line" />
      </g>

      <!-- palmiers -->
      <g v-for="(p, i) in palms" :key="'pm' + i" class="palm" :filter="furl">
        <path :d="p.trunk" class="trunk" fill="none" stroke-width="3" stroke-linecap="round" />
        <path v-for="(f, j) in p.fronds" :key="j" :d="f.d" :class="'frond k' + f.k" />
      </g>

      <!-- pont Alassane-Ouattara -->
      <g class="bridge" :filter="furl">
        <polygon v-for="(pts, i) in brPiers" :key="'pi' + i" class="pier" :points="pts" />
        <line
          v-for="(h, i) in haubans" :key="'hb' + i"
          class="hauban" :class="h.side === 'l' ? 'left' : 'right'"
          :x1="h.x1" :y1="h.y1" :x2="h.x2" :y2="h.y2" stroke-width="1.1"
        />
        <!-- pylône en Y inversé, arche entre les jambes -->
        <path class="pylon-a" :d="brPylon" />
        <rect x="548" y="240" width="652" height="6" rx="1" class="deck" />
        <rect x="548" y="245.5" width="652" height="2.5" class="deck-under" />
        <g class="lamp-poles">
          <path v-for="(l, i) in lamps" :key="'lp' + i" :d="`M${l.x},240 V226 h3`" fill="none" stroke-width=".9" stroke-linecap="round" />
        </g>
      </g>
      <!-- lampes du pont (lumières, hors du filtre gris) -->
      <g class="lamps">
        <circle v-for="(l, i) in lamps" :key="'lm' + i" class="win lamp" :data-step="l.s" :cx="l.x + 3" cy="226.6" r="1.5" />
      </g>
      <g class="traffic">
        <g v-for="(c, i) in CARS" :key="'car' + i" class="car" :transform="`translate(${c.dir > 0 ? 548 : 1206} 0)`">
          <rect x="-4" :y="c.y - 1.2" width="8" height="2.4" rx="1" class="car-body" />
          <circle :cx="c.dir > 0 ? 4 : -4" :cy="c.y" r="0.95" class="headlight" />
          <circle :cx="c.dir > 0 ? -4 : 4" :cy="c.y" r="0.8" class="taillight" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.abidjan {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 1;
  min-height: 150px;
  overflow: hidden;
  background: #26456f;
}
.abidjan svg { display: block; width: 100%; height: 100%; }

/* ------------------------------------------------ ciel, décor */
.sky {}
.stars circle { fill: #d8eef6; opacity: .7; transition: opacity .8s ease; }
.night-cloud circle { fill: #8fa3b8; opacity: .55; }
.lv-5 .stars circle { opacity: .35; }
.far rect { fill: #2a3d58; transition: fill .8s ease; }
.lv-5 .far rect { fill: #2c4669; }
.cap { fill: #4d5c6b; }
.antenna, .tf-antenna { stroke: #c9d3dc; }
.quay { fill: #4a5a6a; }
.lagoon { fill: #1f3d63; transition: fill .8s ease; }
.lv-5 .lagoon { fill: #224670; }
.ripples line { stroke: #35587f; }

/* ------------------------------------------------ fenêtres */
.win { fill: #3a4b63; }
.on-1 .win[data-step="1"],
.on-2 .win[data-step="2"],
.on-3 .win[data-step="3"],
.on-4 .win[data-step="4"],
.on-5 .win[data-step="5"] { fill: #ffd76a; }

.refl { stroke: #2a4a72; }
.on-1 .refl[data-step="1"],
.on-2 .refl[data-step="2"],
.on-3 .refl[data-step="3"],
.on-4 .refl[data-step="4"],
.on-5 .refl[data-step="5"] { stroke: #c9a24e; }

/* ------------------------------------------------ cathédrale */
.nave { fill: #e6e0d4; }
.cross { stroke: #4d5c6b; }
.arch { fill: #3a4b63; }
.roof { fill: #2a7eba; }
.mast { fill: #f3f7fa; }
.mast-stroke { stroke: #f3f7fa; }
.ca-cable { stroke: #c9d3dc; }

/* ------------------------------------------------ Tour F */
.podium { fill: #4d5c6b; }
.tf-body { fill: #5f6f7e; }
.fct { stroke: #1f2832; stroke-width: .45; stroke-linejoin: round; }
.fct.t0 { fill: #a9b9c8; }
.fct.t1 { fill: #8a9db0; }
.fct.t2 { fill: #6d8297; }
.tf-mull { stroke: #c9d3dc; opacity: .45; }
.lv-5 .fct { stroke: #fff6d9; }
.lv-5 .fct.t0 { fill: #e6f3fb; }
.lv-5 .fct.t1 { fill: #b9d9f0; }
.lv-5 .fct.t2 { fill: #8fbadf; }
.beacon { fill: #7a3a3a; transition: fill .8s ease; }
.powered .beacon { fill: #c8473d; }
.lv-5 .beacon { fill: #ff4a3d; }

/* ------------------------------------------------ pont ADO */
.pylon-a { fill: #d5dbe1; }
.lv-5 .pylon-a { fill: #f2a25a; } /* mise en lumière orange du final */
.lamp-poles path { stroke: #8d9dac; }
.deck { fill: #c9d3dc; }
.deck-under { fill: #5f6f7e; }
.pier { fill: #5f6f7e; }

.hauban { stroke: #8d9dac; }
.lv-5 .hauban.left { stroke: #ff9a3c; }
.lv-5 .hauban.right { stroke: #2fbf71; }

/* ------------------------------------------------ câble, poste */
.pylon { stroke: #8d9dac; }
.cable { stroke: #7b8d9b; transition: stroke .8s ease; }
.powered .cable { stroke: #c9d3dc; }
.cable-glow { stroke: #ffd76a; opacity: 0; }
.pdot { fill: #ffd76a; opacity: 0; }
.spark { fill: #fff3b0; opacity: 0; }
.sub-body { fill: #7b8d9b; }
.sub-line { fill: #5f6f7e; }
.sub-light { fill: #3a4b63; transition: fill .8s ease; }
.powered .sub-light { fill: #6aa86a; }

/* ------------------------------------------------ palmiers */
.trunk { stroke: #6b4f2a; }
.frond.k0 { fill: #4e8a58; }
.frond.k1 { fill: #6aa86a; }

/* ------------------------------------------------ vie de la ville (animée par GSAP) */
.car { opacity: 0; }
.car-body { fill: #8d9dac; }
.headlight { fill: #fff8de; }
.taillight { fill: #ff5a4a; }
.hull-body { fill: #e8792b; }
.hull-band { fill: #f3f7fa; }
.cabin { fill: #c9d3dc; }
.boat-light { fill: #ffd76a; }
.wake { stroke: #5d84ad; }
.plane { opacity: 0; }
.plane-body { stroke: #c9d3dc; }
.nav-red { fill: #ff4a3d; }
.strobe { fill: #ffffff; }

@media (prefers-reduced-motion: reduce) {
  .abidjan *, .abidjan *::before, .abidjan *::after { animation: none !important; }
}
</style>
