<script setup>
// Plateau d'un puzzle : 6 pièces découpées dans le schéma 1:1 du client.
// Une seule scène SVG (plateau + bac), pilotée par Pointer Events
// (souris, tactile, stylet) et au clavier.
import { CELL, COLS, ROWS, WIDTH, HEIGHT, piecePath, cellFlows, CUT_COLOR, CUT_DASH, CUT_HALO, CUT_WIDTH } from '~/utils/jigsaw'
import { FLOW_TYPES } from '~/data/plants'

const props = defineProps({
  plant: { type: Object, required: true },
  solved: { type: Boolean, default: false },
})
const emit = defineEmits(['validate', 'complete', 'announce', 'first-move', 'pick', 'progress'])

const uid = useId().replace(/[^\w-]/g, '')
const { play } = useSound()
const wrap = ref(null)
const { gsap, reduced: lowMotion, run } = useGsap(wrap)
// petits gestes GSAP : la pièce se tasse en se calant, les pièces justes se verrouillent en cascade
const innerOf = p => wrap.value?.querySelector(`.piece[data-idx="${p.idx}"] .piece-inner`)
function settle (p) {
  if (lowMotion.value) return
  const el = innerOf(p)
  if (el) run(() => gsap.fromTo(el, { scale: 1.05, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.35, ease: 'back.out(3)', delay: 0.18, clearProps: 'transform' }))
}
function cascade () {
  if (lowMotion.value) return
  const els = [...(wrap.value?.querySelectorAll('.piece[role="button"] .piece-inner') || [])]
  run(() => gsap.fromTo(els, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.035, duration: 0.16, yoyo: true, repeat: 1, stagger: 0.08, ease: 'sine.out', clearProps: 'transform' }))
}
const { art, inner } = useArt()

// ---------- Mise en page (paysage : bac à droite ; portrait : bac dessous)
const M = 70 // marge pour les lobes qui dépassent du plateau
const portrait = ref(false)
const layout = computed(() => portrait.value
  ? { W: WIDTH + 2 * M, H: HEIGHT + 2 * M + 680, bx: M, by: M, tray: { x: 10, y: HEIGHT + 2 * M, w: WIDTH + 2 * M - 20, h: 660, cols: 3, rows: 2, s: 0.7 } }
  : { W: WIDTH + 2 * M + 560, H: 820, bx: M, by: (820 - HEIGHT) / 2, tray: { x: WIDTH + 2 * M + 10, y: 10, w: 540, h: 800, cols: 2, rows: 3, s: 0.6 } })

let ro
const settled = ref(false)
const size = ref({ width: 0, height: 0 })
// échelle d'affichage : sous 0,75, les étiquettes des pièces deviennent difficiles à lire
const renderScale = computed(() => Math.min(size.value.width / layout.value.W, size.value.height / layout.value.H) || 1)
onMounted(() => {
  const box = wrap.value.getBoundingClientRect()
  portrait.value = box.width / Math.max(box.height, 1) < 1.25
  relayout()
  setTimeout(() => { settled.value = true }, 450)
  ro = new ResizeObserver(([e]) => {
    const { width, height } = e.contentRect
    portrait.value = width / Math.max(height, 1) < 1.25
    size.value = { width, height }
  })
  ro.observe(wrap.value)
})
onBeforeUnmount(() => ro?.disconnect())

// ---------- Hasard reproductible par partie
function rng (seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
}

// ---------- Pièces
const pieces = ref([])
const zTop = ref(0)
const N = COLS * ROWS

function slotPos (slot, s) {
  const t = layout.value.tray
  const cw = t.w / t.cols, ch = t.h / t.rows
  const p = pieces.value.find(q => q.slot === slot)
  const jx = p?.jx || 0, jy = p?.jy || 0
  const cx = t.x + cw * (slot % t.cols + 0.5) + jx
  const cy = t.y + ch * (Math.floor(slot / t.cols) + 0.5) + jy
  return { x: cx - (CELL / 2) * s, y: cy - (CELL / 2) * s }
}
const cellPos = k => ({ x: layout.value.bx + (k % COLS) * CELL, y: layout.value.by + Math.floor(k / COLS) * CELL })

function setup () {
  const rand = rng((Date.now() ^ (Math.random() * 1e9)) >>> 0)
  const slots = [...Array(N).keys()].sort(() => rand() - 0.5)
  pieces.value = [...Array(N).keys()].map(i => ({
    idx: i, c: i % COLS, r: Math.floor(i / COLS),
    label: props.plant.pieces[i],
    slot: slots[i],
    cell: null,
    locked: false,
    z: i,
    jx: (rand() - 0.5) * 24, jy: (rand() - 0.5) * 24,
    x: 0, y: 0, s: 1,
    state: 'idle', // idle | drag | wrong
  }))
  if (props.solved) pieces.value.forEach(p => { p.cell = p.idx; p.locked = true })
  relayout()
}

function home (p) {
  if (p.cell !== null) { Object.assign(p, cellPos(p.cell), { s: 1 }); return }
  const s = layout.value.tray.s
  Object.assign(p, slotPos(p.slot, s), { s })
}
function relayout () { pieces.value.forEach(home) }
watch(portrait, () => nextTick(relayout))
watch(() => props.plant.id, setup)
setup()

const sorted = computed(() => [...pieces.value].sort((a, b) => a.z - b.z))
const occupant = k => pieces.value.find(p => p.cell === k)
const filled = computed(() => pieces.value.every(p => p.cell !== null))
const allLocked = computed(() => pieces.value.every(p => p.locked))
const placed = computed(() => pieces.value.filter(p => p.cell !== null).length)
watch(placed, n => emit('progress', n), { immediate: true })

// ---------- Loupe : la pièce tenue (ou sélectionnée au clavier), en grand
const held = computed(() => pieces.value.find(p => p.state === 'drag') || selected.value)
const showLoupe = computed(() => !!held.value && renderScale.value < 0.75)

// ---------- Schéma terminé : les flux en pointillés se mettent à circuler
const finalEl = ref(null)
const flowing = ref(false)
watch(allLocked, (done) => {
  if (!done) return
  nextTick(() => {
    const root = finalEl.value
    if (!root) return
    for (const path of root.querySelectorAll('[stroke-dasharray]')) {
      if (path.closest('#decoupes')) continue
      const period = path.getAttribute('stroke-dasharray').split(/[\s,]+/).reduce((a, b) => a + (+b || 0), 0)
      path.classList.add('flux')
      path.style.setProperty('--period', `${period}px`)
    }
    const fluxes = [...root.querySelectorAll('.flux')]
    if (!lowMotion.value && fluxes.length) run(() => gsap.from(fluxes, { opacity: 0, duration: 0.5, stagger: 0.18, delay: 0.6 }))
    setTimeout(() => { flowing.value = true }, 1400)
  })
})

function outline (p) {
  // emboîtement logique : un tenon par flux, dans le sens du flux (data/plants.js)
  return piecePath(p.c, p.r, props.plant.edges)
}

// ---------- Glisser-déposer
const svgEl = ref(null)
let drag = null
let moved = false

function toSvg (e) {
  const pt = svgEl.value.createSVGPoint()
  pt.x = e.clientX; pt.y = e.clientY
  return pt.matrixTransform(svgEl.value.getScreenCTM().inverse())
}

function onDown (e, p) {
  if (p.locked || checking.value || e.button > 0) return
  e.preventDefault()
  const q = toSvg(e)
  // prise dans le bac : la pièce reprend sa taille réelle, centrée sous le doigt ;
  // sur le plateau : elle garde le point de prise
  const fromTray = p.cell === null
  const x = fromTray ? q.x - CELL / 2 : p.x, y = fromTray ? q.y - CELL / 2 : p.y
  Object.assign(p, { x, y, s: 1, state: 'drag', z: ++zTop.value + 100 })
  drag = { p, id: e.pointerId, dx: q.x - x, dy: q.y - y, el: e.currentTarget }
  e.currentTarget.setPointerCapture(e.pointerId)
  cancelSelection()
  emit('pick', p.label)
  play('pick')
}
function onMove (e) {
  if (!drag || e.pointerId !== drag.id) return
  const q = toSvg(e)
  drag.p.x = q.x - drag.dx
  drag.p.y = q.y - drag.dy
}
function onUp (e) {
  if (!drag || e.pointerId !== drag.id) return
  const p = drag.p
  drag = null
  p.state = 'idle'
  emit('pick', null)
  const L = layout.value
  const cx = p.x + CELL / 2, cy = p.y + CELL / 2
  const inside = cx > L.bx - 40 && cx < L.bx + WIDTH + 40 && cy > L.by - 40 && cy < L.by + HEIGHT + 40
  if (inside) {
    const col = Math.min(COLS - 1, Math.max(0, Math.floor((cx - L.bx) / CELL)))
    const row = Math.min(ROWS - 1, Math.max(0, Math.floor((cy - L.by) / CELL)))
    drop(p, row * COLS + col)
  } else {
    toTray(p)
  }
}

function toTray (p) {
  p.cell = null
  home(p)
}

function drop (p, k) {
  const other = occupant(k)
  if (other === p) { home(p); return }
  if (other?.locked) { home(p); emit('announce', 'Cette case est déjà verrouillée.'); return }
  if (other) {
    // échange : l'autre pièce prend la place d'où vient celle-ci
    if (p.cell !== null) { other.cell = p.cell } else { other.cell = null; [other.slot, p.slot] = [p.slot, other.slot] }
    home(other)
  }
  p.cell = k
  home(p)
  play('snap')
  settle(p)
  if (!moved) { moved = true; emit('first-move') }
  emit('announce', `${p.label} posée en case ${k + 1}.`)
  if (filled.value) setTimeout(validate, 380)
}

// ---------- Vérification : seulement quand les 6 cases sont remplies
const checking = ref(false)
function validate () {
  if (!filled.value || checking.value) return
  const wrong = pieces.value.filter(p => !p.locked && p.cell !== p.idx)
  pieces.value.forEach(p => { if (p.cell === p.idx) p.locked = true })
  if (!wrong.length) {
    play('lock')
    cascade()
    emit('validate', { wrong: 0 })
    setTimeout(() => emit('complete'), 450)
    return
  }
  checking.value = true
  play('wrong')
  wrong.forEach(p => { p.state = 'wrong' })
  emit('validate', { wrong: wrong.length })
  emit('announce', `${wrong.length} pièce${wrong.length > 1 ? 's' : ''} mal placée${wrong.length > 1 ? 's' : ''} : retour au bac.`)
  setTimeout(() => {
    wrong.forEach(p => { p.state = 'idle'; toTray(p) })
    checking.value = false
  }, 700)
}

// ---------- Coup de pouce : une pièce rejoint sa case et s'y verrouille
function hint () {
  const p = pieces.value.find(q => !q.locked && q.cell !== q.idx) || pieces.value.find(q => !q.locked)
  if (!p) return false
  const other = occupant(p.idx)
  if (other && other !== p) toTray(other)
  p.cell = p.idx
  p.locked = true
  p.z = ++zTop.value
  home(p)
  emit('announce', `Coup de pouce : ${p.label} est en case ${p.idx + 1}.`)
  if (filled.value) setTimeout(validate, 380)
  return true
}
defineExpose({ hint })

// ---------- Clavier : Entrée pour prendre, flèches pour viser, Entrée pour poser
const selected = ref(null)
const cursor = ref(0)
function cancelSelection () { selected.value = null }
function onKey (e, p) {
  if (p.locked || checking.value) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (selected.value === p) {
      const q = p
      selected.value = null
      q.z = ++zTop.value
      drop(q, cursor.value)
    } else {
      selected.value = p
      cursor.value = p.cell ?? pieces.value.findIndex((_, k) => !occupant(k)) ?? 0
      if (cursor.value < 0) cursor.value = 0
      emit('announce', `${p.label} sélectionnée. Flèches pour choisir une case, Entrée pour poser, Échap pour annuler.`)
    }
  } else if (selected.value === p && e.key.startsWith('Arrow')) {
    e.preventDefault()
    let c = cursor.value % COLS, r = Math.floor(cursor.value / COLS)
    if (e.key === 'ArrowLeft') c = (c + COLS - 1) % COLS
    if (e.key === 'ArrowRight') c = (c + 1) % COLS
    if (e.key === 'ArrowUp') r = (r + ROWS - 1) % ROWS
    if (e.key === 'ArrowDown') r = (r + 1) % ROWS
    cursor.value = r * COLS + c
    emit('announce', `Case ${cursor.value + 1}${occupant(cursor.value) ? ' (occupée)' : ''}.`)
  } else if (e.key === 'Escape' && selected.value) {
    selected.value = null
  } else if ((e.key === 'Backspace' || e.key === 'Delete') && p.cell !== null) {
    toTray(p)
  }
}

// description des tenons pour les lecteurs d'écran : « envoie de l'énergie à droite »…
const flowText = p => cellFlows(p.c, p.r, props.plant.edges)
  .map(f => `${f.sends ? 'envoie' : 'reçoit'} ${FLOW_TYPES[f.type].phrase} ${f.side === 'haut' || f.side === 'bas' ? 'en' : 'à'} ${f.side}`)
  .join(', ')
const ariaFor = p => p.locked
  ? `${p.label}, bien placée`
  : `Pièce ${p.label}${p.cell !== null ? `, posée en case ${p.cell + 1}` : ', dans le bac'}${flowText(p) ? ` ; ${flowText(p)}` : ''}`

// Les étiquettes sont retirées du dessin découpé : chaque pièce affiche la sienne
// en entier (dans le PDF, certains lobes traversent l'étiquette de la case voisine).
const split = computed(() => {
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${art(props.plant.id)}</svg>`, 'image/svg+xml')
  const labels = {}
  for (const g of doc.querySelectorAll('.label')) {
    labels[g.getAttribute('data-cell')] = g.outerHTML
    g.remove()
  }
  return { art: doc.documentElement.innerHTML, labels }
})
const defs = computed(() =>
  `<symbol id="art-${uid}" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">${split.value.art}</symbol>`)
const fullArt = computed(() => inner(props.plant.id))
</script>

<template>
  <div ref="wrap" class="board-wrap" :class="{ settling: !settled }">
    <svg
      ref="svgEl"
      class="board"
      :viewBox="`0 0 ${layout.W} ${layout.H}`"
      preserveAspectRatio="xMidYMid meet"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <defs>
        <g v-html="defs" />
        <filter :id="`lift-${uid}`" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#1f2832" flood-opacity="0.28" />
        </filter>
        <clipPath v-for="p in pieces" :id="`clip-${uid}-${p.idx}`" :key="p.idx">
          <path :d="outline(p)" />
        </clipPath>
      </defs>

      <!-- bac -->
      <rect class="tray" :x="layout.tray.x" :y="layout.tray.y" :width="layout.tray.w" :height="layout.tray.h" rx="28" />

      <!-- plateau : cadre et grille pâle, sans silhouette -->
      <g :transform="`translate(${layout.bx} ${layout.by})`">
        <rect class="slot-bg" :width="WIDTH" :height="HEIGHT" />
        <g class="grid">
          <line v-for="c in COLS - 1" :key="`c${c}`" :x1="c * CELL" y1="0" :x2="c * CELL" :y2="HEIGHT" />
          <line v-for="r in ROWS - 1" :key="`r${r}`" x1="0" :y1="r * CELL" :x2="WIDTH" :y2="r * CELL" />
        </g>
        <rect
          v-if="selected"
          class="cursor"
          :x="(cursor % COLS) * CELL + 6" :y="Math.floor(cursor / COLS) * CELL + 6"
          :width="CELL - 12" :height="CELL - 12" rx="14"
        />
      </g>

      <!-- pièces -->
      <g
        v-for="p in sorted"
        :key="p.idx"
        class="piece"
        :data-idx="p.idx"
        :class="[`is-${p.state}`, { 'is-locked': p.locked, 'is-selected': selected === p }]"
        :style="{ transform: `translate(${p.x}px, ${p.y}px) scale(${p.s})` }"
        :tabindex="p.locked ? -1 : 0"
        role="button"
        :aria-label="ariaFor(p)"
        :aria-pressed="selected === p"
        @pointerdown="onDown($event, p)"
        @keydown="onKey($event, p)"
      >
        <g class="piece-inner" :filter="p.state === 'drag' ? `url(#lift-${uid})` : undefined">
          <g :transform="`translate(${-p.c * CELL} ${-p.r * CELL})`">
            <path :d="outline(p)" :fill="plant.bg[p.r]" />
            <use :href="`#art-${uid}`" :clip-path="`url(#clip-${uid}-${p.idx})`" />
            <path class="cut-halo" :d="outline(p)" fill="none" :stroke-width="CUT_HALO" />
            <path class="cut" :d="outline(p)" fill="none" :stroke="CUT_COLOR" :stroke-width="CUT_WIDTH" :stroke-dasharray="CUT_DASH" />
          </g>
        </g>
      </g>

      <!-- noms des pièces : calque au-dessus de toutes les pièces, toujours lisibles -->
      <g
        v-for="p in sorted"
        :key="`l${p.idx}`"
        class="piece piece-label"
        :class="`is-${p.state}`"
        :style="{ transform: `translate(${p.x}px, ${p.y}px) scale(${p.s})` }"
        aria-hidden="true"
      >
        <g class="piece-inner">
          <g :transform="`translate(${-p.c * CELL} ${-p.r * CELL})`" v-html="split.labels[p.idx]" />
        </g>
      </g>

      <!-- schéma terminé : exactement le PDF du client -->
      <g v-if="allLocked" ref="finalEl" class="final" :class="{ flowing }" :transform="`translate(${layout.bx} ${layout.by})`" v-html="fullArt" />
    </svg>

    <!-- loupe : sur petit écran, la pièce tenue s'affiche en grand avec son nom -->
    <div v-if="showLoupe" class="loupe" aria-hidden="true">
      <svg :viewBox="`${held.c * CELL - 70} ${held.r * CELL - 70} ${CELL + 140} ${CELL + 140}`">
        <path :d="outline(held)" :fill="plant.bg[held.r]" />
        <use :href="`#art-${uid}`" :clip-path="`url(#clip-${uid}-${held.idx})`" />
        <path :d="outline(held)" fill="none" stroke="#fff" :stroke-width="CUT_HALO" />
        <path :d="outline(held)" fill="none" :stroke="CUT_COLOR" :stroke-width="CUT_WIDTH" :stroke-dasharray="CUT_DASH" />
        <g v-html="split.labels[held.idx]" />
      </svg>
      <p>{{ held.label }}</p>
    </div>
  </div>
</template>

<style scoped>
.board-wrap { position: relative; width: 100%; height: 100%; min-height: 0; }
.board { display: block; width: 100%; height: 100%; touch-action: none; user-select: none; -webkit-user-select: none; }
.tray { fill: var(--tray); stroke: var(--line); stroke-width: 2; }
.slot-bg { fill: var(--board); stroke: var(--ink); stroke-width: 6; }
.grid line { stroke: var(--grid); stroke-width: 2; stroke-dasharray: 10 10; }
.cursor { fill: none; stroke: var(--accent); stroke-width: 8; stroke-dasharray: 18 10; }
.piece { cursor: grab; transition: transform .32s cubic-bezier(.2, .8, .2, 1); outline: none; }
.piece.is-drag { cursor: grabbing; transition: none; }
.settling .piece { transition: none; }
.piece.is-locked { cursor: default; }
.piece-label { pointer-events: none; }
.piece.is-locked .cut, .piece.is-locked .cut-halo { opacity: 0; transition: opacity .3s; }
.cut-halo { stroke: #fff; }
.piece:focus-visible .cut-halo, .piece.is-selected .cut-halo { stroke: var(--accent); stroke-width: 12; }
.piece.is-wrong .piece-inner { animation: shake .5s ease-in-out; }
.final { animation: fade .5s ease both; pointer-events: none; }
/* une fois le schéma reconstitué : découpes effacées, énergie qui circule */
/* le jeu a ses propres découpes logiques : le schéma final s'affiche sans celles du PDF */
.final :deep(#decoupes) { display: none; }
.final.flowing :deep(.flux) { animation: flux 1.1s linear infinite; }
@keyframes flux { to { stroke-dashoffset: calc(-1 * var(--period, 18px)); } }
.loupe {
  position: absolute; left: 8px; top: 8px; width: min(46%, 230px);
  background: var(--surface); border: 3px solid var(--ink); border-radius: 22px;
  box-shadow: var(--shadow-lift); padding: 6px 6px 8px; pointer-events: none;
}
.loupe svg { display: block; width: 100%; height: auto; }
.loupe p { font-family: var(--font-display); font-weight: 700; text-align: center; line-height: 1.15; margin-top: 2px; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-14px); }
  40% { transform: translateX(12px); }
  60% { transform: translateX(-8px); }
  80% { transform: translateX(5px); }
}
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .piece { transition: none; }
  .piece.is-wrong .piece-inner, .final, .final.flowing :deep(.flux) { animation: none; }
}
</style>
