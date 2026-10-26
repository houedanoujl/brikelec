// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'La centrale du futur — CIPREL',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Assemblez les cinq centrales (hydrogène, biomasse, cycle combiné, solaire, éolien) pour allumer la centrale du futur.' },
        { name: 'theme-color', content: '#ed7f06' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800&display=swap' },
      ],
    },
  },
  runtimeConfig: {
    // Classement Supabase (côté serveur uniquement) : NUXT_SUPABASE_URL, NUXT_SUPABASE_KEY
    supabaseUrl: '',
    supabaseKey: '',
    public: {
      // adresse publique du jeu (liens de partage, image Open Graph) : NUXT_PUBLIC_SITE_URL
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
