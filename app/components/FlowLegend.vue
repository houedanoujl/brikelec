<script setup>
// Légende des tenons : forme ↔ type de flux, pour les types présents dans ce puzzle.
import { tabIconPath } from '~/utils/jigsaw'
import { FLOW_TYPES } from '~/data/plants'

const props = defineProps({
  edges: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})
const types = computed(() => Object.keys(FLOW_TYPES).filter(t => Object.values(props.edges).some(e => e?.type === t)))
</script>

<template>
  <ul class="legend" :class="{ compact }" aria-label="Légende des tenons : chaque forme correspond à un type de flux et pointe dans son sens">
    <li v-for="t in types" :key="t" :title="`${FLOW_TYPES[t].name} : ${FLOW_TYPES[t].hint}`">
      <svg viewBox="-62 -68 124 76" width="34" height="21" aria-hidden="true">
        <path :d="tabIconPath(t)" fill="#fff" stroke="#1f2832" stroke-width="7" stroke-linejoin="round" />
        <line x1="-62" y1="0" x2="62" y2="0" stroke="#1f2832" stroke-width="7" />
      </svg>
      <span class="name">{{ FLOW_TYPES[t].name }}</span>
      <span v-if="!compact" class="hint">{{ FLOW_TYPES[t].hint }}</span>
    </li>
  </ul>
</template>

<style scoped>
.legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 8px; }
.legend li {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px 4px 6px; border-radius: 999px; background: var(--surface); border: 2px solid var(--line);
}
.name { font-family: var(--font-display); font-weight: 700; font-size: .95rem; line-height: 1; }
.hint { color: var(--ink-2); font-size: .82rem; font-weight: 600; }
.compact li { padding: 2px 8px 2px 4px; }
.compact .name { font-size: .85rem; }
</style>
