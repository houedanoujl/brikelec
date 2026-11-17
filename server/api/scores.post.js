// Enregistre une partie du site web : une centrale assemblée en moins de 2 minutes.
// Le score n'est pas envoyé par le navigateur : il est recalculé ici à partir
// du temps (mêmes règles que RULES dans app/composables/useGame.js), puis
// Supabase le recalcule à son tour dans submit_plant_score.

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

  const plant = body?.plant
  if (!PLANT_IDS.includes(plant)) throw createError({ statusCode: 400, statusMessage: 'Centrale inconnue.' })

  const time = Math.round(body?.time)
  const errors = Math.round(body?.errors)
  const ok = Number.isFinite(time) && Number.isFinite(errors) &&
    time >= SCORE.minTime && time <= SCORE.duration && errors >= 0 && errors <= 500
  if (!ok) throw createError({ statusCode: 400, statusMessage: 'Partie invalide.' })

  return await saveScore({ name, plant, time, errors })
})
