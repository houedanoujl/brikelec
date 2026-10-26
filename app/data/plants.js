// Les cinq centrales, dans l'ordre de la légende du modèle assemblé.
// pieces : libellés des 6 pièces, case par case (rangée du haut puis du bas).
// bg : fonds des deux rangées du schéma (relevés sur les PDF), pour les lobes leurres.

export const PLANTS = [
  {
    id: 'hydrogene',
    name: 'Hydrogène',
    color: '#3f80c4',
    bg: ['#e3f1fa', '#cfe5f3'],
    pieces: ['Eau déminéralisée', 'Électrolyseur', 'Compresseur', 'Électricité renouvelable', 'Turbine à gaz', 'Stockage d’hydrogène'],
    fact: {
      title: 'Stocker l’électricité sous forme de gaz',
      steps: [
        'L’électricité renouvelable alimente un électrolyseur qui sépare l’eau déminéralisée en hydrogène (H₂) et oxygène (O₂).',
        'Le compresseur comprime l’hydrogène pour le stocker dans des réservoirs sphériques.',
        'Quand le réseau en a besoin, une turbine à gaz brûle l’hydrogène et produit de l’électricité sans émettre de CO₂ : elle ne rejette que de la vapeur d’eau.',
      ],
    },
  },
  {
    id: 'biomasse',
    name: 'Biomasse',
    color: '#b8895b',
    bg: ['#f4ebdc', '#e2d2b8'],
    pieces: ['Stock de bois', 'Convoyeur', 'Silo', 'Alternateur', 'Turbine à vapeur', 'Chaudière et cheminée'],
    fact: {
      title: 'Le bois devient électricité',
      steps: [
        'Le bois (plaquettes, résidus forestiers) est acheminé par convoyeur jusqu’au silo.',
        'Il brûle dans la chaudière, dont la chaleur transforme l’eau en vapeur sous pression.',
        'La vapeur fait tourner une turbine reliée à un alternateur. Le CO₂ rejeté avait été capté par les arbres pendant leur croissance.',
      ],
    },
  },
  {
    id: 'cycle',
    name: 'Cycle combiné',
    color: '#6b7b8b',
    bg: ['#e5ecf2', '#d5dee5'],
    pieces: ['Turbine à gaz', 'Chaudière de récupération', 'Cheminée', 'Alternateur', 'Turbine à vapeur', 'Aérocondenseur'],
    fact: {
      title: 'Deux turbines pour un seul combustible',
      steps: [
        'Une turbine à gaz produit une première fois de l’électricité.',
        'Ses gaz d’échappement, encore très chauds, passent dans une chaudière de récupération qui produit de la vapeur.',
        'Cette vapeur entraîne une seconde turbine, puis l’aérocondenseur la refroidit pour la réutiliser. Le rendement dépasse 60 %, contre environ 40 % pour une turbine seule.',
      ],
    },
  },
  {
    id: 'solaire',
    name: 'Solaire',
    color: '#26456f',
    bg: ['#fff6d9', '#e3eedd'],
    pieces: ['Soleil', 'Panneaux photovoltaïques', 'Onduleur', 'Réseau électrique', 'Stockage par batteries', 'Transformateur'],
    fact: {
      title: 'De la lumière au réseau',
      steps: [
        'Les panneaux photovoltaïques transforment la lumière du soleil en courant continu (DC).',
        'L’onduleur le convertit en courant alternatif (AC), celui du réseau.',
        'Le transformateur élève la tension. Les batteries stockent le surplus de midi pour le restituer le soir.',
      ],
    },
  },
  {
    id: 'eolien',
    name: 'Éolien',
    color: '#8d9cab',
    bg: ['#e3f0f8', '#d7e6d1'],
    pieces: ['Vent', 'Pales du rotor', 'Nacelle et génératrice', 'Mât', 'Fondation', 'Poste de raccordement'],
    fact: {
      title: 'Capter l’énergie du vent',
      steps: [
        'Le vent fait tourner les pales du rotor, à environ 10 à 20 tours par minute.',
        'Dans la nacelle, au sommet du mât, la génératrice transforme cette rotation en électricité.',
        'Un câble enterré, partant de la fondation, achemine le courant jusqu’au poste de raccordement au réseau.',
      ],
    },
  },
]

export const PLANT_BY_ID = Object.fromEntries(PLANTS.map(p => [p.id, p]))
