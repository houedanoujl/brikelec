// Classement.
// - Borne (application Electron) : conservé dans localStorage, seule donnée
//   persistée. L'origine app://borne ne change jamais : le classement survit aux
//   redémarrages (dossier de l'application, « Local Storage »). Aucun réseau.
// - Site web : classement partagé, via /api/scores (Supabase, voir server/utils/scores.js).
//   Le serveur chronomètre la partie : jeton de départ au lancement du chrono
//   (begin), jeton de résultat à la fin du puzzle (finish), exigé pour enregistrer.
import { PLANT_BY_ID } from '~/data/plants'
import { onKiosk } from '~/utils/kiosk'

const KEY = 'centrale-du-futur:classement:v1'
export const MAX_ENTRIES = 200
const REMOTE_LIMIT = 100

// Tri : kWh décroissants, puis temps, puis ancienneté.
export const compare = (a, b) => b.kwh - a.kwh || a.time - b.time || a.at - b.at

export function cleanName (raw) {
  return String(raw ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20)
}

function read () {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(list)) return []
    return list.filter(e => e && typeof e.name === 'string' && Number.isFinite(e.kwh) && Number.isFinite(e.time)).sort(compare)
  } catch { return [] }
}
function write (list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* stockage indisponible : classement de la séance seulement */ }
}

// Site web : jetons de la partie en cours, { start, result } (promesses ; hors
// état réactif, l'application est monopage et ne tourne que dans le navigateur).
let ticket = {}

const uid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)

export function useLeaderboard () {
  const remote = import.meta.client && !onKiosk()
  const entries = useState('leaderboard', () => null)
  const pending = useState('leaderboard-pending', () => false)
  const error = useState('leaderboard-error', () => false)
  if (import.meta.client && !remote && entries.value === null) entries.value = read()

  const ranked = computed(() => (entries.value || []).map((e, i) => ({ ...e, rank: i + 1, plantName: PLANT_BY_ID[e.plant]?.name || '' })))

  // Site web : recharge le classement partagé. Sur la borne, rien à faire.
  async function refresh () {
    if (!remote) return
    pending.value = true
    error.value = false
    try {
      const res = await $fetch('/api/scores', { query: { limit: REMOTE_LIMIT } })
      entries.value = res.entries
    } catch {
      error.value = true
    } finally {
      pending.value = false
    }
  }

  // Site web : le chrono du puzzle démarre. Sur la borne, rien à faire.
  function begin (plant) {
    if (!remote) return
    ticket = {
      start: $fetch('/api/games/start', { method: 'POST', body: { plant }, retry: 2 }).then(r => r.token).catch(() => null),
    }
  }

  // Site web : puzzle réussi. Renvoie le temps retenu par le serveur (ou null).
  async function finish ({ time, errors }) {
    if (!remote) return null
    const t = ticket
    t.result = (async () => {
      const token = await t.start
      if (!token) return null
      try {
        return await $fetch('/api/games/finish', { method: 'POST', body: { token, time: Math.round(time), errors: Math.round(errors) || 0 }, retry: 2 })
      } catch { return null }
    })()
    return (await t.result)?.time ?? null
  }

  // entrée validée : { name, plant, kwh, time, errors } ; renvoie { id, rank, total }.
  // Site web : seuls le pseudo et le jeton de résultat partent au serveur ; une
  // erreur (réseau, partie non vérifiée) est levée à l'appelant.
  async function add ({ name, plant, kwh, time, errors }) {
    if (remote) {
      const res = await ticket.result
      if (!res?.ticket) throw { data: { statusMessage: 'Partie non vérifiée par le serveur : score non enregistrable.' } }
      const saved = await $fetch('/api/scores', {
        method: 'POST',
        body: { name: cleanName(name), ticket: res.ticket },
      })
      refresh()
      return { id: saved.id, rank: saved.rank, total: saved.total }
    }
    const entry = { id: uid(), name: cleanName(name), plant, kwh: Math.round(kwh), time: Math.round(time), errors: Math.round(errors) || 0, at: Date.now() }
    const list = [...(entries.value || []), entry].sort(compare)
    const rank = list.findIndex(e => e.id === entry.id) + 1
    const kept = list.slice(0, MAX_ENTRIES)
    entries.value = kept
    write(kept)
    return { id: entry.id, rank, total: list.length }
  }

  // Borne uniquement (espace personnel).
  function clear () {
    if (remote) return
    entries.value = []
    try { localStorage.removeItem(KEY) } catch { /* idem */ }
  }

  return { entries: ranked, pending, error, remote, refresh, begin, finish, add, clear }
}
