<script setup>
import { formatTime, formatKwh } from '~/composables/useGame'

const props = defineProps({
  highlight: { type: String, default: null },
  me: { type: Object, default: null }, // { rank, name, kwh, time, plantName } si hors du top affiché
  limit: { type: Number, default: 20 },
})
const { entries } = useLeaderboard()
const top = computed(() => entries.value.slice(0, props.limit))
const meOutside = computed(() => props.me && !top.value.some(e => e.id === props.highlight))
const medal = r => (r === 1 ? 'or' : r === 2 ? 'argent' : r === 3 ? 'bronze' : null)
</script>

<template>
  <div class="board">
    <p v-if="!top.length" class="state">Aucune partie enregistrée : soyez le premier ou la première !</p>
    <ol v-else class="list">
      <li v-for="e in top" :key="e.id" :class="{ me: e.id === props.highlight }">
        <span class="rank" :class="medal(e.rank)">
          <span class="sr-only">Rang </span>{{ e.rank }}
        </span>
        <span class="name">
          {{ e.name }}<template v-if="e.id === props.highlight"> (vous)</template>
        </span>
        <span class="kwh">{{ formatKwh(e.kwh) }}</span>
        <span class="meta">{{ e.plantName }} · {{ formatTime(e.time) }}</span>
      </li>
      <li v-if="meOutside" class="me gap">
        <span class="rank"><span class="sr-only">Rang </span>{{ me.rank }}</span>
        <span class="name">{{ me.name }} (vous)</span>
        <span class="kwh">{{ formatKwh(me.kwh) }}</span>
        <span class="meta">{{ me.plantName }} · {{ formatTime(me.time) }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.state { color: var(--ink-2); }
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; max-height: min(60dvh, 520px); overflow: auto; }
.list li {
  display: grid; grid-template-columns: 40px 1fr auto; grid-template-areas: "rank name kwh" "rank meta meta";
  align-items: center; column-gap: 12px; padding: 8px 12px; border-radius: 12px; background: #f4f7fa;
}
.list li.me { background: #fff3d1; box-shadow: inset 0 0 0 2px var(--orange); }
.list li.gap { margin-top: 10px; }
.rank { grid-area: rank; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-family: var(--font-display); font-weight: 800; background: #e2e8ee; border: 2px solid var(--ink); font-variant-numeric: tabular-nums; }
.rank.or { background: #f2c94c; }
.rank.argent { background: #cfd6dd; }
.rank.bronze { background: #e0ae84; }
.name { grid-area: name; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kwh { grid-area: kwh; font-family: var(--font-display); font-weight: 800; font-variant-numeric: tabular-nums; }
.meta { grid-area: meta; color: var(--ink-2); font-size: .85rem; font-variant-numeric: tabular-nums; }
</style>
