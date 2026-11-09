<script setup>
// Vue d'ensemble « La centrale du futur » (schéma 1:1 du client).
// Les cinq centrales sont en couleur dès le départ. Sur l'accueil (interactive),
// on touche une centrale pour la choisir. Au final (play), seule la centrale
// choisie démarre : balayage de mise en service, rotors, fumée, bulles, puis
// impulsion d'énergie vers Abidjan.
import { PLANTS } from '~/data/plants'

const props = defineProps({
  chosen: { type: String, default: null },     // centrale choisie par le joueur
  interactive: { type: Boolean, default: false }, // accueil : les centrales se touchent
  play: { type: Boolean, default: false },     // final : la centrale choisie démarre
  celebrate: { type: Boolean, default: false },
})
const emit = defineEmits(['open', 'revealed', 'energized'])
const tagW = p => 50 + p.name.length * 10.5
const { inner, has } = useArt()
const host = ref(null)
const sceneRoot = ref(null)
const { gsap, reduced, run, loop } = useGsap(sceneRoot)
const boxes = ref({}) // id → { x, y } (en unités du schéma 1200×900)
const running = ref(false) // la centrale choisie tourne
const ready = computed(() => has('ensemble'))
const markup = computed(() => inner('ensemble'))

function open (id) { if (props.interactive) emit('open', id) }

// Toutes les centrales en couleur ; seules les classes changent ensuite.
function decorate () {
  const root = host.value
  if (!root) return
  for (const g of root.querySelectorAll('[data-plant]')) {
    const id = g.getAttribute('data-plant')
    g.classList.add('plant', 'on')
    g.onclick = () => open(id)
  }
  // position des étiquettes : au-dessus de chaque centrale
  const b = {}
  for (const p of PLANTS) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity
    root.querySelectorAll(`[data-plant="${p.id}"]`).forEach((g) => {
      const r = g.getBBox()
      x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.width)
    })
    if (Number.isFinite(x0)) b[p.id] = { x: (x0 + x1) / 2, y: Math.max(y0 - 10, 40) }
  }
  // le soleil fait partie du solaire mais est loin des panneaux : étiquette sur les panneaux
  if (b.solaire) b.solaire = { x: 970, y: 640 }
  boxes.value = b
  // légende : pastilles cliquables
  for (const p of PLANTS) {
    const l = root.querySelector(`#legende-${p.id}`)
    if (l) l.onclick = () => open(p.id)
  }
  apply()
}

function apply () {
  const root = host.value
  if (!root) return
  for (const p of PLANTS) {
    const mine = p.id === props.chosen
    root.querySelectorAll(`[data-plant="${p.id}"]`).forEach((g) => {
      g.classList.toggle('running', mine && running.value)
      g.classList.toggle('chosen', mine && !props.interactive)
    })
    root.querySelector(`#legende-${p.id}`)?.classList.toggle('chosen', mine && !props.interactive)
  }
}

// ------------------------------------------------------------ animations (GSAP)
const plantGroups = id => [...(host.value?.querySelectorAll(`[data-plant="${id}"]`) || [])]
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

// La centrale démarre : pales qui accélèrent, fumée, bulles d'hydrogène
function startPlant (id) {
  if (reduced.value) return
  run(() => {
    for (const g of plantGroups(id)) {
      g.querySelectorAll('.rotor').forEach((rotor) => {
        const o = (rotor.style.transformOrigin || '').match(/[\d.]+/g)
        rotor.style.transformOrigin = ''
        const anim = loop(gsap.to(rotor, { rotation: '+=360', svgOrigin: o ? `${o[0]} ${o[1]}` : '50% 50%', duration: 7, ease: 'none', repeat: -1 }))
        gsap.fromTo(anim, { timeScale: 0 }, { timeScale: props.celebrate ? 2 : 1, duration: 3.2, ease: 'power1.in' })
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

// Mise en service : une ligne orange balaie la centrale (déjà en couleur), un
// halo l'entoure, puis elle démarre et envoie l'énergie vers Abidjan.
function startUp (id) {
  const root = host.value
  const groups = plantGroups(id)
  if (!root || !groups.length || reduced.value) {
    running.value = true
    apply()
    emit('revealed')
    emit('energized')
    return
  }
  const b = bboxOf(groups)
  const pad = 14
  run(() => {
    const scan = root.querySelector('.reveal-scan')
    const tl = gsap.timeline({ delay: 0.6 })
    tl.call(() => groups.forEach(g => g.classList.add('boot')))
      .fromTo(scan, { attr: { x1: b.x0 - pad, x2: b.x1 + pad, y1: b.y1 + pad, y2: b.y1 + pad }, opacity: 1 },
        { attr: { y1: b.y0 - pad, y2: b.y0 - pad }, duration: 1.7, ease: 'power2.inOut' })
      .to(scan, { opacity: 0, duration: 0.35 })
      .call(() => {
        running.value = true
        apply()
        startPlant(id)
        emit('revealed')
      })
      .call(() => groups.forEach(g => g.classList.remove('boot')), null, '+=1.2')
      .add(energize(), '-=0.6')
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
let started = false
function maybeStart () {
  if (!mounted || started || !props.play || !props.chosen) return
  started = true
  startUp(props.chosen)
}
onMounted(() => nextTick(() => {
  decorate()
  driftClouds()
  mounted = true
  maybeStart()
}))
watch(() => [props.play, props.chosen], maybeStart)
watch(() => [props.chosen, props.interactive], () => apply())
watch(() => props.celebrate, on => rotorAnims.forEach(a => gsap.to(a, { timeScale: on ? 2 : 1, duration: 1.5 })))
watch(markup, () => nextTick(decorate))
</script>

<template>
  <div ref="sceneRoot" class="scene" :class="{ celebrate, interactive }">
    <svg v-if="ready" ref="host" class="art" viewBox="0 0 1200 900" role="img" aria-label="La centrale du futur : vue d'ensemble des cinq centrales">
      <g v-html="markup" />
      <!-- impulsions d'énergie : du poste au pylône, puis vers Abidjan -->
      <path id="ligne-abidjan" d="M1000.5,576 C1033,526 1068,482 1102.5,465 L1155,465 L1200,452" fill="none" stroke="none" />
      <g v-if="running" class="pulses" aria-hidden="true">
        <circle v-for="i in 3" :key="i" r="5" class="pulse">
          <animateMotion dur="2.6s" :begin="`${(i - 1) * (2.6 / 3)}s`" repeatCount="indefinite">
            <mpath href="#ligne-abidjan" />
          </animateMotion>
        </circle>
      </g>
      <!-- fumées, bulles, ligne de mise en service, impulsion vers Abidjan (GSAP) -->
      <g class="particles" aria-hidden="true" />
      <line class="reveal-scan" x1="0" y1="0" x2="0" y2="0" aria-hidden="true" />
      <circle class="energize-dot" cx="0" cy="0" r="9" aria-hidden="true" />
      <!-- étiquettes : invitent à choisir une centrale -->
      <g v-if="interactive" class="tags" aria-hidden="true">
        <g
          v-for="p in PLANTS.filter(q => boxes[q.id])"
          :key="p.id"
          class="tag"
          :transform="`translate(${boxes[p.id].x} ${boxes[p.id].y})`"
          @click="open(p.id)"
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
.interactive .art :deep(.plant),
.interactive .art :deep([id^="legende-"]) { cursor: pointer; }
.interactive .art :deep(.plant:hover) { filter: brightness(1.06); }
.art :deep([id^="legende-"]) { transition: opacity .6s; }
/* au final, la légende met en avant la centrale choisie */
.scene:not(.interactive) .art :deep([id^="legende-"]:not(.chosen)) { opacity: .55; }
/* seule la centrale choisie s'anime, une fois mise en service */
.art :deep(.plant.running .sun) { animation: turn 40s linear infinite, glow 4s ease-in-out infinite; }
.art :deep(#hydrogene.running) { animation: h2 2.8s ease-in-out infinite; }
.art :deep(.plant.boot) { animation: boot 1.4s ease-in-out 2; }
@keyframes turn { to { transform: rotate(360deg); } }
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
@keyframes boot { 0%, 100% { filter: none; } 50% { filter: brightness(1.2); } }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
/* sur la borne (classe kiosk), le final reste animé même si Windows réduit les animations */
@media (prefers-reduced-motion: reduce) {
  html:not(.kiosk) .art :deep(.rotor), html:not(.kiosk) .art :deep(.smoke), html:not(.kiosk) .art :deep(.sun), html:not(.kiosk) .art :deep(.cloud), html:not(.kiosk) .art :deep(#hydrogene), html:not(.kiosk) .art :deep(.plant), html:not(.kiosk) .tag .bob { animation: none !important; }
  html:not(.kiosk) .pulses { display: none; }
}
</style>
