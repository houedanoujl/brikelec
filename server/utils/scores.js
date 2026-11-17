// Classement partagé du site web (la borne Electron garde le sien, hors ligne,
// dans localStorage : voir app/composables/useLeaderboard.js).
// - Supabase si NUXT_SUPABASE_URL et NUXT_SUPABASE_KEY sont définis (voir supabase/migrations) :
//   lecture de la table « scores », écriture via la fonction submit_plant_score (validation côté base).
// - Sinon, stockage Nitro « scores » (fichier .data en local).
// Seules les parties « une centrale en 2 minutes » sont classées : les anciennes
// parties à cinq centrales (colonne plant vide) restent en base, hors classement.
const KEY = 'leaderboard'
export const MAX_ENTRIES = 200
export const PLANT_IDS = ['hydrogene', 'biomasse', 'cycle', 'solaire', 'eolien']

// Mêmes règles que RULES dans app/composables/useGame.js
export const SCORE = { duration: 120, base: 1000, perSecondLeft: 10, minTime: 3 }
export const kwhFor = time => SCORE.base + (SCORE.duration - time) * SCORE.perSecondLeft

function supabase () {
  const { supabaseUrl, supabaseKey } = useRuntimeConfig()
  if (!supabaseUrl || !supabaseKey) return null
  const base = supabaseUrl.replace(/\/$/, '')
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  return { base, headers }
}

export const usingSupabase = () => !!supabase()

// Tri : kWh décroissants, puis temps, puis ancienneté (comme sur la borne).
export const compare = (a, b) => b.kwh - a.kwh || a.time - b.time || a.at - b.at

export function publicEntry (e, i) {
  return { rank: i + 1, id: e.id, name: e.name, plant: e.plant, kwh: e.kwh, time: e.time, errors: e.errors, at: e.at }
}

export async function topScores (limit) {
  const sb = supabase()
  if (sb) {
    let res
    try {
      res = await $fetch.raw(`${sb.base}/rest/v1/scores`, {
        headers: { ...sb.headers, Prefer: 'count=exact' },
        query: {
          select: 'id,name,plant,kwh,time_s,errors,created_at',
          plant: 'not.is.null',
          order: 'kwh.desc,time_s.asc,created_at.asc',
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
      id: r.id, name: r.name, plant: r.plant, kwh: r.kwh, time: r.time_s, errors: r.errors, at: Date.parse(r.created_at),
    }, i))
    return { total, entries }
  }
  const list = ((await useStorage('scores').getItem(KEY)) || []).filter(e => e?.plant).sort(compare)
  return { total: list.length, entries: list.slice(0, limit).map(publicEntry) }
}

// { name, plant, time, errors } déjà validés et arrondis par l'API ; renvoie { id, rank, total }
export async function saveScore ({ name, plant, time, errors }) {
  const sb = supabase()
  if (sb) {
    try {
      const r = await $fetch(`${sb.base}/rest/v1/rpc/submit_plant_score`, {
        method: 'POST',
        headers: sb.headers,
        body: { p_name: name, p_plant: plant, p_time: time, p_errors: errors },
      })
      return { id: r.id, rank: r.rank, total: r.total }
    } catch (e) {
      // 400 : refus de submit_plant_score (message de validation, à afficher) ; sinon panne
      if (e?.statusCode === 400 && e?.data?.message) throw createError({ statusCode: 400, statusMessage: e.data.message })
      console.error('[classement] envoi Supabase impossible :', e?.data?.message || e?.message)
      throw createError({ statusCode: 502, statusMessage: 'Classement indisponible.' })
    }
  }
  const { randomUUID } = await import('node:crypto')
  const entry = { id: randomUUID(), name, plant, kwh: kwhFor(time), time, errors, at: Date.now() }
  const storage = useStorage('scores')
  const list = ((await storage.getItem(KEY)) || []).filter(e => e?.plant)
  list.push(entry)
  list.sort(compare)
  const rank = list.findIndex(e => e.id === entry.id) + 1
  await storage.setItem(KEY, list.slice(0, MAX_ENTRIES))
  return { id: entry.id, rank, total: list.length }
}
