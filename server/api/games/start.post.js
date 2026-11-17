// Début d'une partie du site web : le chrono du serveur démarre ici.
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const plant = body?.plant
  if (!PLANT_IDS.includes(plant)) throw createError({ statusCode: 400, statusMessage: 'Centrale inconnue.' })
  return { token: signToken({ t: 's', id: randomUUID(), plant, iat: Date.now() }) }
})
