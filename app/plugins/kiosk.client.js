// Borne tactile : pas de menu contextuel (appui long), pas de glisser d'images ou de liens.
// Ctrl+Maj+Q (clavier branché) est intercepté par electron/main.cjs, avant la page.
export default defineNuxtPlugin(() => {
  // site web : comportement normal du navigateur
  if (!window.kiosk) return
  // borne : les règles CSS « réduire les animations » ne s'appliquent pas (voir main.css)
  document.documentElement.classList.add('kiosk')
  window.addEventListener('contextmenu', e => e.preventDefault())
  window.addEventListener('dragstart', e => e.preventDefault())
})
