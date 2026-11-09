// Réglages de la borne.
export const KIOSK = {
  idleMs: 60_000,   // sans contact : retour à l'accueil, partie remise à zéro
  // code du personnel dans un navigateur (développement) ; sur la borne, il est
  // vérifié par electron/main.cjs et se règle dans borne.json
  browserPin: '2026',
  staffTaps: 5,
  staffTapWindow: 3000,
}

// Dans l'application Electron de la borne (preload : window.kiosk)
export const onKiosk = () => import.meta.client && !!window.kiosk
// Sur la borne, le final demandé par le client reste animé même si Windows
// réduit les animations (« Ajuster pour obtenir les meilleures performances »).
export const prefersReducedMotion = () => !onKiosk() && window.matchMedia('(prefers-reduced-motion: reduce)').matches
