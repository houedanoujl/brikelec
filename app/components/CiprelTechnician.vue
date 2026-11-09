<script setup lang="ts">
// Technicien·ne CIPREL en pied, style plat des schémas du client.
// Tenue relevée sur les photos des équipes CIPREL : combinaison bleu marine à
// manches longues, passepoil orange (col, patte de boutonnage, coutures d'épaule),
// bandes réfléchissantes grises bordées d'orange (deux par manche, une par jambe),
// logo CIPREL orange sur la poitrine, t-shirt orange au col, casque bleu à coquilles.
// Repère SVG : 160 × 196 (viewBox 0 14 160 196), personnage centré sur x = 80, pieds à y = 206.
// Les poses sont des CSS keyframes sur des <g> pivotant autour des épaules, coudes et hanches.

type Variant = 'femme' | 'homme'
type Pose = 'idle' | 'walk' | 'wave' | 'cheer' | 'point' | 'think'

const props = withDefaults(defineProps<{
  variant?: Variant
  pose?: Pose
  /** Hauteur en px */
  size?: number
  /** Miroir horizontal */
  flip?: boolean
  /** Remplace le libellé accessible calculé */
  label?: string
}>(), {
  variant: 'femme',
  pose: 'idle',
  size: 120,
  flip: false,
  label: undefined,
})

const INK = '#1f2832'
const ORANGE = '#ed7f06'
const COVERALL = '#2e3a6b'   // combinaison bleu marine CIPREL
const SEAM = '#26305a'       // plis et coutures de la combinaison
const BAND = '#c7ced6'       // bande réfléchissante
const HELMET = '#4b8fd8'     // casque bleu des techniciens
const HELMET_DARK = '#3a76bb'
const MUFF = '#4a5058'       // coquilles anti-bruit
const SCREEN = '#aac1db'     // écran du talkie-walkie
const HAIR = '#22160e'

const VB_W = 160
const VB_H = 196

const skin = computed(() => (props.variant === 'femme' ? '#8a5a34' : '#6b4423'))
const cheek = computed(() => (props.variant === 'femme' ? '#a86c45' : '#86553a'))
const width = computed(() => Math.round((props.size * VB_W) / VB_H))

const POSE_LABEL: Record<Pose, string> = {
  idle: '',
  walk: ' qui marche',
  wave: ' qui salue',
  cheer: ' qui se réjouit',
  point: ' qui montre quelque chose',
  think: ' qui réfléchit',
}
const ariaLabel = computed(() =>
  props.label ?? `${props.variant === 'femme' ? 'Technicienne' : 'Technicien'} CIPREL${POSE_LABEL[props.pose]}`,
)

// Ordre de dessin : le bras gauche passe devant la tête quand la main est au menton.
const layers = computed(() =>
  props.pose === 'think'
    ? ['arm-r', 'neck', 'torso', 'head', 'arm-l']
    : ['arm-l', 'arm-r', 'neck', 'torso', 'head'],
)
const armX = (layer: string) => (layer === 'arm-l' ? 62 : 98)

const openMouth = computed(() => props.pose === 'cheer' || props.pose === 'wave')

const TORSO = 'M58,98 Q58,84 72,83 H88 Q102,84 102,98 V130 Q102,135 97,135 H63 Q58,135 58,130 Z'
</script>

<template>
  <svg
    class="tech"
    :class="[`pose-${pose}`, `v-${variant}`, { flip }]"
    viewBox="0 14 160 196"
    :width="width"
    :height="size"
    role="img"
    :aria-label="ariaLabel"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g class="body">
      <!-- Jambes : combinaison, bande réfléchissante sous le genou, chaussures de sécurité -->
      <g class="leg leg-l">
        <line x1="71" y1="126" x2="71" y2="197" :stroke="INK" stroke-width="18" />
        <line x1="71" y1="126" x2="71" y2="197" :stroke="COVERALL" stroke-width="14" />
        <rect x="64" y="176" width="14" height="6" :fill="BAND" />
        <rect x="64" y="175.4" width="14" height="1.4" :fill="ORANGE" />
        <rect x="64" y="181.2" width="14" height="1.4" :fill="ORANGE" />
        <path d="M64,195 H79 V206 H59 Q55,206 55,202 Q55,195 64,195 Z" :fill="INK" :stroke="INK" stroke-width="2" stroke-linejoin="round" />
        <rect x="56" y="202" width="23" height="2.6" rx="1.3" fill="#5f6f7e" />
      </g>
      <g class="leg leg-r">
        <line x1="89" y1="126" x2="89" y2="197" :stroke="INK" stroke-width="18" />
        <line x1="89" y1="126" x2="89" y2="197" :stroke="COVERALL" stroke-width="14" />
        <rect x="82" y="176" width="14" height="6" :fill="BAND" />
        <rect x="82" y="175.4" width="14" height="1.4" :fill="ORANGE" />
        <rect x="82" y="181.2" width="14" height="1.4" :fill="ORANGE" />
        <path d="M96,195 H81 V206 H101 Q105,206 105,202 Q105,195 96,195 Z" :fill="INK" :stroke="INK" stroke-width="2" stroke-linejoin="round" />
        <rect x="81" y="202" width="23" height="2.6" rx="1.3" fill="#5f6f7e" />
      </g>

      <g class="upper">
        <template v-for="layer in layers" :key="layer">
          <!-- Bras : manche longue de la combinaison (deux bandes réfléchissantes), main -->
          <g v-if="layer === 'arm-l' || layer === 'arm-r'" class="arm" :class="layer">
            <line :x1="armX(layer)" y1="93" :x2="armX(layer)" y2="114" :stroke="INK" stroke-width="14" stroke-linecap="round" />
            <line :x1="armX(layer)" y1="93" :x2="armX(layer)" y2="114" :stroke="COVERALL" stroke-width="10" stroke-linecap="round" />
            <rect :x="armX(layer) - 5" y="101.5" width="10" height="4.6" :fill="BAND" />
            <rect :x="armX(layer) - 5" y="101" width="10" height="1.2" :fill="ORANGE" />
            <rect :x="armX(layer) - 5" y="105.6" width="10" height="1.2" :fill="ORANGE" />
            <g class="fore">
              <line :x1="armX(layer)" y1="113" :x2="armX(layer)" y2="131" :stroke="INK" stroke-width="13" stroke-linecap="round" />
              <line :x1="armX(layer)" y1="113" :x2="armX(layer)" y2="131" :stroke="COVERALL" stroke-width="9" stroke-linecap="round" />
              <rect :x="armX(layer) - 4.5" y="122.5" width="9" height="4.2" :fill="BAND" />
              <rect :x="armX(layer) - 4.5" y="122" width="9" height="1.1" :fill="ORANGE" />
              <rect :x="armX(layer) - 4.5" y="126.2" width="9" height="1.1" :fill="ORANGE" />
              <g v-if="pose === 'point' && layer === 'arm-r'" class="finger">
                <line :x1="armX(layer)" y1="136" :x2="armX(layer)" y2="144" :stroke="INK" stroke-width="7" stroke-linecap="round" />
                <line :x1="armX(layer)" y1="136" :x2="armX(layer)" y2="144" :stroke="skin" stroke-width="3.4" stroke-linecap="round" />
              </g>
              <circle :cx="armX(layer)" cy="134.5" r="5.8" :fill="skin" :stroke="INK" stroke-width="2" />
            </g>
          </g>

          <rect v-else-if="layer === 'neck'" x="74" y="72" width="12" height="16" rx="3" :fill="skin" :stroke="INK" stroke-width="2" />

          <!-- Buste : combinaison bleu marine, passepoil orange, logo CIPREL, poche zippée -->
          <g v-else-if="layer === 'torso'">
            <path :d="TORSO" :fill="COVERALL" :stroke="INK" stroke-width="2" stroke-linejoin="round" />
            <!-- t-shirt orange dans l'encolure -->
            <path d="M72,83 L80,95 L88,83 Z" :fill="ORANGE" :stroke="INK" stroke-width="1.4" stroke-linejoin="round" />
            <!-- coutures d'épaule (raglan) et col, passepoil orange -->
            <path d="M70.5,84 Q64.5,89 60,96.5 M89.5,84 Q95.5,89 100,96.5" fill="none" :stroke="ORANGE" stroke-width="1.3" stroke-linecap="round" />
            <path d="M70,83.2 L80,97.5 L90,83.2" fill="none" :stroke="ORANGE" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
            <!-- fermeture à glissière et patte de boutonnage passepoilée -->
            <line x1="80" y1="97.5" x2="80" y2="135" :stroke="SEAM" stroke-width="1.4" />
            <line x1="82.2" y1="97" x2="82.2" y2="135" :stroke="ORANGE" stroke-width="1.3" />
            <!-- poche de poitrine zippée -->
            <line x1="68" y1="99.5" x2="68" y2="110" :stroke="SEAM" stroke-width="1.4" stroke-linecap="round" />
            <rect x="67.2" y="98.6" width="1.6" height="2.4" rx=".5" fill="#9aa4b2" />
            <!-- logo CIPREL brodé : mot orange et sous-titre blanc -->
            <rect x="85.5" y="100.5" width="11" height="3.2" rx=".8" :fill="ORANGE" />
            <rect x="86.5" y="105" width="8" height="1.3" rx=".6" fill="#e8edf3" />
            <!-- taille marquée -->
            <path d="M58.6,121 H101.4" :stroke="SEAM" stroke-width="1.4" />
            <!-- Talkie-walkie clipsé (variante homme) -->
            <g v-if="variant === 'homme'">
              <line x1="71.5" y1="91" x2="71.5" y2="98" :stroke="INK" stroke-width="1.8" stroke-linecap="round" />
              <rect x="65.5" y="96.5" width="8.5" height="14" rx="2" :fill="INK" />
              <rect x="67" y="99" width="5.5" height="3.6" rx=".6" :fill="SCREEN" />
              <circle cx="68" cy="106.2" r=".9" fill="#7b8d9b" />
              <circle cx="71.4" cy="106.2" r=".9" fill="#7b8d9b" />
              <circle cx="73" cy="97.8" r=".9" :fill="ORANGE" />
            </g>
          </g>

          <!-- Tête -->
          <g v-else-if="layer === 'head'" class="head">
            <g v-if="variant === 'femme'">
              <!-- tresses courtes (carré tressé) sous le casque -->
              <rect x="52.5" y="46" width="55" height="35" rx="11" :fill="HAIR" :stroke="INK" stroke-width="1.6" />
              <path d="M56.5,56 V78 M60.5,62 V79.5 M99.5,62 V79.5 M103.5,56 V78" stroke="#4a3322" stroke-width="1.2" stroke-linecap="round" />
              <circle cx="56.5" cy="82.2" r="2" :fill="ORANGE" :stroke="INK" stroke-width="1" />
              <circle cx="61.6" cy="83.2" r="2" :fill="HELMET" :stroke="INK" stroke-width="1" />
              <circle cx="98.4" cy="83.2" r="2" :fill="HELMET" :stroke="INK" stroke-width="1" />
              <circle cx="103.5" cy="82.2" r="2" :fill="ORANGE" :stroke="INK" stroke-width="1" />
            </g>
            <circle cx="58.5" cy="61" r="4.6" :fill="skin" :stroke="INK" stroke-width="2" />
            <circle cx="101.5" cy="61" r="4.6" :fill="skin" :stroke="INK" stroke-width="2" />
            <circle cx="80" cy="58" r="22" :fill="skin" :stroke="INK" stroke-width="2" />
            <!-- naissance des cheveux -->
            <path d="M59.2,57 Q60,48 70,48 H90 Q100,48 100.8,57 Q92,51.6 80,52.4 Q68,51.6 59.2,57 Z" :fill="HAIR" />
            <template v-if="variant === 'femme'">
              <circle cx="58.5" cy="66.4" r="1.5" :fill="ORANGE" />
              <circle cx="101.5" cy="66.4" r="1.5" :fill="ORANGE" />
            </template>
            <template v-else>
              <rect x="58.6" y="50" width="4.6" height="11" rx="2" :fill="HAIR" />
              <rect x="96.8" y="50" width="4.6" height="11" rx="2" :fill="HAIR" />
              <!-- barbe courte -->
              <path d="M59.2,61 Q60,79.6 80,80.2 Q100,79.6 100.8,61 L97.4,63.5 Q96,75.2 80,75.8 Q64,75.2 62.6,63.5 Z" :fill="HAIR" />
            </template>
            <!-- visage -->
            <circle cx="69" cy="68.5" r="3" :fill="cheek" />
            <circle cx="91" cy="68.5" r="3" :fill="cheek" />
            <path class="brow brow-l" d="M68.5,57.6 Q72,55.6 75.5,57.4" fill="none" :stroke="INK" stroke-width="1.8" stroke-linecap="round" />
            <path class="brow brow-r" d="M84.5,57.4 Q88,55.6 91.5,57.6" fill="none" :stroke="INK" stroke-width="1.8" stroke-linecap="round" />
            <g class="eyes">
              <g class="pupils">
                <circle cx="72" cy="62.5" r="2.8" :fill="INK" />
                <circle cx="88" cy="62.5" r="2.8" :fill="INK" />
                <circle cx="72.9" cy="61.6" r=".95" fill="#fff" />
                <circle cx="88.9" cy="61.6" r=".95" fill="#fff" />
              </g>
              <path v-if="variant === 'femme'" d="M69.6,61 L67.6,59.6 M90.4,61 L92.4,59.6" :stroke="INK" stroke-width="1.4" stroke-linecap="round" />
            </g>
            <path v-if="openMouth" d="M73.8,69.4 Q80,78.6 86.2,69.4 Z" :fill="INK" stroke-linejoin="round" :stroke="INK" stroke-width="1.4" />
            <path v-else-if="pose === 'think'" d="M76,72.4 Q80.5,70.6 84.5,71" fill="none" :stroke="INK" stroke-width="2" stroke-linecap="round" />
            <path v-else d="M74.6,69.8 Q80,75 85.4,69.8" fill="none" :stroke="INK" stroke-width="2.2" stroke-linecap="round" />
            <!-- casque bleu CIPREL : coquilles anti-bruit relevées, autocollant CIPREL -->
            <path d="M57.5,49 C57.5,31 67,23 80,23 C93,23 102.5,31 102.5,49 Z" :fill="HELMET" :stroke="INK" stroke-width="2" stroke-linejoin="round" />
            <path d="M76.2,24.2 Q80,23.4 83.8,24.2 V47.5 H76.2 Z" :fill="HELMET_DARK" />
            <rect x="85.5" y="37" width="11" height="5.6" rx="1.2" fill="#fff" :stroke="INK" stroke-width="1" />
            <rect x="87" y="38.8" width="8" height="2" rx=".6" :fill="ORANGE" />
            <rect x="51" y="46" width="58" height="7.5" rx="3.75" :fill="HELMET" :stroke="INK" stroke-width="2" />
            <ellipse cx="55" cy="40" rx="4.6" ry="6.6" :fill="MUFF" :stroke="INK" stroke-width="1.8" />
            <ellipse cx="105" cy="40" rx="4.6" ry="6.6" :fill="MUFF" :stroke="INK" stroke-width="1.8" />
            <path d="M53.2,35.2 Q55,33.8 56.8,35.2 M103.2,35.2 Q105,33.8 106.8,35.2" fill="none" stroke="#d8c43a" stroke-width="1.2" stroke-linecap="round" />
          </g>
        </template>
      </g>
    </g>

    <!-- Bulles de réflexion -->
    <g v-if="pose === 'think'" class="thoughts">
      <circle class="dot d1" cx="113" cy="36" r="2.3" fill="#fff" :stroke="INK" stroke-width="1.6" />
      <circle class="dot d2" cx="119.5" cy="28" r="3.1" fill="#fff" :stroke="INK" stroke-width="1.6" />
      <circle class="dot d3" cx="127.5" cy="19.5" r="3.9" fill="#fff" :stroke="INK" stroke-width="1.6" />
    </g>
  </svg>
</template>

<style scoped>
.tech { display: block; overflow: visible; flex: none; max-width: 100%; height: auto; }
.tech.flip { transform: scaleX(-1); }

.tech g { transform-box: view-box; }
.body  { transform-origin: 80px 206px; }
.upper { transform-origin: 80px 135px; }
.head  { transform-origin: 80px 80px; }
.eyes  { transform-origin: 80px 62.5px; }
.leg-l { transform-origin: 71px 128px; }
.leg-r { transform-origin: 89px 128px; }
.arm-l { transform-origin: 62px 93px; }
.arm-r { transform-origin: 98px 93px; }
.arm-l .fore { transform-origin: 62px 113.5px; }
.arm-r .fore { transform-origin: 98px 113.5px; }
.brow, .pupils { transform-box: view-box; }

/* ---------- Poses figées (base, aussi utilisées en mouvement réduit) ---------- */
.arm-l { transform: rotate(7deg); }
.arm-r { transform: rotate(-7deg); }

.pose-wave .arm-r { transform: rotate(-150deg); }
.pose-wave .arm-r .fore { transform: rotate(-8deg); }

.pose-cheer .arm-l { transform: rotate(134deg); }
.pose-cheer .arm-r { transform: rotate(-134deg); }
.pose-cheer .arm-l .fore { transform: rotate(16deg); }
.pose-cheer .arm-r .fore { transform: rotate(-16deg); }
.pose-cheer .leg-l { transform: rotate(5deg); }
.pose-cheer .leg-r { transform: rotate(-5deg); }

.pose-point .arm-r { transform: rotate(-84deg); }
.pose-point .arm-l { transform: rotate(35deg); }
.pose-point .arm-l .fore { transform: rotate(-82deg); }
.pose-point .head { transform: rotate(4deg); }

.pose-think .arm-l { transform: rotate(-50deg); }
.pose-think .arm-l .fore { transform: rotate(-122deg); }
.pose-think .head { transform: rotate(-5deg); }
.pose-think .pupils { transform: translate(1.2px, -1.2px); }
.pose-think .brow-r { transform: translateY(-1.8px); }


/* ---------- Animations ---------- */
.eyes { animation: ct-blink 4.6s infinite; }
@keyframes ct-blink {
  0%, 93%, 100% { transform: scaleY(1); }
  95.5% { transform: scaleY(.12); }
}

/* idle : respiration */
.pose-idle .upper,
.pose-point .upper,
.pose-think .upper,
.pose-wave .upper { animation: ct-breathe 3.2s ease-in-out infinite; }
@keyframes ct-breathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1.3px); }
}
.pose-idle .arm-l { animation: ct-idle-l 3.2s ease-in-out infinite; }
.pose-idle .arm-r { animation: ct-idle-r 3.2s ease-in-out infinite; }
@keyframes ct-idle-l { 0%, 100% { transform: rotate(7deg); } 50% { transform: rotate(9.5deg); } }
@keyframes ct-idle-r { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(-9.5deg); } }

/* walk : marche en boucle */
.pose-walk .body { animation: ct-walk-bob .9s ease-in-out infinite; }
.pose-walk .upper { animation: ct-walk-sway .9s ease-in-out infinite; }
.pose-walk .leg-l { animation: ct-walk-leg-l .9s ease-in-out infinite; }
.pose-walk .leg-r { animation: ct-walk-leg-r .9s ease-in-out infinite; }
.pose-walk .arm-l { animation: ct-walk-arm-l .9s ease-in-out infinite; }
.pose-walk .arm-r { animation: ct-walk-arm-r .9s ease-in-out infinite; }
@keyframes ct-walk-bob {
  0%, 50%, 100% { transform: translateY(0); }
  25%, 75% { transform: translateY(-3px); }
}
@keyframes ct-walk-sway {
  0%, 50%, 100% { transform: rotate(0); }
  25% { transform: rotate(-2deg); }
  75% { transform: rotate(2deg); }
}
@keyframes ct-walk-leg-l {
  0%, 50%, 100% { transform: rotate(0) translateY(0); }
  25% { transform: rotate(9deg) translateY(-4px); }
}
@keyframes ct-walk-leg-r {
  0%, 50%, 100% { transform: rotate(0) translateY(0); }
  75% { transform: rotate(-9deg) translateY(-4px); }
}
@keyframes ct-walk-arm-l {
  0%, 100% { transform: rotate(7deg); }
  25% { transform: rotate(-12deg); }
  75% { transform: rotate(24deg); }
}
@keyframes ct-walk-arm-r {
  0%, 100% { transform: rotate(-7deg); }
  25% { transform: rotate(-24deg); }
  75% { transform: rotate(12deg); }
}

/* wave : salut de l'avant-bras */
.pose-wave .arm-r .fore { animation: ct-wave .5s ease-in-out infinite alternate; }
@keyframes ct-wave {
  from { transform: rotate(-28deg); }
  to { transform: rotate(18deg); }
}
.pose-wave .head { animation: ct-wave-head 1s ease-in-out infinite alternate; }
@keyframes ct-wave-head { from { transform: rotate(-2deg); } to { transform: rotate(2.5deg); } }

/* cheer : bras levés, petit saut */
.pose-cheer .body { animation: ct-jump 1s cubic-bezier(.4, 0, .4, 1) infinite; }
.pose-cheer .arm-l { animation: ct-cheer-l 1s ease-in-out infinite; }
.pose-cheer .arm-r { animation: ct-cheer-r 1s ease-in-out infinite; }
.pose-cheer .leg-l { animation: ct-tuck-l 1s ease-in-out infinite; }
.pose-cheer .leg-r { animation: ct-tuck-r 1s ease-in-out infinite; }
@keyframes ct-jump {
  0%, 100% { transform: translateY(0); }
  12% { transform: translateY(1.5px); }
  42% { transform: translateY(-11px); }
  72% { transform: translateY(0); }
}
@keyframes ct-cheer-l { 0%, 100% { transform: rotate(128deg); } 42% { transform: rotate(142deg); } }
@keyframes ct-cheer-r { 0%, 100% { transform: rotate(-128deg); } 42% { transform: rotate(-142deg); } }
@keyframes ct-tuck-l { 0%, 100% { transform: rotate(5deg); } 42% { transform: rotate(11deg) translateY(-2px); } }
@keyframes ct-tuck-r { 0%, 100% { transform: rotate(-5deg); } 42% { transform: rotate(-11deg) translateY(-2px); } }

/* point : bras tendu vers la droite */
.pose-point .arm-r { animation: ct-point 1.4s ease-in-out infinite; }
@keyframes ct-point {
  0%, 100% { transform: rotate(-84deg); }
  50% { transform: rotate(-79deg); }
}

/* think : main au menton */
.pose-think .head { animation: ct-think 3.2s ease-in-out infinite; }
@keyframes ct-think {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(-2deg); }
}
.thoughts .dot { animation: ct-dot 2.4s ease-in-out infinite; }
.thoughts .d2 { animation-delay: .3s; }
.thoughts .d3 { animation-delay: .6s; }
@keyframes ct-dot {
  0%, 100% { opacity: .25; }
  35%, 60% { opacity: 1; }
}

/* sur la borne (classe kiosk), le final reste animé même si Windows réduit les animations */
@media (prefers-reduced-motion: reduce) {
  html:not(.kiosk) .tech, html:not(.kiosk) .tech * { animation: none !important; }
}
</style>
