// Réglages de la borne.
export const KIOSK = {
  idleMs: 60_000,   // sans contact : retour à l'accueil, partie remise à zéro
  staffPin: '2026', // code du personnel (5 touchers sur le logo CIPREL)
  staffTaps: 5,
  staffTapWindow: 3000,
}

// Dans l'application Electron de la borne (preload : window.kiosk)
export const onKiosk = () => import.meta.client && !!window.kiosk
// Sur la borne, le final demandé par le client reste animé même si Windows
// réduit les animations (« Ajuster pour obtenir les meilleures performances »).
export const prefersReducedMotion = () => !onKiosk() && window.matchMedia('(prefers-reduced-motion: reduce)').matches
