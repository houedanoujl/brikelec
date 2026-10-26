// SVG des schémas (générés par scripts/build-svg.mjs à partir de art/).
const RAW = import.meta.glob('../assets/svg/*.svg', { query: '?raw', import: 'default', eager: true })

const byId = Object.fromEntries(
  Object.entries(RAW).map(([path, svg]) => [path.split('/').pop().replace('.svg', ''), svg]),
)

const inner = svg => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export function useArt () {
  return {
    has: id => id in byId,
    // schéma complet, tel que dans le PDF (découpes et cadre compris)
    full: id => byId[id] || '',
    // contenu seul, sans les pointillés ni le cadre : sert à découper les pièces
    art: id => inner(byId[id] || '')
      .replace(/<g id="decoupes"[\s\S]*?<\/g>/, '')
      .replace(/<rect id="cadre"[^>]*\/>/, ''),
    inner: id => inner(byId[id] || ''),
  }
}
