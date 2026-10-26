// Animations GSAP d'un composant :
// - toutes les animations créées via run() sont rattachées à un gsap.context
//   limité à l'élément racine, et annulées (revert) au démontage ;
// - reduced : vrai si le système demande de réduire les animations ;
// - loop() enregistre une animation d'ambiance, mise en pause quand le composant
//   sort de l'écran ou que l'onglet est caché.
import gsap from 'gsap'

export function useGsap (scope) {
  const reduced = ref(false)
  let ctx = null
  let io = null
  let visible = true
  const loops = new Set()

  const sync = () => {
    const on = visible && document.visibilityState === 'visible'
    loops.forEach(t => (on ? t.resume() : t.pause()))
  }

  onMounted(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = mq.matches
    mq.addEventListener?.('change', (e) => { reduced.value = e.matches })
    ctx = gsap.context(() => {}, scope.value)
    io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync() }, { threshold: 0.05 })
    io.observe(scope.value)
    document.addEventListener('visibilitychange', sync)
  })

  onBeforeUnmount(() => {
    io?.disconnect()
    document.removeEventListener('visibilitychange', sync)
    loops.clear()
    ctx?.revert()
  })

  // exécute fn dans le contexte du composant et renvoie son résultat
  function run (fn) {
    let out
    if (ctx) ctx.add(() => { out = fn(gsap) })
    else out = fn(gsap)
    return out
  }

  function loop (anim) {
    loops.add(anim)
    anim.eventCallback?.('onInterrupt', () => loops.delete(anim))
    sync()
    return anim
  }

  function stopLoop (anim) {
    if (!anim) return
    loops.delete(anim)
    anim.kill()
  }

  return { gsap, reduced, run, loop, stopLoop }
}
