<script setup>
// Accès du personnel (5 touchers sur le logo) : code, puis effacer le classement
// ou quitter l'application de la borne.
import { KIOSK } from '~/utils/kiosk'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])
const { entries, clear } = useLeaderboard()

const pin = ref('')
const unlocked = ref(false)
const error = ref('')
const confirmClear = ref(false)
const message = ref('')
const canQuit = computed(() => import.meta.client && !!window.kiosk?.quit)

watch(() => props.open, (o) => {
  if (o) { pin.value = ''; unlocked.value = false; error.value = ''; confirmClear.value = false; message.value = '' }
})
function check () {
  if (pin.value === KIOSK.staffPin) { unlocked.value = true; error.value = '' }
  else { error.value = 'Code incorrect.'; pin.value = '' }
}
function wipe () {
  clear()
  confirmClear.value = false
  message.value = 'Classement effacé.'
}
function quit () { window.kiosk?.quit() }
const masked = computed(() => '•'.repeat(pin.value.length))
</script>

<template>
  <AppDialog :open="open" title="Espace personnel" @close="emit('close')">
    <div v-if="!unlocked" class="staff">
      <label for="staff-pin">Code</label>
      <input id="staff-pin" :value="masked" readonly inputmode="none" class="pin" aria-describedby="staff-err">
      <p v-if="error" id="staff-err" class="err" role="alert">{{ error }}</p>
      <TouchKeyboard v-model="pin" layout="digits" :maxlength="8" submit-label="OK" @submit="check" />
    </div>
    <div v-else class="staff">
      <p>{{ entries.length }} partie{{ entries.length > 1 ? 's' : '' }} au classement.</p>
      <template v-if="!confirmClear">
        <button class="btn ghost" type="button" :disabled="!entries.length" @click="confirmClear = true">Effacer le classement</button>
      </template>
      <div v-else class="confirm">
        <p>Effacer définitivement les {{ entries.length }} parties ?</p>
        <div class="actions">
          <button class="btn ghost" type="button" @click="confirmClear = false">Annuler</button>
          <button class="btn danger" type="button" @click="wipe">Effacer</button>
        </div>
      </div>
      <button v-if="canQuit" class="btn ghost" type="button" @click="quit">Quitter l’application</button>
      <p v-if="message" class="ok" role="status">{{ message }}</p>
    </div>
  </AppDialog>
</template>

<style scoped>
.staff { display: grid; gap: 12px; }
.staff label { font-weight: 700; }
.pin { min-height: 52px; padding: 0 14px; border-radius: 12px; border: 2px solid var(--line); font: inherit; font-size: 1.6rem; letter-spacing: .3em; caret-color: transparent; }
.err { color: var(--bad); font-weight: 700; }
.ok { color: var(--ok); font-weight: 700; }
.confirm { display: grid; gap: 10px; padding: 12px; border-radius: 12px; background: #fdf0ee; }
.actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
.btn.danger { background: var(--bad); color: #fff; }
</style>
