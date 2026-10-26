<script setup>
const { load } = useGame()
onMounted(load)
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
  <RewardToast />
</template>
