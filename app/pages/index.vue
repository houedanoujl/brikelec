<script setup>
// Accueil de la borne.
// - choose : les cinq centrales en couleur ; le joueur en choisit UNE à assembler.
// - finale : après la réussite, seule la centrale choisie démarre et alimente
//   Abidjan à 100 % ; bilan, pseudo et classement.
import { PLANTS, PLANT_BY_ID } from '~/data/plants'
import { RULES, formatTime, formatKwh } from '~/composables/useGame'
import { cleanName } from '~/composables/useLeaderboard'
import { KIOSK, prefersReducedMotion } from '~/utils/kiosk'

const game = useGame()
const { state } = game
const leaderboard = useLeaderboard()
const hold = useIdleHold()
const { play } = useSound()

// arrivée sur l'accueil pendant ou après un puzzle (abandon, échec, inactivité) : nouvelle partie
if (state.value.phase !== 'choose' && state.value.phase !== 'finale') game.reset({ remount: false })
const finale = computed(() => state.value.phase === 'finale')
const chosen = computed(() => PLANT_BY_ID[state.value.chosen] || null)
const result = computed(() => state.value.result)

// ---------- Choix de la centrale
const pending = ref(null) // centrale en attente de confirmation
function ask (id) {
  if (finale.value || !PLANT_BY_ID[id]) return
  pending.value = PLANT_BY_ID[id]
  play('pick')
}
function start () {
  const id = pending.value.id
  pending.value = null
  game.choose(id)
  navigateTo(`/puzzle/${id}`)
}

// ---------- Final : la centrale choisie démarre, l'énergie arrive, Abidjan s'allume à 100 %
const cityLevel = ref(0)
const celebrate = ref(false)
const cityEl = ref(null)
const energized = ref(false)
const showFinal = ref(false)
// emplacement du technicien qui fête la centrale (unités du schéma 1200×900)
const GREET = { hydrogene: 250, biomasse: 470, cycle: 690, solaire: 860, eolien: 330 }
const smooth = () => !prefersReducedMotion()
onMounted(() => {
  // nouvelle partie : le joueur suivant retrouve l'accueil en haut de page
  if (!finale.value) { window.scrollTo(0, 0); return }
  hold.value = true // pas de retour à l'accueil pendant l'animation
  setTimeout(() => play('power'), 500)
})
onBeforeUnmount(() => { hold.value = false })
function onRevealed () { setTimeout(() => play('fanfare'), 300) }
function onEnergized () {
  energized.value = true
  const s = smooth()
  cityEl.value?.scrollIntoView({ behavior: s ? 'smooth' : 'auto', block: 'center' })
  setTimeout(() => { cityLevel.value = 5; celebrate.value = true }, s ? 500 : 0)
  setTimeout(() => { showFinal.value = true; hold.value = false }, s ? 12000 : 600)
}

const guideText = computed(() => {
  if (!finale.value) return 'Bienvenue chez CIPREL ! Choisis UNE centrale parmi les 5 : tu auras 2 minutes pour assembler ses 6 pièces et alimenter tout Abidjan.'
  if (!energized.value) return `La centrale ${chosen.value?.name} démarre…`
  return `Bravo ! Ta centrale ${chosen.value?.name} alimente Abidjan à 100 % !`
})

// ---------- Score : pseudo saisi au clavier de la borne, classement local
const name = ref('')
const sendError = ref('')
function save () {
  sendError.value = ''
  const n = cleanName(name.value)
  if (n.length < 2) { sendError.value = 'Choisissez un pseudo d’au moins 2 caractères.'; return }
  const r = result.value
  state.value.saved = leaderboard.add({ name: n, plant: state.value.chosen, kwh: r.kwh, time: r.time, errors: r.errors })
  name.value = n
  play('lock')
}
const meEntry = computed(() => state.value.saved && result.value
  ? { rank: state.value.saved.rank, name: name.value, kwh: result.value.kwh, time: result.value.time, plantName: chosen.value?.name }
  : null)
function newGame () { game.reset() }

// ---------- Panneaux
const showBoard = ref(false)

// ---------- Accès du personnel : 5 touchers rapides sur le logo, puis code
const showStaff = ref(false)
let taps = []
function onLogo () {
  const now = Date.now()
  taps = [...taps.filter(t => now - t < KIOSK.staffTapWindow), now]
  if (taps.length >= KIOSK.staffTaps) { taps = []; showStaff.value = true }
}
</script>

<template>
  <div class="page">
    <header class="top">
      <div class="brand">
        <img src="/brand/ciprel.png" width="337" height="150" class="logo" alt="CIPREL, Compagnie Ivoirienne de Production d'Électricité" draggable="false" @click="onLogo">
        <h1>{{ finale ? 'Abidjan est allumée !' : 'Choisissez votre centrale' }}</h1>
      </div>
      <nav class="tools" aria-label="Partie">
        <SoundToggle />
        <button class="btn ghost" type="button" @click="showBoard = true">
          <AppIcon name="trophy" :size="18" /><span class="lbl">Classement</span>
        </button>
      </nav>
    </header>

    <section class="hud" aria-label="Règles">
      <template v-if="!finale">
        <span class="chip"><AppIcon name="grid" :size="18" />1 centrale à choisir parmi 5</span>
        <span class="chip"><AppIcon name="check" :size="18" />6 pièces à assembler</span>
        <span class="chip"><AppIcon name="clock" :size="18" />{{ formatTime(RULES.duration) }} chrono</span>
      </template>
      <template v-else-if="result">
        <span class="chip plant-chip" :style="{ '--c': chosen?.color }"><span class="dot" aria-hidden="true" />{{ chosen?.name }}</span>
        <span class="meter-value"><AppIcon name="bolt" :size="22" />{{ formatKwh(result.kwh) }}</span>
        <StarRating :value="result.stars" :size="22" />
        <span class="chip"><AppIcon name="clock" :size="18" />{{ formatTime(result.time) }}</span>
      </template>
    </section>

    <main class="main">
      <div class="stack">
        <OverviewScene
          :chosen="state.chosen"
          :interactive="!finale"
          :play="finale"
          :celebrate="celebrate"
          @open="ask"
          @revealed="onRevealed"
          @energized="onEnergized"
        >
          <!-- techniciens CIPREL en tenue : ils parcourent la route ; l'un fête la centrale choisie -->
          <g aria-hidden="true">
            <g class="walker w1"><g transform="translate(0 688)"><CiprelTechnician variant="homme" pose="walk" :size="112" /></g></g>
            <g class="walker w2"><g transform="translate(0 694) scale(-1 1)"><CiprelTechnician variant="femme" pose="walk" :size="104" /></g></g>
            <g class="walker w3"><g transform="translate(0 700)"><CiprelTechnician variant="homme" pose="walk" :size="98" /></g></g>
          </g>
          <g v-if="finale && chosen" class="greeter" :transform="`translate(${GREET[chosen.id]} 668)`" aria-hidden="true">
            <CiprelTechnician variant="femme" :pose="energized ? 'cheer' : 'wave'" :size="104" />
          </g>
        </OverviewScene>
        <div ref="cityEl" class="city">
          <AbidjanSkyline :level="cityLevel" :celebrate="celebrate" />
          <p class="city-tag">
            <AppIcon name="bolt" :size="18" />
            {{ cityLevel >= 5 ? `Abidjan alimentée à 100 % par la centrale ${chosen?.name}` : 'Abidjan attend son électricité' }}
          </p>
        </div>
      </div>

      <aside class="side">
        <GuideBubble :text="guideText" variant="homme" :pose="finale ? (energized ? 'cheer' : 'point') : 'wave'" side="left" :size="104" />

        <ul v-if="!finale" class="plants">
          <li v-for="p in PLANTS" :key="p.id" :style="{ '--c': p.color }">
            <button type="button" class="plant-btn" @click="ask(p.id)">
              <span class="dot" aria-hidden="true" />
              <span class="plant-name">{{ p.name }}</span>
              <span class="todo">Assembler</span>
            </button>
          </li>
        </ul>
        <div v-else class="side-actions">
          <button v-if="!showFinal && energized" class="btn" type="button" @click="showFinal = true"><AppIcon name="trophy" :size="18" />Mon score</button>
          <button class="btn ghost" type="button" @click="newGame"><AppIcon name="refresh" :size="18" />Nouvelle partie</button>
        </div>
      </aside>
    </main>

    <!-- confirmation du choix : une seule centrale par partie -->
    <AppDialog :open="!!pending" :title="pending ? `Assembler la centrale ${pending.name} ?` : ''" @close="pending = null">
      <div v-if="pending" class="confirm">
        <p>Vous aurez <strong>{{ formatTime(RULES.duration) }}</strong> pour remettre ses 6 pièces en place. Réussissez, et votre centrale alimentera tout Abidjan.</p>
        <div class="actions">
          <button class="btn ghost" type="button" @click="pending = null">Changer</button>
          <button class="btn" type="button" @click="start">C’est parti !</button>
        </div>
      </div>
    </AppDialog>

    <!-- bilan final -->
    <AppDialog :open="showFinal && !!result" :title="chosen ? `Centrale ${chosen.name} : Abidjan alimentée à 100 % !` : 'Bilan'" wide @close="showFinal = false">
      <div v-if="result" class="final">
        <div class="final-score">
          <p class="big"><AppIcon name="bolt" :size="28" />{{ formatKwh(result.kwh) }}</p>
          <StarRating :value="result.stars" :size="28" />
          <p class="muted">Assemblée en {{ formatTime(result.time) }} · {{ formatTime(result.left) }} restantes</p>
        </div>
        <form v-if="!state.saved" class="submit" @submit.prevent="save">
          <label for="pseudo">Votre pseudo pour le classement</label>
          <div class="row">
            <input id="pseudo" :value="name" readonly inputmode="none" maxlength="20" placeholder="Touchez les lettres ci-dessous" aria-describedby="pseudo-help">
            <button class="btn" type="submit">Enregistrer</button>
          </div>
          <p id="pseudo-help" class="sr-only">Saisissez votre pseudo avec le clavier affiché.</p>
          <p v-if="sendError" class="err" role="alert">{{ sendError }}</p>
          <TouchKeyboard v-model="name" :maxlength="20" submit-label="Enregistrer" @submit="save" />
        </form>
        <template v-else>
          <p class="ranked" role="status">
            <AppIcon name="medal" :size="20" />
            {{ state.saved.rank === 1 ? 'Meilleur score' : `${state.saved.rank}ᵉ place` }} sur {{ state.saved.total }} partie{{ state.saved.total > 1 ? 's' : '' }}
          </p>
          <LeaderboardPanel :highlight="state.saved.id" :me="meEntry" :limit="10" />
        </template>
        <div class="actions">
          <button class="btn" :class="{ ghost: !state.saved }" type="button" @click="newGame"><AppIcon name="refresh" :size="18" />Nouvelle partie</button>
        </div>
      </div>
    </AppDialog>

    <AppDialog :open="showBoard" title="Classement" @close="showBoard = false">
      <LeaderboardPanel v-if="showBoard" :highlight="state.saved?.id" :me="meEntry" />
    </AppDialog>

    <StaffPanel :open="showStaff" @close="showStaff = false" />
  </div>
</template>

<style scoped>
.page { max-width: 1440px; margin: 0 auto; padding: 14px 16px 24px; display: grid; gap: 14px; }
.top { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.logo { height: 56px; width: auto; border-radius: 12px; background: #fff; padding: 4px 8px; box-shadow: var(--shadow); flex: none; }
.brand h1 { font-size: clamp(1.5rem, 4.2vw, 2.6rem); font-weight: 800; color: var(--navy); }
.tools { display: flex; gap: 8px; flex-wrap: wrap; }
@media (max-width: 560px) {
  .page { padding: 12px 16px 24px; gap: 12px; }
  .top { align-items: center; flex-wrap: wrap; row-gap: 10px; }
  .brand { display: contents; }
  .logo { height: 44px; padding: 3px 6px; order: 1; }
  .tools { order: 2; margin-left: auto; flex-wrap: nowrap; flex: none; gap: 6px; }
  .brand h1 { order: 3; flex: 1 1 100%; font-size: 1.7rem; }
  .tools .lbl { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
  .tools .btn { padding: .55rem .8rem; }
}

.hud { display: flex; align-items: center; gap: 10px 14px; flex-wrap: wrap; background: var(--surface); border-radius: var(--radius-lg); padding: 12px 18px; box-shadow: var(--shadow); }
.meter-value { display: flex; align-items: center; gap: 6px; font-family: var(--font-display); font-size: 1.7rem; line-height: 1.1; font-weight: 800; color: var(--energy-ink); font-variant-numeric: tabular-nums; }
.plant-chip .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--c); border: 2px solid var(--ink); }

.main { display: grid; gap: 16px; grid-template-columns: 1fr; align-items: start; }
@media (min-width: 1024px) { .main { grid-template-columns: minmax(0, 1fr) 300px; } }
.stack { border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow); background: #26456f; }
.stack :deep(.art) { border-radius: 0; box-shadow: none; }
.city { position: relative; }
/* trois techniciens parcourent la route, chacun à son pas */
.stack :deep(.walker) { animation: walk-right 38s linear infinite; }
.stack :deep(.walker.w2) { animation: walk-left 46s linear infinite; animation-delay: -18s; }
.stack :deep(.walker.w3) { animation-duration: 54s; animation-delay: -31s; }
@keyframes walk-right { from { transform: translateX(-80px); } to { transform: translateX(1280px); } }
@keyframes walk-left { from { transform: translateX(1280px); } to { transform: translateX(-80px); } }
/* sur la borne (classe kiosk), le final reste animé même si Windows réduit les animations */
@media (prefers-reduced-motion: reduce) {
  html:not(.kiosk) .stack :deep(.walker) { animation: none; transform: translateX(560px); }
  html:not(.kiosk) .stack :deep(.walker.w2) { transform: translateX(160px); }
  html:not(.kiosk) .stack :deep(.walker.w3) { transform: translateX(980px); }
}
.city-tag {
  position: absolute; left: 12px; top: 10px; display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 999px; background: rgba(255, 255, 255, .92); border: 2px solid var(--ink);
  font-family: var(--font-display); font-weight: 700; font-size: .98rem; color: var(--ink);
}

.side { display: grid; gap: 14px; }
.plants { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.plant-btn {
  width: 100%; min-height: 60px; display: flex; align-items: center; gap: 12px;
  padding: 8px 18px; border: 3px solid var(--c); border-radius: 999px; background: var(--surface);
  cursor: pointer; text-align: left; transition: background .15s;
}
.plant-btn:hover, .plant-btn:active { background: #fff3d1; }
.dot { width: 16px; height: 16px; border-radius: 50%; border: 3px solid var(--c); background: var(--c); flex: none; }
.plant-name { font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; flex: 1; }
.todo { font-family: var(--font-display); font-weight: 700; color: var(--orange-ink); }
.side-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.confirm { display: grid; gap: 16px; font-size: 1.05rem; }
.final { display: grid; gap: 14px; }
.final-score { display: flex; align-items: center; gap: 8px 16px; flex-wrap: wrap; }
.final-score .big { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: clamp(2rem, 6vw, 2.8rem); font-weight: 800; color: var(--energy-ink); font-variant-numeric: tabular-nums; }
.muted { color: var(--ink-2); flex-basis: 100%; }
.submit { display: grid; gap: 8px; }
.submit label { font-weight: 700; }
.submit .row { display: flex; gap: 8px; flex-wrap: wrap; }
.submit input {
  flex: 1; min-width: 180px; min-height: 52px; padding: 0 14px; border-radius: 12px; border: 2px solid var(--line);
  font: inherit; font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; caret-color: transparent;
}
.err { color: var(--bad); font-weight: 700; }
.ranked { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--navy); }
.actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
</style>
