<script setup>
import { PLANT_BY_ID } from '~/data/plants'
import { BADGE_BY_ID, formatTime, formatKwh } from '~/composables/useGame'

const route = useRoute()
const plant = PLANT_BY_ID[route.params.id]
if (!plant) throw createError({ statusCode: 404, statusMessage: 'Centrale inconnue' })

useHead({ title: `${plant.name} — La centrale du futur` })

const game = useGame()
const { state } = game
const solvedBefore = computed(() => game.isSolved(plant.id))
const board = ref(null)
const { play } = useSound()

// ---------- Chrono (en pause quand l'onglet est caché) et erreurs
const elapsed = ref(0)
const errors = ref(0)
const hintsUsed = ref(0)
const done = ref(false)
let timer, last
onMounted(() => {
  const a = state.value.attempt
  if (a && a.id === plant.id) { elapsed.value = a.elapsed; errors.value = a.errors; hintsUsed.value = a.hints }
  last = performance.now()
  timer = setInterval(() => {
    const now = performance.now()
    if (!done.value && document.visibilityState === 'visible') elapsed.value += (now - last) / 1000
    last = now
  }, 250)
})
onBeforeUnmount(() => clearInterval(timer))
watch([elapsed, errors, hintsUsed], () => {
  if (!done.value && !solvedBefore.value) state.value.attempt = { id: plant.id, elapsed: elapsed.value, errors: errors.value, hints: hintsUsed.value }
})

// ---------- Annonces pour lecteurs d'écran et retours visuels
const message = ref('')
const picked = ref(null) // nom de la pièce tenue, affiché en grand (lisible sur téléphone)
const placedCount = ref(0)

// ---------- Guide : technicienne CIPREL (règles au premier puzzle, puis encouragements)
const TIPS = [
  { text: 'Bienvenue ! Glisse les 6 pièces du bac sur le plateau pour reconstituer le schéma (au clavier : Tab, Entrée, puis les flèches).', pose: 'wave' },
  { text: 'Les formes des pièces peuvent tromper : suis plutôt les tuyaux, les câbles et les flux d’énergie.', pose: 'point' },
  { text: 'Je ne vérifie qu’une fois le plateau plein : les bonnes pièces se verrouillent, les autres reviennent au bac.', pose: 'think' },
]
const tip = ref(0)
const narrow = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(max-width: 560px)')
  narrow.value = mq.matches
  mq.addEventListener('change', e => { narrow.value = e.matches })
})
const event = ref(null) // message lié à une action du joueur
const guide = computed(() => {
  if (!state.value.onboarded) return TIPS[tip.value]
  if (event.value) return event.value
  if (placedCount.value === 0) return { text: `Centrale ${plant.name} : à toi de jouer ! Touche une pièce pour la voir en grand.`, pose: 'idle' }
  if (placedCount.value < 6) return { text: `${placedCount.value} pièce${placedCount.value > 1 ? 's' : ''} sur 6. Continue, je vérifie quand le plateau est plein.`, pose: 'idle' }
  return { text: 'Vérification…', pose: 'think' }
})
function nextTip () {
  if (tip.value < TIPS.length - 1) tip.value++
  else state.value.onboarded = true
}
function replayTips () { tip.value = 0; state.value.onboarded = false }
let eventTimer
function say (text, pose, ms = 4500) {
  event.value = { text, pose }
  clearTimeout(eventTimer)
  eventTimer = setTimeout(() => { event.value = null }, ms)
}
const flash = ref(null) // { kind: 'ok' | 'bad', text }
let flashTimer
function showFlash (kind, text) {
  flash.value = { kind, text }
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flash.value = null }, 2200)
}
function onValidate ({ wrong }) {
  if (wrong) {
    errors.value += wrong
    showFlash('bad', `${wrong} pièce${wrong > 1 ? 's' : ''} mal placée${wrong > 1 ? 's' : ''}`)
    say(`Presque ! ${wrong} pièce${wrong > 1 ? 's sont reparties' : ' est repartie'} au bac. Celles qui restent sont justes.`, 'think')
  } else {
    showFlash('ok', 'Schéma reconstitué !')
    say('Bravo ! Regarde l’énergie circuler dans le schéma.', 'cheer', 8000)
  }
}
function vibrate (ms) { try { navigator.vibrate?.(ms) } catch { /* non pris en charge */ } }

function askHint () {
  if (!game.spendHint()) return
  hintsUsed.value += 1
  board.value?.hint()
  vibrate(20)
}

// ---------- Fin du puzzle
const result = ref(null)
const showResult = ref(false)
function onComplete () {
  done.value = true
  vibrate([30, 40, 30])
  setTimeout(() => play('complete'), 350)
  result.value = game.complete(plant.id, { time: elapsed.value, errors: errors.value, hints: hintsUsed.value })
  setTimeout(() => { showResult.value = true }, 900)
}
const factRead = ref(false)
// fiche dépliée d'office sur grand écran, repliée sur téléphone (fenêtre plus courte)
const wide = ref(true)
onMounted(() => { wide.value = window.matchMedia('(min-width: 640px)').matches })
function readFact () {
  if (factRead.value) return
  factRead.value = true
  const got = game.readFact(plant.id)
  if (got.length) result.value.badges.push(...got)
}
function goOverview () {
  if (!factRead.value) game.readFact(plant.id)
  navigateTo('/')
}
function replay () {
  showResult.value = false
  result.value = null
  done.value = false
  elapsed.value = 0; errors.value = 0; hintsUsed.value = 0
  factRead.value = false
  boardKey.value++
}
const boardKey = ref(0)
</script>

<template>
  <div class="page">
    <header class="bar">
      <NuxtLink to="/" class="btn ghost icon" aria-label="Retour à la vue d'ensemble">
        <AppIcon name="back" />
      </NuxtLink>
      <div class="title">
        <h1>{{ plant.name }}</h1>
        <div class="gauge" role="img" :aria-label="`${placedCount} pièce${placedCount > 1 ? 's' : ''} posée${placedCount > 1 ? 's' : ''} sur 6`">
          <span v-for="i in 6" :key="i" class="pip" :class="{ on: i <= placedCount }" />
          <span class="gauge-text">{{ placedCount }}/6</span>
        </div>
      </div>
      <div class="stats" aria-live="off">
        <span class="chip" :title="'Temps'"><AppIcon name="clock" :size="18" /><span class="sr-only">Temps </span>{{ formatTime(elapsed) }}</span>
        <span class="chip" :class="{ bad: errors }"><AppIcon name="cross" :size="18" /><span class="sr-only">Erreurs </span>{{ errors }}</span>
        <SoundToggle />
        <button
          class="btn energy hint"
          type="button"
          :disabled="state.hints <= 0 || done"
          :aria-label="`Coup de pouce, ${state.hints} jeton${state.hints > 1 ? 's' : ''} : place une pièce (−100 kWh)`"
          @click="askHint"
        >
          <AppIcon name="bulb" :size="18" />
          <span class="hint-label">Coup de pouce</span>
          <span class="count">{{ state.hints }}</span>
        </button>
      </div>
    </header>

    <div class="guide-row">
      <ClientOnly>
        <!-- sur téléphone : bandeau compact, pour laisser la place au plateau -->
        <div v-if="narrow" class="tip-strip" aria-live="polite">
          <CiprelTechnician variant="femme" :pose="guide.pose" :size="46" />
          <p>{{ guide.text }}</p>
        </div>
        <GuideBubble v-else :text="guide.text" variant="femme" :pose="guide.pose" side="left" :size="80" />
      </ClientOnly>
      <div v-if="!state.onboarded" class="guide-actions">
        <button class="btn" type="button" @click="nextTip">{{ tip < TIPS.length - 1 ? 'Suivant' : 'C’est parti !' }}</button>
      </div>
      <button v-else class="btn ghost icon help-btn" type="button" aria-label="Revoir les règles" @click="replayTips"><AppIcon name="info" /></button>
    </div>

    <main class="stage">
      <!-- mélange aléatoire : rendu côté navigateur uniquement -->
      <ClientOnly>
        <PuzzleBoard
          :key="boardKey"
          ref="board"
          :plant="plant"
          @validate="onValidate"
          @complete="onComplete"
          @announce="message = $event"
          @pick="picked = $event"
          @progress="placedCount = $event"
        />
      </ClientOnly>
      <Transition name="flash">
        <div v-if="flash" class="flash" :class="flash.kind" role="status">{{ flash.text }}</div>
        <div v-else-if="picked" class="flash picked" aria-hidden="true">{{ picked }}</div>
      </Transition>
    </main>
    <p class="sr-only" aria-live="polite">{{ message }}</p>

    <AppDialog :open="showResult" :title="result?.replay ? 'Puzzle rejoué' : `${plant.name} : centrale assemblée !`" :closable="false" wide>
      <div v-if="result" class="result">
        <div class="score-row">
          <StarRating :value="result.stars" :size="30" />
          <div class="nums">
            <span class="chip"><AppIcon name="clock" :size="18" />{{ formatTime(elapsed) }}</span>
            <span class="chip"><AppIcon name="cross" :size="18" />{{ errors }} erreur{{ errors > 1 ? 's' : '' }}</span>
          </div>
        </div>

        <div v-if="!result.replay" class="kwh">
          <p class="kwh-total"><AppIcon name="bolt" :size="22" /> +{{ formatKwh(result.kwh) }}</p>
          <ul class="lines">
            <li v-for="l in result.lines" :key="l.label"><span>{{ l.label }}</span><span>{{ l.value > 0 ? '+' : '' }}{{ l.value }}</span></li>
            <li v-if="result.mult > 1" class="mult"><span>Série verte</span><span>×{{ String(result.mult).replace('.', ',') }}</span></li>
          </ul>
        </div>
        <p v-else class="replay-note">Les kWh restent ceux de votre première réussite ; seules les étoiles peuvent progresser.</p>

        <div v-if="result.badges.length" class="new-badges">
          <p class="label">Nouvelles récompenses</p>
          <ul>
            <li v-for="b in result.badges" :key="b">
              <BadgeIcon :id="b" :size="44" />
              <div><strong>{{ BADGE_BY_ID[b].name }}</strong><span>{{ BADGE_BY_ID[b].desc }}</span></div>
            </li>
          </ul>
        </div>

        <details class="fact" :open="wide" @toggle="($event.target.open) && readFact()">
          <summary><AppIcon name="book" :size="18" /> Le saviez-vous ? <span class="fact-title">{{ plant.fact.title }}</span></summary>
          <ol>
            <li v-for="(s, i) in plant.fact.steps" :key="i">{{ s }}</li>
          </ol>
        </details>

        <div class="actions">
          <button class="btn ghost" type="button" @click="replay"><AppIcon name="refresh" :size="18" />Rejouer</button>
          <button class="btn" type="button" @click="goOverview">Voir la centrale s'allumer</button>
        </div>
      </div>
    </AppDialog>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100dvh; padding: 10px 16px 12px; gap: 8px; max-width: 1600px; margin: 0 auto; }
.bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.title { flex: 1; min-width: 140px; }
.title { display: flex; align-items: center; gap: 6px 16px; flex-wrap: wrap; }
.title h1 { font-size: clamp(1.4rem, 3.2vw, 2rem); font-weight: 800; color: var(--navy); }
.gauge { display: inline-flex; align-items: center; gap: 4px; }
.pip { width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid var(--ink); background: var(--surface); transition: background .25s var(--ease-out), transform .25s var(--ease-out); }
.pip.on { background: var(--orange); transform: scale(1.08); }
.gauge-text { margin-left: 6px; font-family: var(--font-display); font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ink-2); }
.stats { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.chip.bad { color: var(--bad); border-color: #e7b8b3; }
.hint .count { background: rgba(255, 255, 255, .7); border-radius: 999px; min-width: 24px; padding: 0 6px; font-variant-numeric: tabular-nums; }
.guide-row { display: flex; align-items: center; gap: 12px; min-height: 64px; }
.guide-row > :first-child { flex: 0 1 auto; min-width: 0; }
.guide-actions { flex: none; }
.tip-strip { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 2px solid var(--ink); border-radius: 18px; padding: 4px 12px 4px 4px; }
.tip-strip p { font-weight: 700; font-size: .92rem; line-height: 1.3; }
.stage { position: relative; flex: 1; min-height: 0; }
.flash {
  position: absolute; left: 50%; top: 10px; transform: translateX(-50%);
  padding: .55rem 1.1rem; border-radius: 999px; font-weight: 700; color: #fff;
  box-shadow: var(--shadow); pointer-events: none;
}
.flash.ok { background: var(--ok); }
.flash.bad { background: var(--bad); }
.flash.picked { background: var(--ink); font-size: 1.05rem; }
.flash-enter-active, .flash-leave-active { transition: opacity .25s, transform .25s; }
.flash-enter-from, .flash-leave-to { opacity: 0; transform: translate(-50%, -8px); }

@media (max-width: 560px) {
  .page { padding: 8px 12px 10px; }
  .hint-label { display: none; }
  .guide-row { align-items: center; min-height: 0; }
  .guide-actions .btn { min-height: 44px; padding: .4rem .9rem; font-size: .95rem; }
}

.result { display: grid; gap: 16px; }
.score-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.nums { display: flex; gap: 8px; }
.kwh { background: #fff3d1; border: 2px solid #f3d27a; border-radius: var(--radius); padding: 14px 16px; }
.kwh-total { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--energy-ink); }
.lines { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 4px; font-variant-numeric: tabular-nums; }
.lines li { display: flex; justify-content: space-between; color: var(--ink-2); }
.lines .mult { color: var(--ok); font-weight: 600; }
.replay-note { color: var(--ink-2); }
.label { display: flex; align-items: center; gap: 6px; font-size: .8rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--ink-2); }
.new-badges ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 10px; }
.new-badges li { display: flex; align-items: center; gap: 12px; }
.new-badges li div { display: grid; }
.new-badges span { color: var(--ink-2); font-size: .92rem; }
.fact { background: var(--cream); border: 2px solid #f1dfba; border-radius: var(--radius); padding: 12px 16px; }
.fact summary { cursor: pointer; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; color: var(--orange-ink); list-style-position: inside; }
.fact-title { color: var(--ink); }
.fact ol { margin: 10px 0 2px; padding-left: 1.2rem; display: grid; gap: 6px; }
.actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
</style>
