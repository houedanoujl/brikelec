// Jetons de partie signés (HMAC-SHA256) : le navigateur les transporte mais ne
// peut ni les fabriquer ni les modifier.
// - jeton de départ  { t: 's', id, plant, iat } : émis quand le chrono démarre ;
// - jeton de résultat { t: 'r', id, plant, time, errors, exp } : émis à la fin du
//   puzzle, avec le temps mesuré par le serveur. Lui seul permet d'enregistrer un score.
// Secret : NUXT_GAME_SECRET (obligatoire en production ; aléatoire en développement).
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'

let devSecret
function secret () {
  const { gameSecret } = useRuntimeConfig()
  if (gameSecret) return gameSecret
  if (import.meta.dev) return (devSecret ||= randomBytes(32).toString('hex'))
  console.error('[classement] NUXT_GAME_SECRET manquant : scores refusés.')
  throw createError({ statusCode: 503, statusMessage: 'Classement indisponible.' })
}

const mac = data => createHmac('sha256', secret()).update(data).digest('base64url')

export function signToken (payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${data}.${mac(data)}`
}

// Renvoie le contenu du jeton s'il est authentique et du type attendu, sinon null.
export function readToken (token, type) {
  if (typeof token !== 'string' || token.length > 600) return null
  const [data, sig, extra] = token.split('.')
  if (!data || !sig || extra !== undefined) return null
  const a = Buffer.from(sig)
  const b = Buffer.from(mac(data))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    return payload?.t === type ? payload : null
  } catch { return null }
}
