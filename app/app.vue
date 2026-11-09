<script setup>
// Borne : retour à l'accueil après 60 s sans contact ; chaque nouvelle partie
// recrée la page affichée.
const { round } = useGame()
useIdle()
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage :page-key="route => `${route.fullPath}#${round}`" />
</template>
