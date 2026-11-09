// Borne en libre-service : après KIOSK.idleMs sans contact, la partie est remise
// à zéro et l'accueil s'affiche pour le joueur suivant.
// Une page peut suspendre ce minuteur (hold) : pendant le compte à rebours du
// puzzle, qui se termine de lui-même, et pendant l'animation finale.
import { KIOSK } from '~/utils/kiosk'

export function useIdleHold () {
  return useState('idle-hold', () => false)
}

// À appeler une seule fois (app.vue).
export function useIdle () {
  const hold = useIdleHold()
  const game = useGame()
  const route = useRoute()
  let timer = null

  function fire () {
    if (hold.value) return
    if (route.path !== '/') navigateTo('/') // l'accueil remet la partie à zéro en arrivant
    else if (game.state.value.phase !== 'choose' || document.querySelector('dialog[open]')) game.reset()
  }
  function arm () {
    clearTimeout(timer)
    if (!hold.value) timer = setTimeout(fire, KIOSK.idleMs)
  }

  onMounted(() => {
    window.addEventListener('pointerdown', arm, { passive: true, capture: true })
    window.addEventListener('keydown', arm, { capture: true })
    arm()
  })
  onBeforeUnmount(() => {
    clearTimeout(timer)
    window.removeEventListener('pointerdown', arm, { capture: true })
    window.removeEventListener('keydown', arm, { capture: true })
  })
  // fin d'une suspension : le délai repart de zéro
  watch(hold, arm)
}
