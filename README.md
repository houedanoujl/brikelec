# La centrale du futur : le puzzle

Jeu Nuxt 4 de type drag & drop, conçu pour une **borne tactile Windows hors ligne** (application Electron), et qui marche aussi dans un navigateur. La vue d'ensemble « La centrale du futur » montre cinq centrales en couleur : hydrogène, biomasse, cycle combiné, solaire et éolien. Le joueur en **choisit une seule** et doit assembler ses 6 pièces en **2 minutes**. S'il réussit, seule sa centrale démarre et alimente **Abidjan à 100 %** ; sinon, un message d'échec s'affiche. Le classement est local à la borne.

```bash
npm install
npm run dev          # http://localhost:3000
npm run generate     # site statique (.output/public), sans serveur
npm run kiosk:dev    # site généré + application Electron (ajouter -- --test pour une fenêtre normale)
npm run kiosk:build  # installeur Windows (dist-electron/)
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

- **Emboîtement logique** : chaque tenon correspond à un flux qui passe d'un composant à l'autre. Il est placé là où le flux franchit l'arête dans le schéma, pointe dans le sens du flux, et sa forme dépend du type de flux :
  - rond pour un fluide (eau, vapeur, gaz, hydrogène, air) ; c'est le lobe du PDF ;
  - flèche pour l'énergie (électricité, lumière) ;
  - clé carrée pour la matière (bois, structure) ;
  - queue d'aronde crantée pour le mouvement (arbre en rotation).
  
  Les connexions sont décrites par centrale dans `app/data/plants.js` (`edges`) et la géométrie est dans `app/utils/jigsaw.js` (`TABS`). Une arête sans flux reste plate. `node scripts/preview-pieces.mjs <id>` produit une vue éclatée des pièces pour relecture.
- Les dessins restent au 1:1. Une fois le puzzle juste, le schéma du client s'affiche en entier (sans les découpes) et l'énergie y circule.
- Le chrono s'arrête dès que le plateau est juste (pas à l'affichage du bilan).
- Le plateau n'affiche aucune silhouette, et on ne vérifie qu'une fois les 6 cases remplies : les pièces justes se verrouillent, les fausses retournent au bac et comptent comme erreurs.
- Le nom de chaque pièce reste lisible : il est retiré du dessin découpé et redessiné au-dessus de toutes les pièces.
- Commandes :
  - souris, tactile ou stylet (Pointer Events) ;
  - clavier : Tab, Entrée pour prendre une pièce, flèches pour choisir la case, Entrée pour la poser, Échap pour annuler, Retour arrière pour renvoyer une pièce au bac.

## Règles et score

- Une partie = **une centrale**, choisie sur l'accueil (confirmation, puis puzzle).
- Les conseils s'affichent à chaque partie ; le **compte à rebours de 2:00** démarre au « C'est parti ! ». Il passe au rouge dans les 20 dernières secondes.
- À 0:00, le plateau se fige (une pièce tenue retourne à sa place) et le message « Échec : temps écoulé » s'affiche. La partie n'est pas classée.
- Réussite : **1000 kWh + 10 kWh par seconde restante** (2200 kWh au maximum). Les erreurs sont affichées mais ne comptent pas : elles coûtent déjà du temps. Étoiles selon le temps : 3 en 1 min ou moins, 2 en 1 min 30 ou moins, 1 au-delà.
- Les réglages sont dans `app/composables/useGame.js` (`RULES`).
- Final : seule la centrale choisie démarre (rotors, fumée, bulles), l'énergie part vers Abidjan, qui s'allume à 100 % avec feux d'artifice. Le bilan permet d'entrer un pseudo au clavier tactile du jeu (`TouchKeyboard.vue`) ; le score rejoint le classement.

## Borne hors ligne (Electron)

- **Aucune ressource distante** : polices Baloo 2 et Nunito servies depuis `public/fonts`, sons synthétisés, pas de serveur. `nuxt.config.ts` est en `ssr: false` et le site est généré par `nuxt generate`.
- `electron/main.cjs` sert `.output/public` sous l'origine fixe `app://borne/`, en plein écran kiosque :
  - pas de zoom, de menu contextuel ni de navigation externe ;
  - toute requête réseau est bloquée ;
  - l'écran ne se met pas en veille ;
  - redémarrage de la page si elle plante ;
  - lancement à l'ouverture de session Windows (version installée) ;
  - le réglage Windows « réduire les animations » est ignoré, pour garder le final : le preload expose `window.kiosk`, la page pose la classe `kiosk` sur `<html>`, ce qui neutralise les règles `prefers-reduced-motion` et `useGsap().reduced`.
- **Classement** : seule donnée conservée, dans le localStorage de l'application (`%APPDATA%\La centrale du futur\Local Storage`, clé `centrale-du-futur:classement:v1`, 200 parties au plus). Il survit aux redémarrages. La partie en cours, elle, reste en mémoire : rien ne passe d'un joueur au suivant.
- **Inactivité** : après 60 s sans contact (accueil, bilan, conseils, échec), la partie est remise à zéro et l'accueil s'affiche. Le minuteur est suspendu pendant le compte à rebours et pendant l'animation finale.
- **Personnel** : 5 touchers rapides sur le logo CIPREL ouvrent l'espace personnel, qui permet d'effacer le classement et de quitter l'application.
  - Le code est vérifié par l'application (`electron/main.cjs`), jamais par la page. Par défaut `2026` ; **à changer sur chaque borne** dans `%APPDATA%\La centrale du futur\borne.json` : `{ "pin": "4 à 8 chiffres" }`.
  - Trois erreurs bloquent l'accès 60 s. Quitter n'est possible que dans les 5 minutes qui suivent un code juste.
  - Avec un clavier branché, `Ctrl+Maj+Q` quitte aussi. Alt+F4 ne ferme pas la borne.
- **Deux exécutables** (`npm run kiosk:build`, dans `dist-electron/`, x64, non signés, testés depuis macOS sans Wine) :
  - `La-centrale-du-futur-BORNE-Setup-<version>.exe` : installeur de la borne. Plein écran verrouillé, lancement à l'ouverture de session.
  - `La-centrale-du-futur-TEST-PC-<version>.zip` : version de test pour un PC de bureau, sans installation. On extrait le dossier, puis on lance `La centrale du futur.exe`. Fenêtre agrandie qui se ferme normalement, F11 pour le plein écran, aucun lancement automatique.
  - Le mode est choisi au lancement : l'application installée par l'installeur (désinstalleur présent à côté de l'exécutable) est la borne ; toute autre copie est en mode test. `--test` force le mode test.
  - Icône par défaut d'Electron tant qu'aucune icône CIPREL 256 px n'est fournie (`build.win.icon`). Windows SmartScreen avertit au premier lancement (« Informations complémentaires », puis « Exécuter quand même »).
- **Réglages Windows conseillés** sur la borne :
  - ouverture de session automatique ;
  - veille et économiseur d'écran désactivés ;
  - gestes de bord d'écran coupés (stratégie `AllowEdgeSwipe = 0`) ;
  - notifications désactivées.

## Interface

Direction « jeu illustré » aux couleurs CIPREL (voir `DESIGN.md`) :
- polices Baloo 2 et Nunito ;
- techniciens CIPREL comme guides (`CiprelTechnician.vue`, `GuideBubble.vue`) ;
- techniciens CIPREL dans la tenue des équipes (combinaison marine, passepoil orange, bandes réfléchissantes, casque bleu à coquilles) ;
- skyline d'Abidjan (Tour F, pont ADO, cathédrale Saint-Paul), qui s'allume quand la centrale choisie démarre (`AbidjanSkyline.vue`) ;
- sons synthétisés avec Web Audio (`useSound.js`), coupables d'un bouton (le son revient à chaque nouvelle partie) ;
- animations désactivées si le système demande de réduire les mouvements (`prefers-reduced-motion`), sauf dans l'application de la borne.
