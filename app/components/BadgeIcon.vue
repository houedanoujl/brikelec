<script setup>
// Médaille d'une récompense : pastille colorée + pictogramme.
const props = defineProps({
  id: { type: String, required: true },
  earned: { type: Boolean, default: true },
  size: { type: [Number, String], default: 48 },
})
const GLYPHS = {
  etincelle: 'M24 10l3 9 9 3-9 3-3 9-3-9-9-3 9-3z',
  'sans-faute': 'M15 24.5l6 6 12-13',
  eclair: 'M26 9L15 26h9l-2 13 11-17h-9l2-13z',
  serie: 'M12 30l7-7 6 5 11-12 M30 16h6v6',
  'coup-de-pouce': 'M20 33h8 M21 37h6 M24 11a8 8 0 0 0-4.7 14.5c.8.6 1.2 1.6 1.2 2.5h7c0-.9.4-1.9 1.2-2.5A8 8 0 0 0 24 11z',
  etoiles: 'M24 11l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L24 29.6l-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.2z',
  fiches: 'M14 14a2 2 0 0 1 2-2h18v20H16a2 2 0 0 0-2 2V14z M14 34a2 2 0 0 1 2-2h18',
  centrale: 'M13 35V22l6 4v-4l6 4V14h6v21z M10 35h28',
  'mix-parfait': 'M24 12a12 12 0 1 0 0 24 12 12 0 0 0 0-24z M24 12v24 M12 24h24',
  podium: 'M11 35V27h8v8 M19 35V21h10v14 M29 35v-11h8v11 M24 12l1.4 2.8 3.1.5-2.3 2.2.6 3.1L24 19.1l-2.8 1.5.6-3.1-2.3-2.2 3.1-.5z',
  souvenir: 'M12 15h24v18H12z M16 29l5-6 4 4 3-3 4 5 M29 19.5h.01',
}
const HUES = {
  etincelle: '#e1a801', 'sans-faute': '#3f9b5a', eclair: '#e1a801', serie: '#3f9b5a', 'coup-de-pouce': '#3f80c4',
  etoiles: '#e1a801', fiches: '#b8895b', centrale: '#26456f', 'mix-parfait': '#c08a00', podium: '#c08a00', souvenir: '#6b7b8b',
}
const color = computed(() => (props.earned ? HUES[props.id] : '#b5bec7'))
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <circle cx="24" cy="24" r="22" :fill="earned ? color : '#eef1f4'" :stroke="color" stroke-width="2" />
    <path :d="GLYPHS[id]" fill="none" :stroke="earned ? '#fff' : '#9aa5b1'" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
