// État de la partie, score en kWh et récompenses.
// Persisté dans localStorage : un rechargement ne fait pas perdre la progression.
import { PLANTS } from '~/data/plants'

const KEY = 'centrale-du-futur:v1'

export const BADGES = [
  { id: 'etincelle', name: 'Étincelle', desc: 'Premier puzzle assemblé.' },
  { id: 'sans-faute', name: 'Sans faute', desc: 'Un puzzle validé du premier coup (+200 kWh).' },
  { id: 'eclair', name: 'Éclair', desc: 'Un puzzle assemblé en moins de 45 secondes (+150 kWh).' },
  { id: 'serie', name: 'Série verte', desc: 'Trois puzzles sans faute d’affilée : multiplicateur ×1,5.' },
  { id: 'coup-de-pouce', name: 'Coup de pouce', desc: 'Jeton gagné après un sans-faute : il révèle la bonne case d’une pièce.' },
  { id: 'etoiles', name: 'Trois étoiles', desc: 'Un puzzle réussi sans erreur en moins d’une minute.' },
  { id: 'fiches', name: 'Encyclopédiste', desc: 'Les cinq fiches « Le saviez-vous ? » lues.' },
  { id: 'centrale', name: 'Centrale du futur', desc: 'Les cinq centrales allumées.' },
  { id: 'mix-parfait', name: 'Mix parfait', desc: 'Les cinq centrales assemblées sans aucune erreur.' },
  { id: 'podium', name: 'Podium', desc: 'Entrée dans le top 10 du classement.' },
  { id: 'souvenir', name: 'Carte souvenir', desc: 'Carte de fin de partie partagée ou téléchargée.' },
]
export const BADGE_BY_ID = Object.fromEntries(BADGES.map(b => [b.id, b]))

export const RULES = {
  base: 1000, perSecond: 2, perError: 50, floor: 100,
  perfectBonus: 200, fastBonus: 150, fastLimit: 45, hintCost: 100,
}

const fresh = () => ({
  plants: {},          // id → { time, errors, hints, stars, kwh }
  order: [],           // ordre de résolution
  streak: 0,           // puzzles sans faute d'affilée
  hints: 0,            // jetons « coup de pouce »
  badges: {},          // id → date d'obtention
  facts: [],           // fiches lues
  attempt: null,       // { id, elapsed, errors, hints } : essai en cours
  reveal: null,        // centrale à révéler sur la vue d'ensemble
  celebrated: false,   // animation finale déjà jouée
  onboarded: false,    // prise en main du puzzle déjà vue
  name: '',
  submitted: null,     // { rank, score }
})

export function useGame () {
  const state = useState('game', fresh)
  const loaded = useState('game-loaded', () => false)

  function load () {
    if (loaded.value || import.meta.server) return
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (saved) state.value = { ...fresh(), ...saved }
    } catch { /* stockage indisponible : partie non sauvegardée */ }
    loaded.value = true
    watch(state, v => {
      try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* idem */ }
    }, { deep: true })
  }

  const solvedCount = computed(() => Object.keys(state.value.plants).length)
  const isSolved = id => !!state.value.plants[id]
  const allSolved = computed(() => solvedCount.value === PLANTS.length)
  const totals = computed(() => {
    const list = Object.values(state.value.plants)
    return {
      kwh: list.reduce((s, p) => s + p.kwh, 0),
      time: list.reduce((s, p) => s + p.time, 0),
      errors: list.reduce((s, p) => s + p.errors, 0),
    }
  })

  const toasts = useState('toasts', () => [])
  function award (id, fresh) {
    if (state.value.badges[id]) return
    state.value.badges[id] = Date.now()
    fresh.push(id)
    toasts.value.push({ key: `${id}-${Date.now()}`, id })
  }

  const multiplier = streak => (streak >= 3 ? 1.5 : streak === 2 ? 1.2 : 1)
  const starsFor = (time, errors) => (errors === 0 && time <= 60 ? 3 : errors <= 2 && time <= 120 ? 2 : 1)

  // Fin d'un puzzle : calcule les kWh, les étoiles et les récompenses gagnées.
  function complete (id, { time, errors, hints }) {
    const s = state.value
    const newBadges = []
    const stars = starsFor(time, errors)
    state.value.attempt = null

    // Rejouer une centrale déjà allumée : seules les étoiles peuvent progresser.
    if (s.plants[id]) {
      const prev = s.plants[id]
      if (stars > prev.stars) prev.stars = stars
      if (stars === 3) award('etoiles', newBadges)
      return { replay: true, stars, kwh: 0, lines: [], badges: newBadges, mult: 1 }
    }

    const base = Math.max(RULES.floor, RULES.base - RULES.perSecond * Math.round(time) - RULES.perError * errors)
    const lines = [{ label: 'Production de base', value: base }]
    let total = base
    if (errors === 0) { total += RULES.perfectBonus; lines.push({ label: 'Sans faute', value: RULES.perfectBonus }) }
    if (time < RULES.fastLimit) { total += RULES.fastBonus; lines.push({ label: 'Éclair', value: RULES.fastBonus }) }
    if (hints) { total -= RULES.hintCost * hints; lines.push({ label: `Coup${hints > 1 ? 's' : ''} de pouce`, value: -RULES.hintCost * hints }) }

    s.streak = errors === 0 ? s.streak + 1 : 0
    const mult = multiplier(s.streak)
    const kwh = Math.max(RULES.floor, Math.round(total * mult))

    s.plants[id] = { time: Math.round(time), errors, hints, stars, kwh }
    s.order.push(id)
    s.reveal = id

    award('etincelle', newBadges)
    if (errors === 0) {
      award('sans-faute', newBadges)
      s.hints += 1
      award('coup-de-pouce', newBadges)
    }
    if (time < RULES.fastLimit) award('eclair', newBadges)
    if (s.streak >= 3) award('serie', newBadges)
    if (stars === 3) award('etoiles', newBadges)
    if (Object.keys(s.plants).length === PLANTS.length) {
      award('centrale', newBadges)
      if (Object.values(s.plants).every(p => p.errors === 0)) award('mix-parfait', newBadges)
    }
    return { replay: false, stars, kwh, lines, mult, badges: newBadges, earnedHint: errors === 0 }
  }

  function readFact (id) {
    const s = state.value
    if (!s.facts.includes(id)) s.facts.push(id)
    const got = []
    if (PLANTS.every(p => s.facts.includes(p.id))) award('fiches', got)
    return got
  }

  function spendHint () {
    if (state.value.hints <= 0) return false
    state.value.hints -= 1
    return true
  }

  function reset () {
    const name = state.value.name
    state.value = { ...fresh(), name }
  }

  return { state, load, solvedCount, isSolved, allSolved, totals, complete, readFact, spendHint, award, reset, starsFor }
}

export const formatTime = s => {
  s = Math.max(0, Math.round(s))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
export const formatKwh = n => `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} kWh`
