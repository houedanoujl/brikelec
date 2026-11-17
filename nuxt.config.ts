// https://nuxt.com/docs/api/configuration/nuxt-config
// Application monopage, deux cibles :
// - borne hors ligne (nuxt generate + Electron) : sans serveur ni ressource distante ;
// - site web (nuxt build, Vercel) : même jeu, avec le classement partagé (/api/scores).
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
  runtimeConfig: {
    // Classement Supabase du site web (côté serveur uniquement) : NUXT_SUPABASE_URL, NUXT_SUPABASE_KEY
    supabaseUrl: '',
    supabaseKey: '',
    // Signature des jetons de partie (anti-triche du classement) : NUXT_GAME_SECRET
    gameSecret: '',
    public: {
      // adresse publique du jeu (liens de partage) : NUXT_PUBLIC_SITE_URL
      siteUrl: '',
    },
  },
  nitro: {
    // Secours si Supabase n'est pas configuré : stockage fichier (.data/scores).
    storage: {
      scores: { driver: 'fs', base: './.data/scores' },
    },
  },
})
