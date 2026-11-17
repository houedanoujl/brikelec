<script setup>
// Chaque nouvelle partie recrée la page affichée.
// Borne seulement : retour à l'accueil après 60 s sans contact.
import { onKiosk } from '~/utils/kiosk'

const { round } = useGame()
if (onKiosk()) useIdle()
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage :page-key="route => `${route.fullPath}#${round}`" />
</template>
