<script setup>
// Contrôle de fidélité : chaque SVG superposé à l'image d'origine du PDF.
import { PLANTS } from '~/data/plants'

useHead({ title: 'Comparaison 1:1 — La centrale du futur', meta: [{ name: 'robots', content: 'noindex' }] })
const { full, has } = useArt()
const items = [...PLANTS.map(p => ({ id: p.id, name: p.name, w: 900, h: 600 })), { id: 'ensemble', name: 'Modèle assemblé', w: 1200, h: 900 }]
const current = ref(items[0].id)
const item = computed(() => items.find(i => i.id === current.value))
const mix = ref(50)
const mode = ref('fondu')
</script>

<template>
  <div class="page">
    <header>
      <h1>Comparaison 1:1 avec les PDF du client</h1>
      <p>Le SVG redessiné est superposé à l'image d'origine extraite du PDF. En mode « différence », tout écart apparaît en clair sur fond noir.</p>
    </header>
    <div class="controls">
      <div class="tabs" role="tablist">
        <button v-for="i in items" :key="i.id" role="tab" :aria-selected="current === i.id" class="btn" :class="{ ghost: current !== i.id }" type="button" @click="current = i.id">
          {{ i.name }}
        </button>
      </div>
      <label class="slider">SVG {{ mix }} %
        <input v-model.number="mix" type="range" min="0" max="100" :disabled="mode === 'difference'">
      </label>
      <label><input v-model="mode" type="radio" value="fondu"> Fondu</label>
      <label><input v-model="mode" type="radio" value="difference"> Différence</label>
    </div>
    <div class="stack" :style="{ aspectRatio: `${item.w} / ${item.h}` }">
      <img :src="`/reference/${item.id}.jpg`" :alt="`Original : ${item.name}`">
      <div
        v-if="has(item.id)"
        class="svg"
        :style="mode === 'difference' ? { mixBlendMode: 'difference', opacity: 1 } : { opacity: mix / 100 }"
        v-html="full(item.id)"
      />
      <p v-else class="missing">SVG pas encore généré.</p>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1280px; margin: 0 auto; padding: 16px; display: grid; gap: 14px; }
h1 { font-size: 1.5rem; }
header p { color: var(--ink-2); margin-top: 4px; }
.controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.slider { display: flex; align-items: center; gap: 8px; font-variant-numeric: tabular-nums; }
.stack { position: relative; width: 100%; background: #000; }
.stack img, .stack .svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.stack .svg :deep(svg) { width: 100%; height: 100%; display: block; }
.missing { position: absolute; inset: auto 0 0; background: #fff; padding: 8px; }
</style>
