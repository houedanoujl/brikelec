// Fin d'un puzzle réussi : le serveur mesure lui-même le temps écoulé depuis le
// jeton de départ. Le temps annoncé par le navigateur n'est retenu que s'il
// colle à cette mesure (SCORE.grace secondes de marge pour le réseau) ; sinon
// c'est la mesure du serveur qui compte.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const start = readToken(body?.token, 's')
  if (!start || !PLANT_IDS.includes(start.plant)) throw createError({ statusCode: 400, statusMessage: 'Partie invalide.' })

  const elapsed = (Date.now() - start.iat) / 1000
  // trop tôt : six pièces ne se posent pas en moins de SCORE.minTime secondes
  if (!(elapsed >= SCORE.minTime)) throw createError({ statusCode: 400, statusMessage: 'Partie invalide.' })
  if (elapsed > SCORE.duration + SCORE.grace) throw createError({ statusCode: 400, statusMessage: 'Temps écoulé.' })

  const measured = Math.max(0, Math.floor(elapsed) - SCORE.grace)
  const claimed = Math.round(body?.time)
  const time = Math.min(SCORE.duration, Number.isFinite(claimed) ? Math.max(claimed, measured) : Math.floor(elapsed))
  if (time < SCORE.minTime) throw createError({ statusCode: 400, statusMessage: 'Partie invalide.' })

  const errors = Math.round(body?.errors)
  if (!Number.isFinite(errors) || errors < 0 || errors > 500) throw createError({ statusCode: 400, statusMessage: 'Partie invalide.' })

  const ticket = signToken({ t: 'r', id: start.id, plant: start.plant, time, errors, exp: Date.now() + SCORE.ticketMs })
  return { ticket, time, kwh: kwhFor(time) }
})
