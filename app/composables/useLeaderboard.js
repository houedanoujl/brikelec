// Classement de la borne, conservé dans localStorage (seule donnée persistée).
// Dans l'application Electron, l'origine app://borne ne change jamais : le
// classement survit aux redémarrages (dossier de l'application, « Local Storage »).
import { PLANT_BY_ID } from '~/data/plants'

const KEY = 'centrale-du-futur:classement:v1'
export const MAX_ENTRIES = 200

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

const uid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)

export function useLeaderboard () {
  const entries = useState('leaderboard', () => null)
  if (import.meta.client && entries.value === null) entries.value = read()

  const ranked = computed(() => (entries.value || []).map((e, i) => ({ ...e, rank: i + 1, plantName: PLANT_BY_ID[e.plant]?.name || '' })))

  // entrée validée : { name, plant, kwh, time, errors } ; renvoie { id, rank, total }
  function add ({ name, plant, kwh, time, errors }) {
    const entry = { id: uid(), name: cleanName(name), plant, kwh: Math.round(kwh), time: Math.round(time), errors: Math.round(errors) || 0, at: Date.now() }
    const list = [...(entries.value || []), entry].sort(compare)
    const rank = list.findIndex(e => e.id === entry.id) + 1
    const kept = list.slice(0, MAX_ENTRIES)
    entries.value = kept
    write(kept)
    return { id: entry.id, rank, total: list.length }
  }

  function clear () {
    entries.value = []
    try { localStorage.removeItem(KEY) } catch { /* idem */ }
  }

  return { entries: ranked, add, clear }
}
