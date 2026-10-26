---
name: La centrale du futur — CIPREL
description: Jeu de puzzles illustré qui prolonge le monde des schémas du client, aux couleurs de CIPREL.
colors:
  ink: "#1f2832"
  ink-soft: "#44525f"
  navy: "#26456f"
  sky: "#e6f3f9"
  sky-deep: "#d8eef6"
  cream: "#fff6e3"
  surface: "#ffffff"
  line: "#c9dbe6"
  ciprel-orange: "#ed7f06"
  ciprel-orange-ink: "#a85200"
  ciprel-green: "#0d9330"
  success: "#0b7a28"
  danger: "#b3392f"
  energy: "#f5c242"
typography:
  display:
    fontFamily: "'Baloo 2', sans-serif"
    fontSize: "clamp(1.6rem, 4.2vw, 2.6rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Baloo 2', sans-serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "'Nunito', sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  numeric:
    fontFamily: "'Baloo 2', sans-serif"
    fontWeight: 700
rounded:
  sm: "10px"
  md: "18px"
  lg: "26px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ciprel-orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
    height: "48px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

## Overview
Un jeu, pas un tableau de bord. L'interface prolonge l'univers des schémas du client : aplats, traits encrés, pastilles arrondies cerclées d'un trait épais. L'orange CIPREL porte l'action et l'énergie, le vert CIPREL la réussite. Les schémas du client restent intouchables, au 1:1 : l'interface les encadre sans jamais les redessiner. Des techniciens CIPREL guident le joueur et fêtent ses réussites ; la ville d'Abidjan s'allume au fil des centrales.

## Colors
- **Encre** `#1f2832` : texte, traits des boutons et des pastilles (comme le trait des schémas).
- **Ciel** `#e6f3f9` : fond des pages, en écho au ciel de l'illustration d'ensemble.
- **Orange CIPREL** `#ed7f06` : bouton principal (texte encre, contraste de 5,4:1), jauges d'énergie, focus actif. Jamais comme couleur de texte : utiliser `#a85200`.
- **Vert CIPREL** `#0d9330` : bandes des gilets et pastilles décoratives. Pour un texte de réussite, utiliser `#0b7a28`.
- **Énergie** `#f5c242` : fond des compteurs de kWh, étoiles.
- La couleur de légende de chaque centrale (`app/data/plants.js`) marque sa progression.

## Typography
- **Baloo 2** (de 700 à 800) : titres, chiffres (kWh, chrono), boutons. Arrondie et joyeuse, lisible de loin sur une borne.
- **Nunito** (de 500 à 800) : texte courant, fiches et bulles des guides.
- Chiffres tabulaires (`font-variant-numeric: tabular-nums`) pour le chrono et le classement.
- Aucune étiquette en petites capitales au-dessus des titres : le titre parle seul.

## Layout
- Pages sur fond ciel, largeur maximale de 1440 px, marges de 16 px sur mobile.
- Accueil : la scène d'ensemble domine, la ville d'Abidjan l'accompagne juste dessous, le panneau des centrales et des guides est sur le côté (ou dessous sous 1024 px).
- Puzzle : barre compacte (retour, nom, jauge des pièces, chrono, erreurs, coup de pouce), puis le plateau sur toute la hauteur disponible.

## Elevation & Depth
Peu de profondeur, comme dans l'illustration. Panneaux : ombre douce décalée `0 6px 18px rgba(31,40,50,.10)`. Pièce en cours de glisser : ombre portée SVG plus forte. Pas de halo coloré sans décalage, pas d'ombre dure sans flou.

## Shapes
Formes en pilule pour les boutons, puces et pastilles (comme les étiquettes des schémas). Panneaux à 26 px de rayon. Trait de 3 px couleur encre sur les boutons et la bulle des guides.

## Components
- **Bouton principal** : pilule orange, trait encre de 3 px, Baloo 700 ; au survol, l'orange fonce légèrement et le bouton s'élève d'1 px.
- **Bouton secondaire** : pilule blanche, trait encre de 3 px, texte marine.
- **Puce** : pilule blanche au trait clair, avec chiffre et pictogramme.
- **Bulle de guide** : bulle blanche au trait encre de 3 px et 18 px de rayon, avec sa pointe vers le personnage.
- **Jauge des pièces** : 6 pastilles qui se remplissent à l'orange.
- **Toast de récompense** : médaille et nom, glisse depuis le haut et disparaît seul après 3,5 s.

## Do's and Don'ts
- Garder les schémas du client tels quels : animer un schéma (flux qui circulent) ne doit jamais changer son rendu au repos.
- Toujours un pictogramme dessiné (SVG au trait) : jamais d'emoji.
- Pas de dégradé violet, pas de texte en dégradé, pas de verre dépoli décoratif.
- Pas de liseré coloré épais sur un côté des cartes ou encarts.
- Contraste d'au moins 4,5:1 pour le texte ; focus visible (anneau marine de 3 px, ou halo de la pièce sélectionnée).
- Respecter `prefers-reduced-motion` : toutes les animations en boucle s'arrêtent.
