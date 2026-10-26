// Classement partagé.
// - Supabase si NUXT_SUPABASE_URL et NUXT_SUPABASE_KEY sont définis (voir supabase/migrations) :
//   lecture de la table « scores », écriture via la fonction submit_score (validation côté base).
// - Sinon, stockage Nitro « scores » (fichier .data en local).
const KEY = 'leaderboard'
export const MAX_ENTRIES = 200
export const PLANT_IDS = ['hydrogene', 'biomasse', 'cycle', 'solaire', 'eolien']

function supabase () {
  const { supabaseUrl, supabaseKey } = useRuntimeConfig()
  if (!supabaseUrl || !supabaseKey) return null
  const base = supabaseUrl.replace(/\/$/, '')
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  return { base, headers }
}

export const usingSupabase = () => !!supabase()

// Tri : kWh décroissants, puis temps, puis erreurs, puis ancienneté.
export const compare = (a, b) => b.kwh - a.kwh || a.time - b.time || a.errors - b.errors || a.at - b.at

export function publicEntry (e, i) {
  return { rank: i + 1, id: e.id, name: e.name, kwh: e.kwh, time: e.time, errors: e.errors, perfect: e.perfect, at: e.at }
}

export async function topScores (limit) {
  const sb = supabase()
  if (sb) {
    let res
    try {
      res = await $fetch.raw(`${sb.base}/rest/v1/scores`, {
        headers: { ...sb.headers, Prefer: 'count=exact' },
        query: {
          select: 'id,name,kwh,time_s,errors,perfect,created_at',
          order: 'kwh.desc,time_s.asc,errors.asc,created_at.asc',
          limit,
        },
      })
    } catch (e) {
      // détail dans les logs serveur, message neutre côté navigateur
      console.error('[classement] lecture Supabase impossible :', e?.data?.message || e?.message)
      throw createError({ statusCode: 502, statusMessage: 'Classement indisponible.' })
    }
    const total = +(res.headers.get('content-range') || '').split('/')[1] || res._data.length
    const entries = res._data.map((r, i) => publicEntry({
      id: r.id, name: r.name, kwh: r.kwh, time: r.time_s, errors: r.errors, perfect: r.perfect, at: Date.parse(r.created_at),
    }, i))
    return { total, entries }
  }
  const list = ((await useStorage('scores').getItem(KEY)) || []).sort(compare)
  return { total: list.length, entries: list.slice(0, limit).map(publicEntry) }
}

// plants : { id: { kwh, time, errors } } déjà validés et arrondis par l'API
export async function saveScore (name, plants) {
  const sb = supabase()
  if (sb) {
    try {
      const r = await $fetch(`${sb.base}/rest/v1/rpc/submit_score`, {
        method: 'POST',
        headers: sb.headers,
        body: { p_name: name, p_plants: plants },
      })
      return {
        rank: r.rank,
        total: r.total,
        entry: { rank: r.rank, id: r.id, name, kwh: r.kwh, time: r.time, errors: r.errors, perfect: r.errors === 0, at: Date.now() },
      }
    } catch (e) {
      // 400 : refus de submit_score (message de validation, à afficher) ; sinon panne
      if (e?.statusCode === 400 && e?.data?.message) throw createError({ statusCode: 400, statusMessage: e.data.message })
      console.error('[classement] envoi Supabase impossible :', e?.data?.message || e?.message)
      throw createError({ statusCode: 502, statusMessage: 'Classement indisponible.' })
    }
  }
  const { randomUUID } = await import('node:crypto')
  const sum = k => PLANT_IDS.reduce((s, id) => s + plants[id][k], 0)
  const entry = { id: randomUUID(), name, kwh: sum('kwh'), time: sum('time'), errors: sum('errors'), at: Date.now() }
  entry.perfect = entry.errors === 0
  const storage = useStorage('scores')
  const list = (await storage.getItem(KEY)) || []
  list.push(entry)
  list.sort(compare)
  const rank = list.findIndex(e => e.id === entry.id) + 1
  await storage.setItem(KEY, list.slice(0, MAX_ENTRIES))
  return { rank, total: list.length, entry: publicEntry(entry, rank - 1) }
}
