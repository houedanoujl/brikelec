// Sons du jeu, synthétisés avec Web Audio (aucun fichier à charger).
// Discrets et liés à une action : prise et pose d'une pièce, erreur, verrouillage,
// centrale terminée, mise sous tension, ville qui s'allume, récompense, final.
const KEY = 'centrale-du-futur:son'
let ctx = null
let master = null

function audio () {
  if (import.meta.server) return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.35
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// une note : fréquence, départ (s), durée (s), forme d'onde, volume, glissando éventuel
function tone (f, t0, dur, { type = 'sine', vol = 0.5, to = null, attack = 0.008 } = {}) {
  const c = audio()
  if (!c) return
  const t = c.currentTime + t0
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.05)
}

const SOUNDS = {
  pick: () => tone(520, 0, 0.07, { type: 'triangle', vol: 0.25, to: 640 }),
  snap: () => { tone(300, 0, 0.09, { type: 'square', vol: 0.12, to: 180 }); tone(900, 0, 0.05, { vol: 0.15 }) },
  wrong: () => { tone(220, 0, 0.18, { type: 'sawtooth', vol: 0.12, to: 160 }); tone(180, 0.16, 0.26, { type: 'sawtooth', vol: 0.12, to: 120 }) },
  lock: () => { tone(880, 0, 0.18, { vol: 0.25 }); tone(1320, 0.05, 0.22, { vol: 0.15 }) },
  complete: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.45, { type: 'triangle', vol: 0.35 })),
  // une centrale se met sous tension : montée façon turbine puis bourdonnement bref
  power: () => { tone(80, 0, 1.1, { type: 'sawtooth', vol: 0.08, to: 240, attack: 0.3 }); tone(160, 0.2, 1, { vol: 0.12, to: 480, attack: 0.3 }); tone(960, 1.05, 0.5, { vol: 0.12 }) },
  // la ville s'allume : carillon scintillant, en vague
  city: () => [1318.5, 1568, 1760, 2093, 1975.5, 2349.3].forEach((f, i) => tone(f, 0.25 + i * 0.13, 0.6, { vol: 0.1 })),
  badge: () => { tone(1568, 0, 0.12, { vol: 0.18 }); tone(2093, 0.09, 0.3, { vol: 0.16 }) },
  fanfare: () => {
    const seq = [[523.25, 0], [659.25, 0.16], [783.99, 0.32], [1046.5, 0.5], [783.99, 0.74], [1046.5, 0.9]]
    seq.forEach(([f, t]) => { tone(f, t, 0.5, { type: 'triangle', vol: 0.3 }); tone(f / 2, t, 0.5, { vol: 0.15 }) })
  },
}

export function useSound () {
  const muted = useState('sound-muted', () => false)
  const loaded = useState('sound-loaded', () => false)
  if (import.meta.client && !loaded.value) {
    loaded.value = true
    try { muted.value = localStorage.getItem(KEY) === 'off' } catch { /* stockage indisponible */ }
  }
  function play (name) {
    if (muted.value || !SOUNDS[name]) return
    try { SOUNDS[name]() } catch { /* audio indisponible */ }
  }
  function toggle () {
    muted.value = !muted.value
    try { localStorage.setItem(KEY, muted.value ? 'off' : 'on') } catch { /* idem */ }
    if (!muted.value) play('snap')
  }
  return { muted, play, toggle }
}
