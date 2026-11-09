// Borne tactile : pas de menu contextuel (appui long), pas de glisser d'images ou de liens.
// Ctrl+Maj+Q quitte l'application de la borne (personnel, clavier branché) ;
// electron/main.cjs l'intercepte aussi avant la page.
export default defineNuxtPlugin(() => {
  // borne : les règles CSS « réduire les animations » ne s'appliquent pas (voir main.css)
  if (window.kiosk) document.documentElement.classList.add('kiosk')
  window.addEventListener('contextmenu', e => e.preventDefault())
  window.addEventListener('dragstart', e => e.preventDefault())
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyQ') window.kiosk?.quit()
  })
})
