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
const emit = defineEmits(['open', 'revealed'])
const tagW = p => 50 + p.name.length * 10.5
const { inner, has } = useArt()
const host = ref(null)
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

onMounted(() => nextTick(() => {
  decorate()
  if (props.reveal) {
    // laisse le temps de voir la silhouette avant la révélation
    setTimeout(() => { apply(false); setTimeout(() => emit('revealed'), 1600) }, 500)
  }
}))
watch(() => props.solved, () => apply(false), { deep: true })
watch(markup, () => nextTick(decorate))
</script>

<template>
  <div class="scene" :class="{ celebrate }">
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
/* ciel vivant : nuages qui dérivent, soleil qui tourne lentement (silhouette comprise) */
.art :deep(.cloud) { animation: drift 16s ease-in-out infinite alternate; }
.art :deep(.cloud-2) { animation-duration: 21s; animation-delay: -6s; }
.art :deep(.cloud-3) { animation-duration: 18s; animation-delay: -11s; }
.art :deep(.sun) { animation: turn 60s linear infinite; }
@keyframes drift { from { transform: translateX(-18px); } to { transform: translateX(22px); } }
@keyframes turn { to { transform: rotate(360deg); } }
/* chaque centrale allumée s'anime ; à 5/5, la scène entière s'emballe */
.art :deep(.plant.on .rotor) { animation: spin 7s linear infinite; }
.art :deep(.plant.on .smoke) { animation: puff 3.4s ease-in-out infinite; }
.art :deep(.plant.on .sun) { animation: turn 40s linear infinite, glow 4s ease-in-out infinite; }
.art :deep(#hydrogene.on) { animation: h2 2.8s ease-in-out infinite; }
.celebrate .art :deep(.plant.on .rotor) { animation-duration: 3.5s; }
.art :deep(.sil) { animation: breathe 2.8s ease-in-out infinite; }
.art :deep(.plant.on + .sil) { animation: none; }
.pulse { fill: #ffd76a; stroke: #ed7f06; stroke-width: 2; }
.tag { cursor: pointer; }
.tag .bob { animation: bob 2.8s ease-in-out infinite; }
.tag rect { fill: #fff; stroke: #1f2832; stroke-width: 3; }
.tag text { font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 19px; fill: #1f2832; }
.tag:hover rect { fill: #fff3d1; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes puff { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(-7px); opacity: .85; } }
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
