<script setup>
// Puzzle de la centrale choisie : 2 minutes au compte à rebours.
// Réussite : bilan puis final sur l'accueil. Temps écoulé : message d'échec.
import { PLANT_BY_ID } from '~/data/plants'
import { RULES, formatTime, formatKwh } from '~/composables/useGame'

// seule la centrale choisie sur l'accueil se joue, pendant sa partie
definePageMeta({
  middleware: (to) => {
    const { state } = useGame()
    const s = state.value
    if (s.chosen !== to.params.id || !['puzzle', 'won', 'failed'].includes(s.phase)) return navigateTo('/', { replace: true })
  },
})

const route = useRoute()
const plant = PLANT_BY_ID[route.params.id]
if (!plant) throw createError({ statusCode: 404, statusMessage: 'Centrale inconnue' })

useHead({ title: `${plant.name} — La centrale du futur` })

const game = useGame()
const { state } = game
const hold = useIdleHold()
const { play } = useSound()

// ---------- Compte à rebours : il démarre au « C'est parti ! », s'arrête dès le plateau juste
const elapsed = ref(0)
const errors = ref(0)
const started = ref(false)
const stopped = ref(false)
const timeUp = ref(false)
const remaining = computed(() => Math.max(0, RULES.duration - elapsed.value))
const shown = computed(() => formatTime(Math.ceil(remaining.value))) // 1:59 dès la première seconde entamée
const urgent = computed(() => started.value && !stopped.value && remaining.value <= 20)
let timer, last
onMounted(() => {
  last = performance.now()
  timer = setInterval(() => {
    const now = performance.now()
    if (started.value && !stopped.value && document.visibilityState === 'visible') {
      elapsed.value = Math.min(RULES.duration, elapsed.value + (now - last) / 1000)
      if (elapsed.value >= RULES.duration) onTimeUp()
    }
    last = now
  }, 200)
})
onBeforeUnmount(() => { clearInterval(timer); hold.value = false })
// le compte à rebours suffit : pas de retour à l'accueil pour inactivité pendant le puzzle
watch([started, stopped], ([s, st]) => { hold.value = s && !st })
// dernières secondes : un bip par seconde
watch(() => Math.ceil(remaining.value), (n, o) => {
  if (started.value && !stopped.value && n < o && n <= 10 && n > 0) play('tick')
})

function begin () {
  if (started.value) return
  state.value.onboarded = true
  started.value = true
  last = performance.now()
  play('snap')
}

// ---------- Annonces pour lecteurs d'écran et retours visuels
const message = ref('')
const picked = ref(null) // nom de la pièce tenue, affiché en grand (lisible sur téléphone)
const placedCount = ref(0)

// ---------- Guide : technicienne CIPREL (règles à chaque partie, puis encouragements)
const TIPS = [
  { text: `Tu as ${formatTime(RULES.duration)} pour reconstituer la centrale ${plant.name} : glisse les 6 pièces du bac sur le plateau.`, pose: 'wave' },
  { text: 'Chaque tenon montre ce qui passe d’un composant au suivant (rond : fluide, flèche : énergie, clé : matière, queue d’aronde : mouvement), et il pointe dans le sens du flux.', pose: 'point' },
  { text: 'Je vérifie une fois le plateau plein : les bonnes pièces se verrouillent, les autres reviennent au bac. Le chrono démarre quand tu es prêt !', pose: 'think' },
]
const tip = ref(0)
const narrow = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(max-width: 560px)')
  narrow.value = mq.matches
  mq.addEventListener('change', (e) => { narrow.value = e.matches })
})
const event = ref(null) // message lié à une action du joueur
const guide = computed(() => {
  if (timeUp.value) return { text: 'Temps écoulé ! La centrale n’a pas pu être assemblée à temps.', pose: 'think' }
  if (!started.value) return TIPS[tip.value]
  if (event.value) return event.value
  if (stopped.value) return { text: `Centrale ${plant.name} assemblée : l’énergie circule d’un composant à l’autre !`, pose: 'cheer' }
  if (urgent.value) return { text: `Plus que ${Math.ceil(remaining.value)} secondes, vite !`, pose: 'point' }
  if (placedCount.value === 0) return { text: 'Suis le trajet de l’énergie, d’un tenon à l’autre. Touche une pièce pour la voir en grand.', pose: 'idle' }
  if (placedCount.value < 6) return { text: `${placedCount.value} pièce${placedCount.value > 1 ? 's' : ''} sur 6. Continue, je vérifie quand le plateau est plein.`, pose: 'idle' }
  return { text: 'Vérification…', pose: 'think' }
})
function nextTip () {
  if (tip.value < TIPS.length - 1) tip.value++
  else begin()
}
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
    // le chrono s'arrête ici : « complete » n'arrive que 450 ms plus tard
    stopped.value = true
    showFlash('ok', 'Schéma reconstitué !')
    say('Bravo ! Regarde l’énergie circuler dans le schéma.', 'cheer', 8000)
  }
}
function vibrate (ms) { try { navigator.vibrate?.(ms) } catch { /* non pris en charge */ } }

// ---------- Fin du puzzle
const result = ref(null)
const showResult = ref(false)
function onComplete () {
  vibrate([30, 40, 30])
  setTimeout(() => play('complete'), 350)
  result.value = game.win({ time: elapsed.value, errors: errors.value })
  setTimeout(() => { showResult.value = true }, 900)
}
// 0:00 juste après la 6e pièce : la vérification du plateau (380 ms plus tard)
// tranche d'abord, pour qu'un plateau juste ne s'affiche pas en échec
let timeUpPending = false
function onTimeUp () {
  if (stopped.value || timeUpPending) return
  if (placedCount.value === 6) {
    timeUpPending = true
    setTimeout(() => { timeUpPending = false; if (!stopped.value) fail() }, 700)
    return
  }
  fail()
}
function fail () {
  stopped.value = true
  timeUp.value = true
  game.fail()
  play('fail')
  vibrate(200)
  setTimeout(() => { showFail.value = true }, 600)
}
const showFail = ref(false)

const wide = ref(true) // fiche dépliée d'office sur grand écran
onMounted(() => { wide.value = window.matchMedia('(min-width: 640px)').matches })
function goFinale () {
  game.toFinale()
  navigateTo('/')
}
function goHome () { navigateTo('/') } // l'accueil remet la partie à zéro

// ---------- Abandon
const confirmQuit = ref(false)
</script>

<template>
  <div class="page">
    <header class="bar">
      <button class="btn ghost icon" type="button" aria-label="Abandonner la partie" @click="stopped ? goHome() : (confirmQuit = true)">
        <AppIcon name="back" />
      </button>
      <div class="title">
        <h1>{{ plant.name }}</h1>
        <div class="gauge" role="img" :aria-label="`${placedCount} pièce${placedCount > 1 ? 's' : ''} posée${placedCount > 1 ? 's' : ''} sur 6`">
          <span v-for="i in 6" :key="i" class="pip" :class="{ on: i <= placedCount }" />
          <span class="gauge-text">{{ placedCount }}/6</span>
        </div>
      </div>
      <div class="stats" aria-live="off">
        <span
          class="countdown"
          :class="{ urgent, over: timeUp, idle: !started }"
          role="timer"
          :aria-label="`Temps restant : ${shown}`"
        ><AppIcon name="clock" :size="26" />{{ shown }}</span>
        <span class="chip" :class="{ bad: errors }"><AppIcon name="cross" :size="18" /><span class="sr-only">Erreurs </span>{{ errors }}</span>
        <SoundToggle />
      </div>
    </header>

    <div class="guide-row">
      <!-- sur téléphone : bandeau compact, pour laisser la place au plateau -->
      <div v-if="narrow" class="tip-strip" aria-live="polite">
        <CiprelTechnician variant="femme" :pose="guide.pose" :size="46" />
        <p>{{ guide.text }}</p>
      </div>
      <GuideBubble v-else :text="guide.text" variant="femme" :pose="guide.pose" side="left" :size="80" />
      <div v-if="!started" class="guide-actions">
        <button class="btn" type="button" @click="nextTip">{{ tip < TIPS.length - 1 ? 'Suivant' : 'C’est parti !' }}</button>
      </div>
      <FlowLegend :edges="plant.edges" :compact="narrow" class="legend-row" />
    </div>

    <main class="stage">
      <PuzzleBoard
        :plant="plant"
        :disabled="!started || timeUp"
        @validate="onValidate"
        @complete="onComplete"
        @announce="message = $event"
        @pick="picked = $event"
        @progress="placedCount = $event"
      />
      <!-- le chrono ne démarre qu'à la demande du joueur -->
      <div v-if="!started" class="start">
        <button class="btn start-btn" type="button" @click="begin">
          <AppIcon name="clock" :size="26" />C’est parti ! {{ formatTime(RULES.duration) }}
        </button>
      </div>
      <Transition name="flash" mode="out-in">
        <div v-if="flash" key="flash" class="flash" :class="flash.kind" role="status">{{ flash.text }}</div>
        <div v-else-if="picked" key="picked" class="flash picked" aria-hidden="true">{{ picked }}</div>
      </Transition>
    </main>
    <p class="sr-only" aria-live="polite">{{ message }}</p>

    <!-- réussite -->
    <AppDialog :open="showResult" :title="`${plant.name} : centrale assemblée !`" :closable="false" wide>
      <div v-if="result" class="result">
        <div class="score-row">
          <StarRating :value="result.stars" :size="30" />
          <div class="nums">
            <span class="chip"><AppIcon name="clock" :size="18" />{{ formatTime(result.time) }}</span>
            <span class="chip"><AppIcon name="cross" :size="18" />{{ result.errors }} erreur{{ result.errors > 1 ? 's' : '' }}</span>
          </div>
        </div>

        <div class="kwh">
          <p class="kwh-total"><AppIcon name="bolt" :size="22" /> {{ formatKwh(result.kwh) }}</p>
          <ul class="lines">
            <li v-for="l in result.lines" :key="l.label"><span>{{ l.label }}</span><span>+{{ l.value }}</span></li>
          </ul>
        </div>

        <details class="fact" :open="wide">
          <summary><AppIcon name="book" :size="18" /> Le saviez-vous ? <span class="fact-title">{{ plant.fact.title }}</span></summary>
          <ol>
            <li v-for="(s, i) in plant.fact.steps" :key="i">{{ s }}</li>
          </ol>
        </details>

        <div class="actions">
          <button class="btn" type="button" @click="goFinale"><AppIcon name="bolt" :size="18" />Voir la centrale alimenter Abidjan</button>
        </div>
      </div>
    </AppDialog>

    <!-- échec : temps écoulé -->
    <AppDialog :open="showFail" title="Échec : temps écoulé" :closable="false">
      <div class="fail">
        <div class="fail-body">
          <CiprelTechnician variant="femme" pose="think" :size="110" />
          <p>Le puzzle n’a pas été terminé dans les {{ formatTime(RULES.duration) }}. La centrale {{ plant.name }} n’a pas pu alimenter Abidjan cette fois-ci.</p>
        </div>
        <div class="actions">
          <button class="btn" type="button" @click="goHome"><AppIcon name="refresh" :size="18" />Nouvelle partie</button>
        </div>
      </div>
    </AppDialog>

    <!-- abandon -->
    <AppDialog :open="confirmQuit" title="Abandonner la partie ?" @close="confirmQuit = false">
      <p>Le chrono continue pendant que vous décidez. En abandonnant, la partie s’arrête sans score.</p>
      <div class="actions">
        <button class="btn ghost" type="button" @click="confirmQuit = false">Continuer</button>
        <button class="btn" type="button" @click="goHome">Abandonner</button>
      </div>
    </AppDialog>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100dvh; padding: 10px 16px 12px; gap: 8px; max-width: 1600px; margin: 0 auto; }
.bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.title { flex: 1; min-width: 140px; display: flex; align-items: center; gap: 6px 16px; flex-wrap: wrap; }
.title h1 { font-size: clamp(1.4rem, 3.2vw, 2rem); font-weight: 800; color: var(--navy); }
.gauge { display: inline-flex; align-items: center; gap: 4px; }
.pip { width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid var(--ink); background: var(--surface); transition: background .25s var(--ease-out), transform .25s var(--ease-out); }
.pip.on { background: var(--orange); transform: scale(1.08); }
.gauge-text { margin-left: 6px; font-family: var(--font-display); font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ink-2); }
.stats { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.chip.bad { color: var(--bad); border-color: #e7b8b3; }
/* compte à rebours : bien visible, rouge et pulsant dans les 20 dernières secondes */
.countdown {
  display: inline-flex; align-items: center; gap: 8px; min-height: 52px; padding: .2rem 1.1rem;
  border-radius: 999px; border: 3px solid var(--ink); background: var(--surface);
  font-family: var(--font-display); font-weight: 800; font-size: 1.8rem; line-height: 1; font-variant-numeric: tabular-nums; color: var(--navy);
}
.countdown.idle { color: var(--ink-2); }
.countdown.urgent { background: var(--bad); color: #fff; animation: pulse 1s ease-in-out infinite; }
.countdown.over { background: var(--bad); color: #fff; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
.guide-row { display: flex; align-items: center; gap: 12px; min-height: 64px; }
.guide-row > :first-child { flex: 0 1 auto; min-width: 0; }
.guide-actions { flex: none; }
.legend-row { margin-left: auto; justify-content: flex-end; max-width: 46%; }
.tip-strip { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 2px solid var(--ink); border-radius: 18px; padding: 4px 12px 4px 4px; }
.tip-strip p { font-weight: 700; font-size: .92rem; line-height: 1.3; }
.stage { position: relative; flex: 1; min-height: 0; }
.start { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.start-btn { pointer-events: auto; min-height: 76px; padding: .6rem 2rem; font-size: 1.6rem; box-shadow: var(--shadow-lift); animation: invite 1.6s ease-in-out infinite; }
@keyframes invite { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
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
  .countdown { font-size: 1.4rem; min-height: 44px; }
  .guide-row { align-items: center; min-height: 0; flex-wrap: wrap; row-gap: 6px; }
  .guide-row > :first-child { flex: 1 1 100%; }
  .legend-row { margin-left: 0; max-width: none; justify-content: flex-start; order: 3; flex: 1 1 0; }
  .guide-actions .btn { min-height: 44px; padding: .4rem .9rem; font-size: .95rem; }
  .start-btn { font-size: 1.25rem; min-height: 60px; }
}

.result { display: grid; gap: 16px; }
.score-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.nums { display: flex; gap: 8px; }
.kwh { background: #fff3d1; border: 2px solid #f3d27a; border-radius: var(--radius); padding: 14px 16px; }
.kwh-total { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--energy-ink); }
.lines { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 4px; font-variant-numeric: tabular-nums; }
.lines li { display: flex; justify-content: space-between; color: var(--ink-2); }
.fact { background: var(--cream); border: 2px solid #f1dfba; border-radius: var(--radius); padding: 12px 16px; }
.fact summary { cursor: pointer; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; color: var(--orange-ink); list-style-position: inside; }
.fact-title { color: var(--ink); }
.fact ol { margin: 10px 0 2px; padding-left: 1.2rem; display: grid; gap: 6px; }
.fail { display: grid; gap: 16px; }
.fail-body { display: flex; align-items: center; gap: 16px; font-size: 1.05rem; }
.actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
</style>
