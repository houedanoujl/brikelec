// Partie en cours sur la borne : une seule centrale, choisie parmi les cinq,
// à assembler en 2 minutes.
// L'état reste en mémoire : rien de la partie ne passe d'un joueur au suivant.
// Seul le classement est conservé (useLeaderboard, localStorage).

export const RULES = {
  duration: 120,     // secondes pour assembler la centrale
  base: 1000,        // kWh pour un assemblage réussi
  perSecondLeft: 10, // kWh par seconde restante au compte à rebours
}

// Étoiles : selon le temps mis, seul critère avec la réussite
export const starsFor = time => (time <= 60 ? 3 : time <= 90 ? 2 : 1)

// phase : 'choose' (accueil) → 'puzzle' → 'won' | 'failed' → 'finale' (Abidjan s'allume)
const fresh = () => ({
  phase: 'choose',
  chosen: null,      // id de la centrale choisie
  onboarded: false,  // conseils du puzzle déjà lus pendant cette partie
  result: null,      // { time, errors, left, kwh, stars, lines } après une réussite
  saved: null,       // { id, rank, total } une fois le score enregistré
})

export function useGame () {
  const state = useState('game', fresh)
  // numéro de partie : la page affichée est recréée à chaque nouvelle partie (app.vue)
  const round = useState('round', () => 0)
  const { muted } = useSound()

  function choose (id) {
    state.value = { ...fresh(), phase: 'puzzle', chosen: id }
  }

  // Assemblage réussi : 1000 kWh + 10 kWh par seconde restante.
  function win ({ time, errors }) {
    // secondes entières : temps + temps restant = 2:00, comme sur le compte à rebours
    const t = Math.min(RULES.duration, Math.max(0, Math.floor(time)))
    const left = RULES.duration - t
    const bonus = left * RULES.perSecondLeft
    state.value.result = {
      time: t,
      errors,
      left,
      kwh: RULES.base + bonus,
      stars: starsFor(t),
      lines: [
        { label: 'Assemblage réussi', value: RULES.base },
        { label: `Temps restant ${formatTime(left)} × ${RULES.perSecondLeft}`, value: bonus },
      ],
    }
    state.value.phase = 'won'
    return state.value.result
  }

  function fail () {
    state.value.result = null
    state.value.phase = 'failed'
  }

  function toFinale () {
    if (state.value.phase === 'won') state.value.phase = 'finale'
  }

  // Nouvelle partie (aussi après 60 s sans contact) ; le son revient pour le joueur suivant.
  // remount : recrée la page affichée (dialogues fermés, animations remises à zéro).
  function reset ({ remount = true } = {}) {
    state.value = fresh()
    muted.value = false
    if (remount) round.value++
  }

  return { state, round, choose, win, fail, toFinale, reset }
}

export const formatTime = (s) => {
  s = Math.max(0, Math.round(s))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
export const formatKwh = n => `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} kWh`
