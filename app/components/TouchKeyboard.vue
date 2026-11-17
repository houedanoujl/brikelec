<script setup>
// Clavier tactile de la borne (AZERTY ou pavé numérique).
// Le champ associé est en lecture seule avec inputmode="none" : le clavier de
// Windows ne s'ouvre pas par-dessus.
const props = defineProps({
  modelValue: { type: String, default: '' },
  maxlength: { type: Number, default: 20 },
  layout: { type: String, default: 'azerty' }, // 'azerty' | 'digits'
  submitLabel: { type: String, default: 'Valider' },
})
const emit = defineEmits(['update:modelValue', 'submit'])
const { play } = useSound()

const ROWS = {
  azerty: ['1234567890', 'AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN-'].map(r => r.split('')),
  digits: ['123', '456', '789'].map(r => r.split('')),
}
const rows = computed(() => ROWS[props.layout] || ROWS.azerty)

// majuscule en début de mot, minuscules ensuite
function type (k) {
  const v = props.modelValue
  if (v.length >= props.maxlength) return
  const start = !v || /[\s-]$/.test(v)
  emit('update:modelValue', v + (/[A-Z]/.test(k) && !start ? k.toLowerCase() : k))
  play('pick')
}
function space () {
  const v = props.modelValue
  if (!v || v.endsWith(' ') || v.length >= props.maxlength) return
  emit('update:modelValue', `${v} `)
}
function erase () {
  emit('update:modelValue', props.modelValue.slice(0, -1))
}
</script>

<template>
  <div class="kb" :class="`kb-${layout}`" role="group" aria-label="Clavier">
    <div v-for="(row, i) in rows" :key="i" class="row">
      <button v-for="k in row" :key="k" type="button" class="key" @click="type(k)">{{ k }}</button>
      <button v-if="layout === 'azerty' && i === rows.length - 1" type="button" class="key wide" aria-label="Effacer" @click="erase">
        <AppIcon name="back" :size="22" />
      </button>
    </div>
    <div class="row">
      <button v-if="layout === 'azerty'" type="button" class="key space" @click="space">Espace</button>
      <template v-else>
        <button type="button" class="key" aria-label="Effacer" @click="erase"><AppIcon name="back" :size="22" /></button>
        <button type="button" class="key" @click="type('0')">0</button>
      </template>
      <button type="button" class="key ok" @click="emit('submit')">{{ submitLabel }}</button>
    </div>
  </div>
</template>

<style scoped>
.kb { display: grid; gap: 6px; padding: 10px; border-radius: var(--radius); background: var(--tray); border: 2px solid var(--line); }
.row { display: flex; gap: 6px; justify-content: center; }
.key {
  flex: 1 1 0; min-width: 0; min-height: 56px; max-width: 72px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 12px; border: 2px solid var(--ink); background: var(--surface);
  font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; color: var(--ink);
  cursor: pointer; touch-action: manipulation;
  box-shadow: 0 2px 0 var(--ink);
}
.key:active { transform: translateY(2px); box-shadow: none; background: #fff3d1; }
.key.wide { max-width: 110px; flex-grow: 1.6; }
.key.space { max-width: none; flex-grow: 5; font-size: 1.05rem; }
.key.ok { max-width: none; flex-grow: 2.4; background: var(--orange); font-size: 1.1rem; }
.kb-digits .key { max-width: none; min-height: 64px; }
.kb-digits .key.ok { flex-grow: 1; }
</style>
