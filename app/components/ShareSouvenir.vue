<script setup>
// Carte souvenir : aperçu de l'image et partage (LinkedIn en premier).
import { formatKwh, formatTime } from '~/composables/useGame'

const props = defineProps({
  data: { type: Object, required: true }, // { name, kwh, time, errors, badges, rank }
})
const emit = defineEmits(['shared'])
const { render } = useShareCard()
const config = useRuntimeConfig()

const blob = ref(null)
const preview = ref('')
const message = ref('')
const canNative = ref(false)

const siteUrl = computed(() => config.public.siteUrl || (import.meta.client ? window.location.origin : ''))
const text = computed(() => {
  const d = props.data
  const rank = d.rank ? ` et je suis ${d.rank === 1 ? '1er' : `${d.rank}e`} au classement` : ''
  return `J'ai allumé la centrale du futur de CIPREL : ${formatKwh(d.kwh)} produits en ${formatTime(d.time)}${rank} ! ` +
    `Hydrogène, biomasse, cycle combiné, solaire et éolien : 5 puzzles pour alimenter Abidjan. À vous de jouer : ${siteUrl.value} ` +
    '#CIPREL #Énergie #CôteDIvoire #Abidjan'
})

async function build () {
  blob.value = await render(props.data)
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = URL.createObjectURL(blob.value)
}
onMounted(async () => {
  await build()
  const file = new File([blob.value], 'centrale-du-futur.png', { type: 'image/png' })
  canNative.value = !!navigator.canShare?.({ files: [file] })
})
onBeforeUnmount(() => { if (preview.value) URL.revokeObjectURL(preview.value) })
watch(() => props.data.rank, build)

function download () {
  const a = document.createElement('a')
  a.href = preview.value
  a.download = 'centrale-du-futur-ciprel.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
async function copyText () {
  try { await navigator.clipboard.writeText(text.value); return true } catch { return false }
}
async function nativeShare () {
  const file = new File([blob.value], 'centrale-du-futur-ciprel.png', { type: 'image/png' })
  try {
    await navigator.share({ files: [file], text: text.value, title: 'La centrale du futur — CIPREL' })
    message.value = 'Carte partagée.'
    emit('shared')
  } catch (e) {
    if (e?.name !== 'AbortError') message.value = 'Partage impossible depuis cet appareil : téléchargez la carte.'
  }
}

const open = url => window.open(url, '_blank', 'noopener,noreferrer,width=640,height=720')

async function share (network) {
  const t = encodeURIComponent(text.value)
  const u = encodeURIComponent(siteUrl.value)
  if (network === 'linkedin') {
    // Sur téléphone, le partage natif envoie l'image directement dans l'application LinkedIn.
    if (canNative.value) return nativeShare()
    // Sur ordinateur, LinkedIn ne reçoit pas d'image par lien : on prépare le texte
    // et la carte, puis on ouvre l'éditeur de publication.
    const copied = await copyText()
    download()
    open(`https://www.linkedin.com/feed/?shareActive=true&text=${t}`)
    message.value = `Carte téléchargée${copied ? ' et texte copié' : ''} : dans LinkedIn, ajoutez l'image à votre publication (icône photo).`
  } else if (network === 'whatsapp') {
    open(`https://wa.me/?text=${t}`)
  } else if (network === 'facebook') {
    open(`https://www.facebook.com/sharer/sharer.php?u=${u}`)
  } else if (network === 'x') {
    open(`https://x.com/intent/post?text=${t}`)
  }
  emit('shared')
}
async function onCopy () {
  message.value = (await copyText()) ? 'Texte copié.' : 'Copie impossible : sélectionnez le texte ci-dessous.'
}
function onDownload () { download(); message.value = 'Carte téléchargée.'; emit('shared') }
</script>

<template>
  <section class="share" aria-labelledby="share-title">
    <h3 id="share-title">Partager ma carte souvenir</h3>
    <img v-if="preview" :src="preview" class="card" :alt="`Carte souvenir : ${formatKwh(data.kwh)} en ${formatTime(data.time)}`">
    <div v-else class="card ph" />
    <div class="buttons">
      <button class="btn linkedin" type="button" @click="share('linkedin')">
        <SocialIcon name="linkedin" :size="22" ink="#0a66c2" />Partager sur LinkedIn
      </button>
      <div class="others">
        <button class="btn ghost icon" type="button" aria-label="Partager sur WhatsApp" @click="share('whatsapp')"><SocialIcon name="whatsapp" :size="22" /></button>
        <button class="btn ghost icon" type="button" aria-label="Partager sur Facebook" @click="share('facebook')"><SocialIcon name="facebook" :size="22" /></button>
        <button class="btn ghost icon" type="button" aria-label="Partager sur X" @click="share('x')"><SocialIcon name="x" :size="22" /></button>
        <button v-if="canNative" class="btn ghost icon" type="button" aria-label="Autres applications" @click="nativeShare"><AppIcon name="share" :size="20" /></button>
        <button class="btn ghost icon" type="button" aria-label="Télécharger la carte" @click="onDownload"><AppIcon name="download" :size="20" /></button>
      </div>
    </div>
    <details class="text">
      <summary>Texte proposé</summary>
      <p>{{ text }}</p>
      <button class="btn ghost" type="button" @click="onCopy">Copier le texte</button>
    </details>
    <p v-if="message" class="msg" role="status">{{ message }}</p>
  </section>
</template>

<style scoped>
.share { display: grid; gap: 12px; padding: 14px; border-radius: var(--radius); background: var(--tray); border: 2px solid var(--line); }
.share h3 { font-size: 1.15rem; }
.card { width: 100%; max-width: 360px; border-radius: 14px; box-shadow: var(--shadow); justify-self: center; }
.card.ph { aspect-ratio: 1200 / 1260; background: #dfe8ee; }
.buttons { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.btn.linkedin { background: #0a66c2; color: #fff; border-color: #073f78; }
.btn.linkedin:hover { background: #0854a0; }
.others { display: flex; gap: 8px; flex-wrap: wrap; }
.others .btn { color: var(--ink); }
.text summary { cursor: pointer; font-weight: 700; color: var(--ink-2); }
.text p { margin: 8px 0; font-size: .95rem; background: var(--surface); border-radius: 12px; padding: 10px 12px; border: 1px solid var(--line); }
.msg { font-weight: 700; color: var(--ok); }
</style>
