# La centrale du futur : le puzzle

Jeu Nuxt 4 de type drag & drop, qui marche aussi bien sur téléphone que sur ordinateur. La vue d'ensemble « La centrale du futur » montre cinq centrales en silhouette : hydrogène, biomasse, cycle combiné, solaire et éolien. Chacune cache un puzzle de 6 pièces. Une fois le puzzle juste, la centrale s'allume dans le paysage. Le jeu comprend un score en kWh, 11 récompenses et un classement partagé.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # build de production (.output)
```

## Schémas fidèles au 1:1

Les PDF du client ne contiennent qu'une image JPEG à 4× la taille de la page, sans aucun vecteur. Les schémas ont donc été **redessinés en SVG à partir de mesures prises sur ces images**, puis contrôlés pixel à pixel.

| Dossier / fichier | Rôle |
|---|---|
| `public/reference/*.jpg` | images d'origine extraites des PDF (référence de comparaison, aussi servies à `/comparaison`) |
| `art/<id>.mjs` | source de chaque schéma (exporte le SVG ; primitives mesurées) |
| `art/lib.mjs` | briques communes : étiquettes en pastille, flux en pointillés… |
| `app/utils/jigsaw.js` | géométrie des découpes, ajustée sur la position de chaque tiret du PDF |
| `scripts/build-svg.mjs` | `npm run svg:build` : convertit les textes (Trebuchet MS, la police du client) en tracés et ajoute découpes et cadre, puis écrit `app/assets/svg/` |
| `scripts/compare.mjs` | `npm run svg:check` : rend chaque SVG à 4× et le compare au JPEG ; critère ≥ 98 % des pixels sous ΔE 6 ; écrit les cartes d'écarts dans `reference/diff/` |
| `/comparaison` | page de validation : SVG superposé à l'original (fondu ou différence) |

Les textes sont convertis en tracés parce que Trebuchet MS n'existe pas sur Android et n'est pas une Google Font. La police n'est pas redistribuée : le build la lit sur la machine (macOS et Windows l'ont ; sinon, définir les variables `TREBUCHET_REGULAR` et `TREBUCHET_BOLD`). Seuls les SVG générés sont versionnés et utilisés par le site.

## Mécanique du puzzle

- Les pièces sont découpées dans le schéma avec la forme exacte des lobes du PDF : une fois assemblé, le puzzle est identique au document du client.
- Pour que l'emboîtement ne saute pas aux yeux :
  - des lobes leurres, tirés au hasard à chaque partie, bordent les côtés extérieurs ;
  - le plateau n'affiche aucune silhouette ;
  - on ne vérifie qu'une fois les 6 cases remplies : les pièces justes se verrouillent, les fausses retournent au bac et comptent comme erreurs.
- Commandes :
  - souris, tactile ou stylet (Pointer Events) ;
  - clavier : Tab, Entrée pour prendre une pièce, flèches pour choisir la case, Entrée pour la poser, Échap pour annuler, Retour arrière pour renvoyer une pièce au bac.

## Score et récompenses

Une centrale rapporte 1000 kWh, moins 2 par seconde et 50 par erreur, avec un plancher de 100. S'y ajoutent les bonus « Sans faute » (+200) et « Éclair » (+150, en moins de 45 s), puis un multiplicateur de série : ×1,2 après 2 puzzles sans faute d'affilée, ×1,5 à partir de 3. Chaque coup de pouce utilisé coûte 100 kWh.

Les 11 récompenses sont définies dans `app/composables/useGame.js` :
- Étincelle
- Sans faute
- Éclair
- Série verte
- Coup de pouce
- Trois étoiles
- Encyclopédiste (fiches « Le saviez-vous ? »)
- Centrale du futur
- Mix parfait
- Podium
- Carte souvenir

## Classement (Supabase)

Il passe par l'API Nitro `GET/POST /api/scores`, qui valide les données côté serveur. Deux modes de stockage :
- **Supabase**, si `NUXT_SUPABASE_URL` et `NUXT_SUPABASE_KEY` (clé publishable) sont définis (voir `.env.example`). Exécuter une fois `supabase/migrations/0001_scores.sql` dans l'éditeur SQL du projet. La table est en lecture publique ; les écritures passent uniquement par la fonction `submit_score`, qui valide la partie côté base.
- **Secours** : sans ces variables, les scores sont stockés via Nitro dans `.data/scores` (développement local).

`NUXT_PUBLIC_SITE_URL` sert à construire les liens de partage (LinkedIn, WhatsApp, Facebook, X).

## Interface

Direction « jeu illustré » aux couleurs CIPREL (voir `DESIGN.md`) :
- polices Baloo 2 et Nunito ;
- techniciens CIPREL comme guides (`CiprelTechnician.vue`, `GuideBubble.vue`) ;
- skyline d'Abidjan (Tour F, pont ADO, cathédrale Saint-Paul), qui s'allume au fil des centrales (`AbidjanSkyline.vue`) ;
- sons synthétisés avec Web Audio (`useSound.js`), coupables d'un bouton ;
- animations désactivées si le système demande de réduire les mouvements (`prefers-reduced-motion`).
