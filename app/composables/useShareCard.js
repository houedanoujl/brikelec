// Carte souvenir PNG (site web) : la centrale du futur allumée + le bilan de la partie.
import { formatTime, formatKwh } from '~/composables/useGame'

function loadImage (src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function useShareCard () {
  const { full } = useArt()

  async function render ({ name, plantName, kwh, time, errors, rank }) {
    const W = 1200, H = 1200
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const g = c.getContext('2d')
    try { await document.fonts.load('800 60px "Baloo 2"'); await document.fonts.load('600 30px "Nunito"') } catch { /* police de repli */ }

    g.fillStyle = '#1f2832'
    g.fillRect(0, 0, W, H)
    const svg = full('ensemble')
    if (svg) {
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
      try { g.drawImage(await loadImage(url), 0, 0, 1200, 900) } finally { URL.revokeObjectURL(url) }
    }
    try {
      const logo = await loadImage('/brand/ciprel.png')
      g.fillStyle = '#ffffff'
      g.beginPath(); g.roundRect(W - 300, 940, 240, 107, 16); g.fill()
      g.drawImage(logo, W - 292, 944, 224, 100)
    } catch { /* logo indisponible */ }
    g.fillStyle = '#ffffff'
    g.font = '600 30px "Nunito", sans-serif'
    g.fillText(`${name || 'Joueur·se'} a alimenté Abidjan avec la centrale ${plantName}`.slice(0, 58), 60, 965)
    g.fillStyle = '#ed7f06'
    g.font = '800 96px "Baloo 2", sans-serif'
    g.fillText(formatKwh(kwh), 60, 1070)
    g.fillStyle = '#c9d4de'
    g.font = '600 32px "Nunito", sans-serif'
    const meta = [`Assemblée en ${formatTime(time)}`, `${errors} erreur${errors > 1 ? 's' : ''}`]
    if (rank) meta.push(rank === 1 ? '1ʳᵉ place au classement' : `${rank}ᵉ au classement`)
    g.fillText(meta.join('   ·   '), 60, 1130)
    return await new Promise(r => c.toBlob(r, 'image/png'))
  }

  async function share (data) {
    const blob = await render(data)
    const file = new File([blob], 'centrale-du-futur.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'La centrale du futur', text: `J'ai produit ${formatKwh(data.kwh)} en assemblant la centrale ${data.plantName} !` })
        return 'shared'
      } catch (e) {
        if (e?.name === 'AbortError') return 'aborted'
      }
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'centrale-du-futur.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    return 'downloaded'
  }

  return { render, share }
}
