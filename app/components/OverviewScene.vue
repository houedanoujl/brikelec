<script setup>
// Vue d'ensemble « La centrale du futur » (schéma 1:1 du client).
// Chaque centrale non résolue est affichée en silhouette ; touchez-la pour
// ouvrir son puzzle. Une centrale résolue se dessine en couleur.
import { PLANTS } from '~/data/plants'

const props = defineProps({
  solved: { type: Object, required: true }, // id → bool
  reveal: { type: String, default: null },  // centrale à révéler avec animation
  celebrate: { type: Boolean, default: false },
})
const emit = defineEmits(['open', 'revealed', 'energized'])
const tagW = p => 50 + p.name.length * 10.5
const { inner, has } = useArt()
const host = ref(null)
const sceneRoot = ref(null)
const { gsap, reduced, run, loop } = useGsap(sceneRoot)
const boxes = ref({}) // id → { x, y, w } (en unités du schéma 1200×900)
const solvedCount = computed(() => PLANTS.filter(p => props.solved[p.id]).length)
const ready = computed(() => has('ensemble'))
const markup = computed(() => inner('ensemble'))

// Les groupes d'une même centrale (data-plant) reçoivent une copie silhouette.
function decorate () {
  const root = host.value
  if (!root) return
  root.querySelectorAll('.sil').forEach(n => n.remove())
  for (const g of root.querySelectorAll('[data-plant]')) {
    const sil = g.cloneNode(true)
    sil.removeAttribute('id')
    sil.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'))
    sil.classList.add('sil')
    sil.setAttribute('filter', 'url(#silhouette)')
    sil.setAttribute('aria-hidden', 'true')
    g.after(sil)
  }
  for (const g of root.querySelectorAll('[data-plant]:not(.sil)')) {
    const id = g.getAttribute('data-plant')
    g.classList.add('plant')
    g.style.cursor = 'pointer'
    g.onclick = () => emit('open', id)
  }
  root.querySelectorAll('.sil').forEach(s => { s.onclick = () => emit('open', s.getAttribute('data-plant')) })
  // position des étiquettes « à assembler » : au-dessus de chaque centrale
  const b = {}
  for (const p of PLANTS) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity
    root.querySelectorAll(`[data-plant="${p.id}"]:not(.sil)`).forEach(g => {
      const r = g.getBBox()
      x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.width)
    })
    if (Number.isFinite(x0)) b[p.id] = { x: (x0 + x1) / 2, y: Math.max(y0 - 10, 40) }
  }
  // le soleil fait partie du solaire mais est loin des panneaux : étiquette sur les panneaux
  const pan = root.querySelector('[data-plant="solaire"]')
  if (pan && b.solaire) b.solaire = { x: 970, y: 640 }
  boxes.value = b
  // légende : pastilles cliquables
  for (const p of PLANTS) {
    const l = root.querySelector(`#legende-${p.id}`)
    if (l) { l.style.cursor = 'pointer'; l.onclick = () => emit('open', p.id) }
  }
  apply(true)
}

function apply (instant = false) {
  const root = host.value
  if (!root) return
  root.classList.toggle('instant', instant)
  for (const p of PLANTS) {
    const on = !!props.solved[p.id] && !(props.reveal === p.id && instant)
    root.querySelectorAll(`[data-plant="${p.id}"]`).forEach(g => {
      g.classList.toggle('on', on)
    })
    root.querySelector(`#legende-${p.id}`)?.classList.toggle('on', !!props.solved[p.id])
  }
}

// ------------------------------------------------------------ animations (GSAP)
const plantGroups = id => [...(host.value?.querySelectorAll(`[data-plant="${id}"]:not(.sil)`) || [])]
function bboxOf (els) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  els.forEach((g) => {
    const r = g.getBBox()
    x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.width); y1 = Math.max(y1, r.y + r.height)
  })
  return { x0, y0, x1, y1 }
}
const between = (a, b) => a + Math.random() * (b - a)
const rotorAnims = []
const NS = 'http://www.w3.org/2000/svg'

// Une centrale démarre : pales qui accélèrent, fumée, bulles d'hydrogène
function startPlant (id, fromZero) {
  if (reduced.value) return
  run(() => {
    for (const g of plantGroups(id)) {
      g.querySelectorAll('.rotor').forEach((rotor) => {
        const o = (rotor.style.transformOrigin || '').match(/[\d.]+/g)
        rotor.style.transformOrigin = ''
        const anim = loop(gsap.to(rotor, { rotation: '+=360', svgOrigin: o ? `${o[0]} ${o[1]}` : '50% 50%', duration: 7, ease: 'none', repeat: -1 }))
        anim.timeScale(props.celebrate ? 2 : 1)
        if (fromZero) gsap.fromTo(anim, { timeScale: 0 }, { timeScale: props.celebrate ? 2 : 1, duration: 3.2, ease: 'power1.in' })
        rotorAnims.push(anim)
      })
      g.querySelectorAll('.smoke').forEach((smoke) => {
        const b = smoke.getBBox()
        loop(gsap.timeline({ repeat: -1, repeatDelay: 0.25 }).call(() => puff(b.x + b.width / 2, b.y + b.height * 0.8)).to({}, { duration: 0.9 }))
      })
    }
    if (id === 'hydrogene') {
      const b = bboxOf(plantGroups(id).slice(0, 1))
      loop(gsap.timeline({ repeat: -1 }).call(() => bubble(between(b.x0 + 20, b.x0 + 70), b.y0 + 10)).to({}, { duration: 0.55 }))
    }
  })
}

// bouffée de fumée : monte, grossit et se dissipe
function puff (x, y) {
  const layer = host.value?.querySelector('.particles')
  if (!layer) return
  const c = document.createElementNS(NS, 'circle')
  Object.entries({ cx: x, cy: y, r: between(7, 10), fill: '#ffffff', opacity: 0.9 }).forEach(([k, v]) => c.setAttribute(k, v))
  layer.appendChild(c)
  gsap.to(c, { attr: { r: between(16, 22) }, x: between(-6, 16), y: -between(40, 58), opacity: 0, duration: 3.4, ease: 'sine.out', onComplete: () => c.remove() })
}
// bulle d'hydrogène
function bubble (x, y) {
  const layer = host.value?.querySelector('.particles')
  if (!layer) return
  const c = document.createElementNS(NS, 'circle')
  Object.entries({ cx: x, cy: y, r: between(2.5, 5), fill: 'none', stroke: '#5aa2e0', 'stroke-width': 2, opacity: 0.95 }).forEach(([k, v]) => c.setAttribute(k, v))
  layer.appendChild(c)
  gsap.to(c, { y: -between(30, 48), x: between(-8, 8), opacity: 0, duration: 2.4, ease: 'sine.out', onComplete: () => c.remove() })
}

// Révélation : la couleur monte en volet par-dessus la silhouette, une ligne
// orange balaie la construction, puis la centrale démarre et envoie l'énergie
function revealPlant (id) {
  const root = host.value
  const groups = plantGroups(id)
  if (!root || !groups.length || reduced.value) {
    apply(false)
    emit('revealed')
    emit('energized')
    return
  }
  root.classList.remove('instant')
  const b = bboxOf(groups)
  const pad = 14
  run(() => {
    const rect = root.querySelector('.reveal-rect')
    const scan = root.querySelector('.reveal-scan')
    groups.forEach((g) => { g.setAttribute('clip-path', 'url(#reveal-clip)'); g.style.transition = 'none' })
    const tl = gsap.timeline({ delay: 0.5 })
    tl.call(() => apply(false))
      .fromTo(rect, { attr: { x: b.x0 - pad, width: b.x1 - b.x0 + pad * 2, y: b.y1 + pad, height: 0 } },
        { attr: { y: b.y0 - pad, height: b.y1 - b.y0 + pad * 2 }, duration: 1.7, ease: 'power2.inOut' }, 0)
      .fromTo(scan, { attr: { x1: b.x0 - pad, x2: b.x1 + pad, y1: b.y1 + pad, y2: b.y1 + pad }, opacity: 1 },
        { attr: { y1: b.y0 - pad, y2: b.y0 - pad }, duration: 1.7, ease: 'power2.inOut' }, 0)
      .to(scan, { opacity: 0, duration: 0.35 })
      .call(() => {
        groups.forEach((g) => { g.removeAttribute('clip-path'); g.style.transition = '' })
        startPlant(id, true)
        emit('revealed')
      })
      .add(energize(), '+=0.6')
  })
}

// Impulsion d'énergie : du poste au pylône, puis vers Abidjan (hors de la scène)
function energize () {
  const tl = gsap.timeline()
  const path = host.value.querySelector('#ligne-abidjan')
  const dot = host.value.querySelector('.energize-dot')
  if (!path || !dot) return tl.call(() => emit('energized'))
  tl.set(dot, { opacity: 1, scale: 1 })
    .to(dot, { duration: 1.4, ease: 'power1.in', motionPath: { path, align: path, alignOrigin: [0.5, 0.5] } })
    .to(dot, { opacity: 0, duration: 0.2 })
    .call(() => emit('energized'), null, '-=0.15')
  return tl
}

// Nuages : le vent les pousse d'avant en arrière, chacun à son rythme
function driftClouds () {
  if (reduced.value) return
  run(() => {
    host.value?.querySelectorAll('.cloud').forEach((cl, i) => {
      loop(gsap.fromTo(cl, { x: -30 - i * 8 }, { x: 55 + i * 10, duration: between(14, 22), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: -between(0, 10) }))
      loop(gsap.to(cl, { y: between(-4, 4), duration: between(3, 5), ease: 'sine.inOut', yoyo: true, repeat: -1 }))
    })
  })
}

let mounted = false
const started = new Set()
function startSolved () {
  for (const p of PLANTS) {
    if (props.solved[p.id] && p.id !== props.reveal && !started.has(p.id)) { started.add(p.id); startPlant(p.id, false) }
  }
}
onMounted(() => nextTick(() => {
  decorate()
  driftClouds()
  startSolved()
  if (props.reveal) { started.add(props.reveal); revealPlant(props.reveal) }
  mounted = true
}))
// partie restaurée après le montage (rechargement de la page) : on rattrape
watch(() => props.reveal, (id) => { if (id && mounted && !started.has(id)) { started.add(id); revealPlant(id) } })
watch(() => props.solved, () => { if (mounted) nextTick(startSolved) }, { deep: true })
watch(() => props.celebrate, (on) => rotorAnims.forEach(a => gsap.to(a, { timeScale: on ? 2 : 1, duration: 1.5 })))
watch(() => props.solved, () => apply(false), { deep: true })
watch(markup, () => nextTick(decorate))
</script>

<template>
  <div ref="sceneRoot" class="scene" :class="{ celebrate }">
    <svg v-if="ready" ref="host" class="art" viewBox="0 0 1200 900" role="img" aria-label="La centrale du futur : vue d'ensemble des cinq centrales">
      <defs>
        <filter id="silhouette" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feFlood flood-color="#9fb0bf" flood-opacity="0.75" result="c" />
          <feComposite in="c" in2="SourceAlpha" operator="in" result="fill" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="d" />
          <feComposite in="d" in2="SourceAlpha" operator="out" result="edge" />
          <feFlood flood-color="#6f8191" result="e" />
          <feComposite in="e" in2="edge" operator="in" result="stroke" />
          <feMerge><feMergeNode in="fill" /><feMergeNode in="stroke" /></feMerge>
        </filter>
        <clipPath id="reveal-clip"><rect class="reveal-rect" x="0" y="0" width="0" height="0" /></clipPath>
      </defs>
      <g v-html="markup" />
      <!-- impulsions d'énergie : du poste au pylône, puis vers Abidjan -->
      <g v-if="solvedCount" class="pulses" aria-hidden="true">
        <path id="ligne-abidjan" d="M1000.5,576 C1033,526 1068,482 1102.5,465 L1155,465 L1200,452" fill="none" stroke="none" />
        <circle v-for="i in solvedCount" :key="i" r="5" class="pulse">
          <animateMotion :dur="`${2.6}s`" :begin="`${(i - 1) * (2.6 / solvedCount)}s`" repeatCount="indefinite">
            <mpath href="#ligne-abidjan" />
          </animateMotion>
        </circle>
      </g>
      <!-- fumées, bulles, ligne de construction, impulsion vers Abidjan (GSAP) -->
      <g class="particles" aria-hidden="true" />
      <line class="reveal-scan" x1="0" y1="0" x2="0" y2="0" aria-hidden="true" />
      <circle class="energize-dot" cx="0" cy="0" r="9" aria-hidden="true" />
      <!-- étiquettes : invitent à toucher les centrales encore éteintes -->
      <g class="tags" aria-hidden="true">
        <g
          v-for="p in PLANTS.filter(q => boxes[q.id] && !solved[q.id])"
          :key="p.id"
          class="tag"
          :transform="`translate(${boxes[p.id].x} ${boxes[p.id].y})`"
          @click="emit('open', p.id)"
        >
          <g class="bob">
            <rect :x="-tagW(p) / 2" y="-30" :width="tagW(p)" height="34" rx="17" />
            <circle :cx="-tagW(p) / 2 + 18" cy="-13" r="6" :fill="p.color" />
            <text :x="-tagW(p) / 2 + 32" y="-6">{{ p.name }}</text>
          </g>
        </g>
      </g>
      <slot />
    </svg>
    <div v-else class="placeholder">Vue d'ensemble en cours de préparation…</div>
  </div>
</template>

<style scoped>
.scene { position: relative; width: 100%; }
.art { display: block; width: 100%; height: auto; border-radius: 18px; box-shadow: var(--shadow); background: #d8eef6; }
.placeholder { aspect-ratio: 4 / 3; display: grid; place-items: center; background: var(--surface); border-radius: 18px; color: var(--ink-2); }
.art :deep(.plant) { opacity: 0; transition: opacity 1.2s ease .2s; }
.art :deep(.plant.on) { opacity: 1; }
.art :deep(.sil) { opacity: 1; transition: opacity 1.2s ease; }
.art :deep(.plant.on + .sil) { opacity: 0; pointer-events: none; }
.art :deep(.sil:hover) { filter: url(#silhouette) brightness(1.05); }
.art.instant :deep(.plant), .art.instant :deep(.sil) { transition: none; }
.art :deep([id^="legende-"]:not(.on)) { opacity: .55; }
.art :deep([id^="legende-"]) { transition: opacity .6s; }
/* ciel vivant : nuages animés par GSAP ; soleil qui tourne lentement (silhouette comprise) */
.art :deep(.sun) { animation: turn 60s linear infinite; }
@keyframes turn { to { transform: rotate(360deg); } }
/* chaque centrale allumée s'anime ; à 5/5, la scène entière s'emballe */
.art :deep(.plant.on .sun) { animation: turn 40s linear infinite, glow 4s ease-in-out infinite; }
.art :deep(#hydrogene.on) { animation: h2 2.8s ease-in-out infinite; }
.art :deep(.sil) { animation: breathe 2.8s ease-in-out infinite; }
.art :deep(.plant.on + .sil) { animation: none; }
.pulse { fill: #ffd76a; stroke: #ed7f06; stroke-width: 2; }
.reveal-scan { stroke: #ed7f06; stroke-width: 4; stroke-linecap: round; opacity: 0; }
.energize-dot { fill: #fff3b0; stroke: #ed7f06; stroke-width: 3; opacity: 0; }
.tag { cursor: pointer; }
.tag .bob { animation: bob 2.8s ease-in-out infinite; }
.tag rect { fill: #fff; stroke: #1f2832; stroke-width: 3; }
.tag text { font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 19px; fill: #1f2832; }
.tag:hover rect { fill: #fff3d1; }
@keyframes glow { 0%, 100% { scale: 1; } 50% { scale: 1.07; } }
@keyframes h2 { 0%, 100% { filter: none; } 50% { filter: brightness(1.08) saturate(1.15); } }
@keyframes breathe { 0%, 100% { opacity: 1; } 50% { opacity: .72; } }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@media (prefers-reduced-motion: reduce) {
  .art :deep(.plant), .art :deep(.sil) { transition: none; }
  .art :deep(.rotor), .art :deep(.smoke), .art :deep(.sun), .art :deep(.cloud), .art :deep(.sil), .art :deep(#hydrogene), .tag .bob { animation: none !important; }
  .pulses { display: none; }
}
</style>
