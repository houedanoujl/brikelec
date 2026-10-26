<script setup>
import { PLANTS } from '~/data/plants'
import { BADGES, formatTime, formatKwh } from '~/composables/useGame'

const game = useGame()
const { state, totals, solvedCount, allSolved } = game
const loaded = useState('game-loaded')

const solvedMap = computed(() => Object.fromEntries(PLANTS.map(p => [p.id, !!state.value.plants[p.id]])))
const reveal = ref(null)
// La centrale tout juste assemblée est révélée une seule fois, à l'arrivée.
watch(loaded, (v) => {
  if (!v) return
  reveal.value = state.value.reveal
  state.value.reveal = null
}, { immediate: true })

function open (id) { navigateTo(`/puzzle/${id}`) }
// emplacement de la technicienne près de chaque centrale (unités du schéma 1200×900)
const GREET = { hydrogene: 250, biomasse: 470, cycle: 690, solaire: 860, eolien: 330 }
const guideText = computed(() => {
  const n = solvedCount.value
  if (!n) return 'Bienvenue chez CIPREL ! Chaque centrale grisée cache un puzzle de 6 pièces. Touche-la pour la reconstituer.'
  if (n < 5) return `Bravo ! Abidjan est alimentée à ${n * 20} %. Encore ${5 - n} centrale${5 - n > 1 ? 's' : ''} à allumer.`
  return 'Mission accomplie : les 5 centrales tournent et tout Abidjan est éclairée !'
})
const lastSolved = computed(() => state.value.order[state.value.order.length - 1] || null)

// ---------- Fin de partie
const showFinal = ref(false)
const celebrate = computed(() => allSolved.value)
const { play } = useSound()
// une centrale vient d'être assemblée : mise sous tension, puis la ville s'allume
watch(reveal, (id) => {
  if (!id) return
  setTimeout(() => play('power'), 500)
  setTimeout(() => play('city'), 1500)
}, { immediate: true })
function onRevealed () {
  if (allSolved.value && !state.value.celebrated) {
    state.value.celebrated = true
    setTimeout(() => play('fanfare'), 300)
  }
  if (allSolved.value && !state.value.submitted) setTimeout(() => { showFinal.value = true }, 600)
}
onMounted(() => {
  if (allSolved.value && !state.value.submitted && !reveal.value) showFinal.value = true
})

const name = ref('')
watch(loaded, v => { if (v) name.value = state.value.name }, { immediate: true })
const sending = ref(false)
const sendError = ref('')
async function submit () {
  sendError.value = ''
  const n = name.value.trim()
  if (n.length < 2) { sendError.value = 'Choisissez un pseudo d’au moins 2 caractères.'; return }
  sending.value = true
  try {
    const res = await $fetch('/api/scores', { method: 'POST', body: { name: n, plants: state.value.plants } })
    state.value.name = n
    state.value.submitted = { rank: res.rank, id: res.entry.id, total: res.total }
    if (res.rank <= 10) game.award('podium', [])
  } catch (e) {
    sendError.value = e?.data?.statusMessage || 'Envoi impossible. Vérifiez la connexion et réessayez.'
  } finally {
    sending.value = false
  }
}

const shareData = computed(() => ({
  name: state.value.name, ...totals.value, badges: Object.keys(state.value.badges), rank: state.value.submitted?.rank,
}))

// ---------- Panneaux
const showBoard = ref(false)
const showBadges = ref(false)
const confirmReset = ref(false)
function resetGame () { game.reset(); confirmReset.value = false; showFinal.value = false }
const earned = computed(() => Object.keys(state.value.badges).length)
const meEntry = computed(() => state.value.submitted
  ? { rank: state.value.submitted.rank, name: state.value.name, ...totals.value }
  : null)
</script>

<template>
  <div class="page">
    <header class="top">
      <div class="brand">
        <img src="/brand/ciprel.png" width="337" height="150" class="logo" alt="CIPREL, Compagnie Ivoirienne de Production d'Électricité">
        <h1>Allumez la centrale du futur</h1>
      </div>
      <nav class="tools" aria-label="Partie">
        <SoundToggle />
        <button class="btn ghost" type="button" @click="showBadges = true">
          <AppIcon name="medal" :size="18" /><span class="lbl">Récompenses</span> <span class="count">{{ earned }}/{{ BADGES.length }}</span>
        </button>
        <button class="btn ghost" type="button" @click="showBoard = true">
          <AppIcon name="trophy" :size="18" /><span class="lbl">Classement</span>
        </button>
      </nav>
    </header>

    <section class="hud" aria-label="Votre partie">
      <div class="meter">
        <p class="meter-label">Production</p>
        <p class="meter-value"><AppIcon name="bolt" :size="22" />{{ formatKwh(totals.kwh) }}</p>
      </div>
      <div class="progress" role="progressbar" :aria-valuenow="solvedCount" aria-valuemin="0" aria-valuemax="5" :aria-label="`${solvedCount} centrales sur 5 allumées`">
        <span v-for="p in PLANTS" :key="p.id" class="seg" :class="{ on: solvedMap[p.id] }" :style="{ '--c': p.color }" />
        <span class="progress-text">{{ solvedCount }}/5 centrales</span>
      </div>
      <span class="chip"><AppIcon name="clock" :size="18" />{{ formatTime(totals.time) }}</span>
      <span class="chip" :title="'Jetons coup de pouce'"><AppIcon name="bulb" :size="18" />{{ state.hints }}<span class="sr-only"> coup(s) de pouce</span></span>
    </section>

    <main class="main">
      <div class="stack">
        <ClientOnly>
          <OverviewScene :solved="solvedMap" :reveal="reveal" :celebrate="celebrate" @open="open" @revealed="onRevealed">
            <!-- techniciens CIPREL : l'un parcourt la route, l'autre fête la dernière centrale allumée -->
            <g class="walker" aria-hidden="true">
              <g transform="translate(0 688)"><CiprelTechnician variant="homme" pose="walk" :size="112" /></g>
            </g>
            <g v-if="lastSolved" class="greeter" :transform="`translate(${GREET[lastSolved]} 668)`" aria-hidden="true">
              <CiprelTechnician variant="femme" :pose="celebrate ? 'cheer' : 'wave'" :size="104" />
            </g>
          </OverviewScene>
          <template #fallback><div class="scene-ph" /></template>
        </ClientOnly>
        <div class="city">
          <AbidjanSkyline :level="solvedCount" :celebrate="allSolved" />
          <p class="city-tag">
            <AppIcon name="bolt" :size="18" />
            {{ allSolved ? 'Abidjan est entièrement alimentée' : `Abidjan alimentée à ${solvedCount * 20} %` }}
          </p>
        </div>
      </div>

      <aside class="side">
        <ClientOnly>
          <GuideBubble :text="guideText" variant="homme" :pose="allSolved ? 'cheer' : solvedCount ? 'point' : 'wave'" side="left" :size="104" />
        </ClientOnly>

        <ul class="plants">
          <li v-for="p in PLANTS" :key="p.id" :style="{ '--c': p.color }" :class="{ on: solvedMap[p.id] }">
            <button type="button" class="plant-btn" @click="open(p.id)">
              <span class="dot" aria-hidden="true" />
              <span class="plant-name">{{ p.name }}</span>
              <StarRating v-if="solvedMap[p.id]" :value="state.plants[p.id].stars" :size="16" />
              <span v-else class="todo">À assembler</span>
              <span v-if="solvedMap[p.id]" class="plant-kwh">{{ formatKwh(state.plants[p.id].kwh) }}</span>
            </button>
          </li>
        </ul>

        <div v-if="allSolved" class="side-actions">
          <button class="btn" type="button" @click="showFinal = true"><AppIcon name="trophy" :size="18" />Bilan de la partie</button>
        </div>
        <button v-if="solvedCount" class="linkish" type="button" @click="confirmReset = true">Recommencer depuis le début</button>
      </aside>
    </main>

    <!-- bilan final -->
    <AppDialog :open="showFinal" title="La centrale du futur est allumée !" wide @close="showFinal = false">
      <div class="final">
        <div class="final-score">
          <p class="big"><AppIcon name="bolt" :size="28" />{{ formatKwh(totals.kwh) }}</p>
          <p class="muted">{{ formatTime(totals.time) }} · {{ totals.errors }} erreur{{ totals.errors > 1 ? 's' : '' }} · {{ earned }} récompense{{ earned > 1 ? 's' : '' }}</p>
        </div>
        <form v-if="!state.submitted" class="submit" @submit.prevent="submit">
          <label for="pseudo">Votre pseudo pour le classement</label>
          <div class="row">
            <input id="pseudo" v-model="name" maxlength="20" autocomplete="nickname" placeholder="Ex. Alex" required>
            <button class="btn" type="submit" :disabled="sending">{{ sending ? 'Envoi…' : 'Enregistrer mon score' }}</button>
          </div>
          <p v-if="sendError" class="err" role="alert">{{ sendError }}</p>
        </form>
        <p v-else class="ranked" role="status">
          <AppIcon name="medal" :size="20" />
          {{ state.submitted.rank === 1 ? 'Meilleur score' : `${state.submitted.rank}ᵉ place` }} sur {{ state.submitted.total }} partie{{ state.submitted.total > 1 ? 's' : '' }}
        </p>
        <LeaderboardPanel v-if="state.submitted" :highlight="state.submitted.id" :me="meEntry" />
        <ShareSouvenir v-if="showFinal" :data="shareData" @shared="game.award('souvenir', [])" />
        <div class="actions">
          <button class="btn ghost" type="button" @click="confirmReset = true"><AppIcon name="refresh" :size="18" />Rejouer</button>
        </div>
      </div>
    </AppDialog>

    <AppDialog :open="showBoard" title="Classement" @close="showBoard = false">
      <LeaderboardPanel v-if="showBoard" :highlight="state.submitted?.id" :me="meEntry" />
    </AppDialog>

    <AppDialog :open="showBadges" title="Récompenses" wide @close="showBadges = false">
      <ul class="badges">
        <li v-for="b in BADGES" :key="b.id" :class="{ earned: state.badges[b.id] }">
          <BadgeIcon :id="b.id" :earned="!!state.badges[b.id]" :size="46" />
          <div>
            <strong>{{ b.name }}</strong>
            <span>{{ b.desc }}</span>
          </div>
          <span class="sr-only">{{ state.badges[b.id] ? 'obtenue' : 'à débloquer' }}</span>
        </li>
      </ul>
    </AppDialog>

    <AppDialog :open="confirmReset" title="Recommencer une partie ?" @close="confirmReset = false">
      <p>Votre progression, vos kWh et vos récompenses repartiront de zéro. Les scores déjà enregistrés restent au classement.</p>
      <div class="actions">
        <button class="btn ghost" type="button" @click="confirmReset = false">Annuler</button>
        <button class="btn" type="button" @click="resetGame">Recommencer</button>
      </div>
    </AppDialog>
  </div>
</template>

<style scoped>
.page { max-width: 1440px; margin: 0 auto; padding: 14px 16px 24px; display: grid; gap: 14px; }
.top { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.logo { height: 56px; width: auto; border-radius: 12px; background: #fff; padding: 4px 8px; box-shadow: var(--shadow); flex: none; }
.brand h1 { font-size: clamp(1.5rem, 4.2vw, 2.6rem); font-weight: 800; color: var(--navy); }
.linkish { justify-self: start; border: 0; background: none; padding: 6px 2px; color: var(--ink-2); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.linkish:hover { color: var(--ink); }
.tools { display: flex; gap: 8px; flex-wrap: wrap; }
.count { font-variant-numeric: tabular-nums; color: var(--ink-2); font-weight: 500; }
@media (max-width: 560px) {
  .page { padding: 12px 16px 24px; gap: 12px; }
  .top { align-items: center; flex-wrap: wrap; row-gap: 10px; }
  .brand { display: contents; }
  .logo { height: 44px; padding: 3px 6px; order: 1; }
  .tools { order: 2; margin-left: auto; }
  .brand h1 { order: 3; flex: 1 1 100%; font-size: 1.7rem; }
  .tools .lbl { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
  .tools { flex-wrap: nowrap; flex: none; gap: 6px; }
  .tools .btn { padding: .55rem .8rem; }
  .hud { gap: 8px 10px; }
  .progress { order: 3; flex-basis: 100%; }
}

.hud { display: flex; align-items: center; gap: 10px 14px; flex-wrap: wrap; background: var(--surface); border-radius: var(--radius-lg); padding: 12px 18px; box-shadow: var(--shadow); }
.meter { display: grid; margin-right: 6px; }
.meter-label { font-size: .75rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--ink-2); }
.meter-value { display: flex; align-items: center; gap: 6px; font-family: var(--font-display); font-size: 1.7rem; line-height: 1.1; font-weight: 800; color: var(--energy-ink); font-variant-numeric: tabular-nums; }
.progress { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 4px; }
.seg { flex: 1; height: 14px; border-radius: 99px; background: #e1e9ef; border: 2px solid var(--ink); transition: background .6s; }
.seg.on { background: var(--c); }
.progress-text { margin-left: 8px; font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; }

.main { display: grid; gap: 16px; grid-template-columns: 1fr; align-items: start; }
@media (min-width: 1024px) { .main { grid-template-columns: minmax(0, 1fr) 300px; } }
.scene-ph { aspect-ratio: 4 / 3; background: #d8eef6; }
.stack { border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow); background: #26456f; }
.stack :deep(.art) { border-radius: 0; box-shadow: none; }
.city { position: relative; }
.stack :deep(.walker) { animation: walk-across 38s linear infinite; }
@keyframes walk-across { from { transform: translateX(-80px); } to { transform: translateX(1280px); } }
@media (prefers-reduced-motion: reduce) { .stack :deep(.walker) { animation: none; transform: translateX(560px); } }
.city-tag {
  position: absolute; left: 12px; top: 10px; display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 999px; background: rgba(255, 255, 255, .92); border: 2px solid var(--ink);
  font-family: var(--font-display); font-weight: 700; font-size: .98rem; color: var(--ink);
}

.side { display: grid; gap: 14px; }
.plants { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.plant-btn {
  width: 100%; min-height: 54px; display: flex; align-items: center; gap: 10px;
  padding: 8px 16px; border: 2px solid var(--line); border-radius: 999px; background: var(--surface);
  cursor: pointer; text-align: left; transition: border-color .15s, background .15s;
}
.plant-btn:hover { border-color: var(--c); background: #f7f9fb; }
.dot { width: 14px; height: 14px; border-radius: 50%; border: 3px solid var(--c); background: transparent; flex: none; }
.on .dot { background: var(--c); }
.plant-name { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; flex: 1; }
.todo { color: var(--ink-2); font-size: .88rem; }
.plant-kwh { font-variant-numeric: tabular-nums; font-size: .88rem; color: var(--ink-2); }
.side-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.final { display: grid; gap: 16px; }
.final-score .big { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: clamp(2rem, 6vw, 2.8rem); font-weight: 800; color: var(--energy-ink); font-variant-numeric: tabular-nums; }
.muted { color: var(--ink-2); }
.submit { display: grid; gap: 6px; }
.submit label { font-weight: 600; }
.submit .row { display: flex; gap: 8px; flex-wrap: wrap; }
.submit input { flex: 1; min-width: 180px; min-height: 44px; padding: 0 14px; border-radius: 12px; border: 2px solid var(--line); font: inherit; }
.submit input:focus-visible { border-color: var(--navy); outline: 3px solid rgba(38, 69, 111, .25); outline-offset: 0; }
.err { color: var(--bad); font-weight: 600; }
.ranked { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--navy); }
.actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

.badges { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
@media (min-width: 640px) { .badges { grid-template-columns: 1fr 1fr; } }
.badges li { display: flex; gap: 12px; align-items: center; padding: 8px; border-radius: 12px; }
.badges li.earned { background: #f6f9f4; }
.badges li div { display: grid; }
.badges span { color: var(--ink-2); font-size: .9rem; }
.badges li:not(.earned) strong { color: var(--ink-2); }
</style>
