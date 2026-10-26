// Briques communes aux schémas du client (mesurées sur les PDF, unités de page).

export const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"${title ? ` aria-label="${title}"` : ''}>\n${body}\n</svg>\n`

// Fond des deux rangées d'un puzzle (900×600)
export const rows = (top, bottom) =>
  `<rect width="900" height="300" fill="${top}"/><rect y="300" width="900" height="300" fill="${bottom}"/>`

// Étiquette en pastille, centrée sur sa case.
// w = largeur extérieure mesurée (trait compris), row = 0 | 1
export const LABEL_TEXT = '#1f2832'
export function pill (cx, row, w, stroke, text, { fill = '#fff', textFill = LABEL_TEXT, sx = 1, ls = 0 } = {}) {
  const sw = 3.5
  const y = 257 + row * 300
  const ww = w - sw
  // groupe repéré par sa case : le jeu affiche chaque étiquette en entier sur sa pièce
  const cell = row * 3 + Math.round((cx - 150) / 300)
  return `<g class="label" data-cell="${cell}">` +
    `<rect x="${+(cx - ww / 2).toFixed(2)}" y="${y + sw / 2}" width="${ww}" height="${38 - sw}" rx="${(38 - sw) / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>` +
    `<text x="${cx}" y="${282.65 + row * 300}" font-size="18.75" font-weight="bold" text-anchor="middle" fill="${textFill}"${sx !== 1 ? ` data-scale-x="${sx}"` : ''}${ls ? ` letter-spacing="${ls}"` : ''}>${text}</text>` +
    `</g>`
}

// Flux d'énergie en pointillés (traits de 6, bouts ronds, motif 10/8)
export const flow = (d, color = '#e1a801') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-dasharray="10 8"/>`

export const line = (x1, y1, x2, y2, stroke, w, cap = 'round') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`

// Repères de fin de schéma remplacés au build
export const CUTS = '<!--DECOUPES-->'
export const FRAME = '<!--CADRE-->'
