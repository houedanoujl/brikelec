// Police des schémas du client : Trebuchet MS (relevée sur les PDF).
// Elle n'est pas redistribuée : les textes sont convertis en tracés au build.
import { existsSync, readFileSync } from 'node:fs'
import opentype from 'opentype.js'

const CANDIDATES = {
  regular: [
    process.env.TREBUCHET_REGULAR,
    '/System/Library/Fonts/Supplemental/Trebuchet MS.ttf',
    '/Library/Fonts/Trebuchet MS.ttf',
    'C:/Windows/Fonts/trebuc.ttf',
  ],
  bold: [
    process.env.TREBUCHET_BOLD,
    '/System/Library/Fonts/Supplemental/Trebuchet MS Bold.ttf',
    '/Library/Fonts/Trebuchet MS Bold.ttf',
    'C:/Windows/Fonts/trebucbd.ttf',
  ],
}

const cache = {}
export function loadFont (weight = 'regular') {
  if (cache[weight]) return cache[weight]
  const file = CANDIDATES[weight].find(f => f && existsSync(f))
  if (!file) throw new Error(`Trebuchet MS (${weight}) introuvable : définir TREBUCHET_${weight.toUpperCase()}`)
  return (cache[weight] = opentype.parse(readFileSync(file).buffer))
}
