// Enregistre une partie du site web : une centrale assemblée en moins de 2 minutes.
// Le navigateur n'envoie ni score ni temps : seulement un pseudo et le jeton de
// résultat signé par /api/games/finish (centrale, temps mesuré par le serveur,
// erreurs). Chaque partie ne s'enregistre qu'une fois (identifiant du jeton).

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

  const game = readToken(body?.ticket, 'r')
  if (!game) throw createError({ statusCode: 400, statusMessage: 'Partie non vérifiée : score non enregistrable.' })
  if (!(game.exp > Date.now())) throw createError({ statusCode: 400, statusMessage: 'Délai dépassé : rejouez pour enregistrer un score.' })

  return await saveScore({ id: game.id, name, plant: game.plant, time: game.time, errors: game.errors })
})
