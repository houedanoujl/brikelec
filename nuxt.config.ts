// https://nuxt.com/docs/api/configuration/nuxt-config
// Borne hors ligne : application monopage (nuxt generate), sans serveur ni ressource distante.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: false,
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'La centrale du futur — CIPREL',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Choisissez une centrale (hydrogène, biomasse, cycle combiné, solaire, éolien), assemblez-la en 2 minutes et alimentez Abidjan.' },
        { name: 'theme-color', content: '#ed7f06' },
      ],
    },
  },
})
