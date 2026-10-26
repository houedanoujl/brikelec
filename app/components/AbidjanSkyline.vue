<script setup>
// Bandeau « Abidjan alimentée par la centrale du futur ».
// Même main que les schémas du client : aplats, formes simples, palette
// des bleus gris, ciel, verts et marine. Aucun dégradé.
//
// level (0 à 5) : centrales allumées. Chaque fenêtre porte data-step (1 à 5) ;
// elle s'allume quand level >= step. À 5, Tour F et haubans du pont s'allument.
// celebrate : animations douces (impulsions, scintillement, haubans).

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
  [448, 30, 186, '#5f6f7e', 'flat'],
  [664, 34, 176, '#5f6f7e', 'flat'],
]
const towers = PLATEAU.map(([x, w, top, fill, roof]) => {
  const t = { x, w, top, fill, roof, h: GROUND - top }
  const body = roof === 'step' ? top + 14 : top
  grid(x, body, w, GROUND - body)
  if (roof === 'step') grid(x + 7, top, w - 14, 14, { mt: 5, mb: 3 })
  return t
})

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

// Étoiles
const stars = Array.from({ length: 22 }, () => ({
  x: r2(rand() * 1200), y: r2(6 + rand() * 120), r: rand() < 0.3 ? 1.3 : 0.8,
}))

// ------------------------------------------------------------ Tour F
// Fût élancé, renflé au milieu, effilé vers une pointe ; façade facettée.
const TF = { cx: 612, base: GROUND, top: 56, antenna: 4 }
function hw (y) {
  if (y >= 166) { // de la base au renflement
    const t = (TF.base - y) / (TF.base - 166)
    return 18 + 6.5 * Math.sin(t * Math.PI / 2)
  }
  return 24.5 * Math.pow((y - TF.top) / (166 - TF.top), 0.7)
}
const tfOutline = (() => {
  const L = [], R = []
  for (let y = TF.base; y >= TF.top; y -= 4) {
    L.push(`${r2(TF.cx - hw(y))},${y}`)
    R.unshift(`${r2(TF.cx + hw(y))},${y}`)
  }
  return [...L, `${TF.cx},${TF.top - 2}`, ...R].join(' ')
})()
const facets = (() => {
  const out = []
  const ys = []
  for (let y = TF.base; y > TF.top + 8; y -= 12) ys.push(y)
  const uRow = (j, y) => {
    const dense = y > 120
    if (j % 2 === 0) return dense ? [-1, -0.5, 0, 0.5, 1] : [-1, 0, 1]
    return dense ? [-1, -0.75, -0.25, 0.25, 0.75, 1] : [-1, -0.5, 0.5, 1]
  }
  const P = (u, y) => [TF.cx + u * hw(y), y]
  const tone = (u, j) => {
    // côté gauche éclairé, droit dans l'ombre, avec un peu de variété
    let k = u < -0.3 ? 0 : u > 0.3 ? 2 : 1
    if (rand() < 0.22) k = (k + 1 + (j % 2)) % 3
    return k
  }
  for (let j = 0; j < ys.length - 1; j++) {
    const ya = ys[j], yb = ys[j + 1]
    const a = uRow(j, ya), b = uRow(j + 1, yb)
    let i = 0, k = 0
    while (i < a.length - 1 || k < b.length - 1) {
      let tri, uc
      if (k >= b.length - 1 || (i < a.length - 1 && a[i + 1] <= b[k + 1])) {
        tri = [P(a[i], ya), P(a[i + 1], ya), P(b[k], yb)]; uc = (a[i] + a[i + 1] + b[k]) / 3; i++
      } else {
        tri = [P(a[i], ya), P(b[k], yb), P(b[k + 1], yb)]; uc = (a[i] + b[k] + b[k + 1]) / 3; k++
      }
      out.push({ pts: tri.map(p => p.map(r2).join(',')).join(' '), t: tone(uc, j) })
    }
  }
  // dernière rangée jusqu'à la pointe
  const yl = ys[ys.length - 1]
  const ul = uRow(ys.length - 1, yl)
  for (let i = 0; i < ul.length - 1; i++) {
    const tri = [P(ul[i], yl), P(ul[i + 1], yl), [TF.cx, TF.top - 2]]
    out.push({ pts: tri.map(p => p.map(r2).join(',')).join(' '), t: ul[i] < -0.2 ? 0 : ul[i] > 0.2 ? 2 : 1 })
  }
  return out
})()

// ------------------------------------------------------------ pont ADO
// Pylône en A orange, haubans en éventail, tablier fin.
const BR = { cx: 850, apex: 92, deck: 244, foot: 266, legHalf: 26 }
const haubans = (() => {
  const list = []
  for (let i = 0; i < 7; i++) {
    const ay = BR.apex + 8 + i * 2.6
    const ax = BR.legHalf * (ay - BR.apex) / (BR.foot - BR.apex)
    const d = 38 + i * 24
    list.push({ side: 'l', i, x1: r2(BR.cx - ax), y1: r2(ay), x2: BR.cx - d - ax, y2: BR.deck })
    list.push({ side: 'r', i, x1: r2(BR.cx + ax), y1: r2(ay), x2: BR.cx + d + ax, y2: BR.deck })
  }
  return list
})()
const legPts = s => {
  const xTop = BR.cx + s * 1.5, xBot = BR.cx + s * BR.legHalf
  return `${xTop - 2.2},${BR.apex} ${xTop + 2.2},${BR.apex} ${xBot + 4},${BR.foot} ${xBot - 4},${BR.foot}`
}

// ------------------------------------------------------------ cathédrale Saint-Paul
// Mât blanc incliné vers l'arrière (gauche), croix, câbles vers la nef en pente.
const CA = { bx: 352, top: [318, 62] }
const naveRidge = (x) => 150 + (x - 364) * (60 / 110) // de (364,150) à (474,210)
const caCables = [384, 404, 424, 444, 464].map((x, i) => ({
  x1: r2(CA.top[0] + 2 + i * 0.8), y1: r2(CA.top[1] + 14 + i * 3.2), x2: x, y2: r2(naveRidge(x)),
}))
const naveWindows = [374, 390, 406, 422, 438, 454].map(x => ({ x, y: r2(naveRidge(x) + 12), h: r2(GROUND - naveRidge(x) - 20), s: step() }))

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
  palm(300, 46, -6, 0.9), palm(948, 48, 6), palm(1074, 60, -7, 1.05), palm(1188, 50, -6),
]

// ------------------------------------------------------------ câble électrique
// Prolonge la ligne du pylône de la centrale (au-dessus) et descend au poste.
const CABLE = 'M-12,16 Q110,102 210,116 L254,116 Q274,140 280,208'
// les lumières s'allument en vague, depuis l'arrivée du câble (à gauche) vers l'est
const wave = (x, i) => `${(x / 1200 * 1.6 + (i % 7) * 0.06).toFixed(2)}s`
// feux d'artifice aux couleurs du drapeau quand toute la ville est alimentée
const FIREWORKS = [
  { x: 520, y: 70, c: '#ed7f06', d: 0 },
  { x: 760, y: 48, c: '#ffffff', d: 0.9 },
  { x: 980, y: 78, c: '#0d9330', d: 1.7 },
  { x: 650, y: 96, c: '#ffd76a', d: 2.4 },
]
const RAYS = Array.from({ length: 12 }, (_, k) => {
  const a = k * Math.PI / 6
  return { x1: +(Math.cos(a) * 6).toFixed(2), y1: +(Math.sin(a) * 6).toFixed(2), x2: +(Math.cos(a) * 22).toFixed(2), y2: +(Math.sin(a) * 22).toFixed(2) }
})
const pulseDur = computed(() => (props.celebrate ? 1.8 : 3.2) + 's')
</script>

<template>
  <div class="abidjan" :class="rootClass">
    <svg
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMax slice"
      role="img"
      :aria-label="ariaLabel"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- ciel en trois bandes -->
      <rect class="sky" x="0" y="0" width="1200" height="110" :style="{ fill: sky[0] }" />
      <rect class="sky" x="0" y="110" width="1200" height="74" :style="{ fill: sky[1] }" />
      <rect class="sky" x="0" y="184" width="1200" height="60" :style="{ fill: sky[2] }" />
      <g class="stars">
        <circle v-for="(s, i) in stars" :key="'st' + i" :cx="s.x" :cy="s.y" :r="s.r" />
      </g>

      <!-- silhouettes lointaines -->
      <g class="far">
        <rect v-for="(b, i) in far" :key="'f' + i" :x="b.x" :y="b.y" :width="b.w" :height="b.h + 2" rx="1" />
      </g>

      <!-- câble électrique et pylône -->
      <g class="line">
        <path class="pylon" d="M216,238 L232,104 L248,238" fill="none" stroke-width="2.5" stroke-linejoin="round" />
        <line class="pylon" x1="210" y1="116" x2="254" y2="116" stroke-width="2.5" stroke-linecap="round" />
        <line class="pylon" x1="219" y1="132" x2="245" y2="132" stroke-width="2" stroke-linecap="round" />
        <line class="pylon" x1="223" y1="168" x2="241" y2="168" stroke-width="2" />
        <line class="pylon" x1="219" y1="204" x2="245" y2="204" stroke-width="2" />
        <path class="cable" :d="CABLE" fill="none" stroke-width="1.6" />
        <path class="pulses" :d="CABLE" fill="none" stroke-width="4.5" stroke-linecap="round" :style="{ animationDuration: pulseDur }" />
      </g>

      <!-- rives : petits immeubles -->
      <g>
        <rect v-for="(b, i) in lows" :key="'lw' + i" :x="b.x" :y="b.top" :width="b.w" :height="GROUND - b.top + 2" rx="1.5" :fill="b.fill" />
      </g>

      <!-- feux d'artifice (5/5) -->
      <g v-if="level >= 5 && celebrate" class="fireworks" aria-hidden="true">
        <g v-for="(f, i) in FIREWORKS" :key="'fw' + i" :transform="`translate(${f.x} ${f.y})`">
          <g class="burst" :style="{ animationDelay: f.d + 's' }">
            <line v-for="(r, k) in RAYS" :key="k" :x1="r.x1" :y1="r.y1" :x2="r.x2" :y2="r.y2" :stroke="f.c" stroke-width="2.5" stroke-linecap="round" />
          </g>
        </g>
      </g>

      <!-- cathédrale Saint-Paul -->
      <g class="cathedral">
        <polygon class="nave" points="360,238 360,158 474,214 474,238" />
        <rect
          v-for="(w, i) in naveWindows" :key="'nw' + i" class="win"
          :data-step="w.s" :x="w.x" :y="w.y" width="4" :height="w.h" rx="1"
          :style="{ transitionDelay: wave(w.x, i) }"
        />
        <polygon class="roof" points="358,146 476,208 476,216 358,156" />
        <line
          v-for="(c, i) in caCables" :key="'cc' + i" class="ca-cable"
          :x1="c.x1" :y1="c.y1" :x2="c.x2" :y2="c.y2" stroke-width="1"
        />
        <polygon class="mast" points="344,238 362,238 322,60 315,62" />
        <line class="mast-stroke" x1="300" y1="88" x2="340" y2="96" stroke-width="5" stroke-linecap="round" />
      </g>

      <!-- Plateau -->
      <g>
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
          :style="{ transitionDelay: wave(w.x, i), animationDelay: w.tw ? w.d + 's' : undefined }"
        />
      </g>

      <!-- Tour F -->
      <g class="tour-f">
        <rect x="590" y="226" width="44" height="14" rx="1.5" class="podium" />
        <polygon :points="tfOutline" class="tf-body" />
        <polygon
          v-for="(f, i) in facets" :key="'fa' + i"
          :points="f.pts" :class="'fct t' + f.t"
        />
        <line :x1="TF.cx" :y1="TF.top - 2" :x2="TF.cx" :y2="TF.antenna + 2" class="tf-antenna" stroke-width="1.4" />
        <line :x1="TF.cx - 2.5" :y1="TF.top - 14" :x2="TF.cx + 2.5" :y2="TF.top - 14" class="tf-antenna" stroke-width="1" />
        <line :x1="TF.cx - 1.8" :y1="TF.top - 26" :x2="TF.cx + 1.8" :y2="TF.top - 26" class="tf-antenna" stroke-width="1" />
        <circle class="beacon" :cx="TF.cx" :cy="TF.antenna" r="2.6" />
      </g>

      <!-- quai -->
      <rect x="0" y="237" width="1200" height="6" class="quay" />

      <!-- lagune Ébrié -->
      <rect x="0" y="243" width="1200" height="57" class="lagoon" />
      <g class="ripples">
        <line v-for="(r, i) in ripples" :key="'rp' + i" :x1="r.x" :y1="r.y" :x2="r.x + r.w" :y2="r.y" stroke-width="1.4" stroke-linecap="round" />
      </g>
      <g>
        <line
          v-for="(r, i) in reflections" :key="'rf' + i" class="refl" :data-step="r.s"
          :x1="r.x" :y1="r.y" :x2="r.x + r.w" :y2="r.y" stroke-width="1.6" stroke-linecap="round"
        />
      </g>

      <!-- poste électrique -->
      <g class="substation">
        <rect x="268" y="208" width="24" height="30" rx="2" class="sub-body" />
        <rect x="272" y="214" width="16" height="3" rx="1" class="sub-light" />
        <rect x="272" y="221" width="16" height="2" rx="1" class="sub-line" />
        <rect x="272" y="227" width="16" height="2" rx="1" class="sub-line" />
      </g>

      <!-- palmiers -->
      <g v-for="(p, i) in palms" :key="'pm' + i" class="palm">
        <path :d="p.trunk" class="trunk" fill="none" stroke-width="3" stroke-linecap="round" />
        <path v-for="(f, j) in p.fronds" :key="j" :d="f.d" :class="'frond k' + f.k" />
      </g>

      <!-- pont Alassane-Ouattara -->
      <g class="bridge">
        <rect x="590" y="246" width="12" height="22" class="pier" />
        <rect x="1040" y="246" width="10" height="22" class="pier" />
        <rect x="1140" y="246" width="10" height="22" class="pier" />
        <line
          v-for="(h, i) in haubans" :key="'hb' + i"
          class="hauban" :class="h.side === 'l' ? 'left' : 'right'"
          :x1="h.x1" :y1="h.y1" :x2="h.x2" :y2="h.y2" stroke-width="1.1"
          :style="{ animationDelay: (h.i * 0.14) + 's' }"
        />
        <polygon class="pylon-a" :points="legPts(-1)" />
        <polygon class="pylon-a" :points="legPts(1)" />
        <polygon class="pylon-a" :points="`${BR.cx - 10},150 ${BR.cx + 10},150 ${BR.cx + 10.6},155 ${BR.cx - 10.6},155`" />
        <rect :x="BR.cx - 4.5" :y="BR.apex - 6" width="9" height="16" rx="2" class="pylon-cap" />
        <rect x="548" y="242" width="652" height="5" rx="1" class="deck" />
        <rect x="548" y="246.5" width="652" height="2" class="deck-under" />
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
.sky { transition: fill .8s ease; }
.stars circle { fill: #d8eef6; opacity: .7; transition: opacity .8s ease; }
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
.win { fill: #3a4b63; transition: fill .8s ease; }
.on-1 .win[data-step="1"],
.on-2 .win[data-step="2"],
.on-3 .win[data-step="3"],
.on-4 .win[data-step="4"],
.on-5 .win[data-step="5"] { fill: #ffd76a; }

.refl { stroke: #2a4a72; transition: stroke .8s ease; }
.on-1 .refl[data-step="1"],
.on-2 .refl[data-step="2"],
.on-3 .refl[data-step="3"],
.on-4 .refl[data-step="4"],
.on-5 .refl[data-step="5"] { stroke: #c9a24e; }

/* ------------------------------------------------ cathédrale */
.nave { fill: #c9d3dc; }
.roof { fill: #2a7eba; }
.mast { fill: #f3f7fa; }
.mast-stroke { stroke: #f3f7fa; }
.ca-cable { stroke: #c9d3dc; }

/* ------------------------------------------------ Tour F */
.podium { fill: #4d5c6b; }
.tf-body { fill: #5f6f7e; }
.fct { stroke: #1f2832; stroke-width: .45; stroke-linejoin: round; transition: fill .8s ease, stroke .8s ease; }
.fct.t0 { fill: #a9b9c8; }
.fct.t1 { fill: #8a9db0; }
.fct.t2 { fill: #6d8297; }
.lv-5 .fct { stroke: #fff6d9; }
.lv-5 .fct.t0 { fill: #e6f3fb; }
.lv-5 .fct.t1 { fill: #b9d9f0; }
.lv-5 .fct.t2 { fill: #8fbadf; }
.beacon { fill: #7a3a3a; transition: fill .8s ease; }
.powered .beacon { fill: #c8473d; }
.lv-5 .beacon { fill: #ff4a3d; animation: blink 1.6s steps(1, end) infinite; }

/* ------------------------------------------------ pont ADO */
.pylon-a { fill: #e8792b; }
.pylon-cap { fill: #e8792b; transition: fill .8s ease; }
.lv-5 .pylon-cap { fill: #ffffff; }
.deck { fill: #c9d3dc; }
.deck-under { fill: #5f6f7e; }
.pier { fill: #5f6f7e; }
.hauban { stroke: #8d9dac; transition: stroke .8s ease; }
.lv-5 .hauban.left { stroke: #ff9a3c; }
.lv-5 .hauban.right { stroke: #2fbf71; }

/* ------------------------------------------------ câble, poste */
.pylon { stroke: #8d9dac; }
.cable { stroke: #7b8d9b; transition: stroke .8s ease; }
.powered .cable { stroke: #c9d3dc; }
.pulses { stroke: #ffd76a; stroke-dasharray: 0 56; opacity: 0; transition: opacity .8s ease; }
.powered .pulses { opacity: 1; animation: flow 3.2s linear infinite; }
.sub-body { fill: #7b8d9b; }
.sub-line { fill: #5f6f7e; }
.sub-light { fill: #3a4b63; transition: fill .8s ease; }
.powered .sub-light { fill: #6aa86a; }

/* ------------------------------------------------ palmiers */
.trunk { stroke: #6b4f2a; }
.frond.k0 { fill: #4e8a58; }
.frond.k1 { fill: #6aa86a; }

/* ------------------------------------------------ animations */
@keyframes flow { to { stroke-dashoffset: -56; } }
.burst { transform: scale(.1); opacity: 0; animation: burst 3.2s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes burst { 0% { transform: scale(.1); opacity: 0; } 8% { opacity: 1; } 45% { transform: scale(1); opacity: .9; } 70%, 100% { transform: scale(1.15); opacity: 0; } }
@keyframes blink { 0% { opacity: 1; } 60% { opacity: .25; } }
@keyframes twinkle { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
@keyframes breathe { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }

.celebrate .win.tw { animation: twinkle 2.6s ease-in-out infinite; }
.celebrate .hauban { animation: breathe 2.2s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .abidjan *, .abidjan *::before, .abidjan *::after { animation: none !important; }
}
</style>
