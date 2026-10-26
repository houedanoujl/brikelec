<script setup>
defineProps({ value: { type: Number, default: 0 }, size: { type: Number, default: 18 } })
</script>

<template>
  <span class="stars" role="img" :aria-label="`${value} étoile${value > 1 ? 's' : ''} sur 3`">
    <svg v-for="i in 3" :key="i" :class="{ off: i > value }" :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" fill="currentColor" />
    </svg>
  </span>
</template>
