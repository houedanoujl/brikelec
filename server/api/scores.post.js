// Enregistre une partie complète (5 centrales). Première validation ici
// (types, bornes) ; Supabase revalide dans submit_score.
// 5 × (1000 + 200 + 150) × 1,5 : plafond théorique du score
const MAX_KWH = 10125

function cleanName (raw) {
  return String(raw ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = cleanName(body?.name)
  if (name.length < 2) throw createError({ statusCode: 400, statusMessage: 'Pseudo trop court (2 caractères minimum).' })

  const raw = body?.plants
  if (!raw || typeof raw !== 'object') throw createError({ statusCode: 400, statusMessage: 'Partie incomplète.' })
  const plants = {}
  let kwh = 0
  for (const id of PLANT_IDS) {
    const p = raw[id]
    const ok = p && [p.kwh, p.time, p.errors].every(Number.isFinite) &&
      p.time >= 3 && p.time <= 36000 && p.errors >= 0 && p.errors <= 500 && p.kwh >= 100 && p.kwh <= 2025
    if (!ok) throw createError({ statusCode: 400, statusMessage: 'Partie invalide.' })
    plants[id] = { kwh: Math.round(p.kwh), time: Math.round(p.time), errors: Math.round(p.errors) }
    kwh += plants[id].kwh
  }
  if (kwh > MAX_KWH) throw createError({ statusCode: 400, statusMessage: 'Score invalide.' })

  return await saveScore(name, plants)
})
