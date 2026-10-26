// Les cinq centrales, dans l'ordre de la légende du modèle assemblé.
// pieces : libellés des 6 pièces, case par case (rangée du haut puis du bas).
// bg : fonds des deux rangées du schéma (relevés sur les PDF), sous les tenons.
// edges : emboîtement logique, un tenon par flux qui passe d'un composant à l'autre.
//   Clés : `v${c}${r}` = arête verticale à droite de la colonne c (rangée r),
//          `h${c}`     = arête horizontale sous la colonne c.
//   type : forme du tenon (voir FLOW_TYPES) ; dir : sens du flux (+1 vers la
//   droite ou le bas, −1 vers la gauche ou le haut) ; at : position (0 à 300) où
//   le flux franchit l'arête, relevée sur le schéma. Absente = arête plate.

export const FLOW_TYPES = {
  fluide: { name: 'Fluide', hint: 'eau, vapeur, gaz, hydrogène, air', shape: 'rond', phrase: 'un fluide' },
  energie: { name: 'Énergie', hint: 'électricité, lumière', shape: 'flèche', phrase: 'de l’énergie' },
  matiere: { name: 'Matière', hint: 'bois, structure', shape: 'clé carrée', phrase: 'de la matière' },
  meca: { name: 'Mouvement', hint: 'arbre en rotation', shape: 'queue d’aronde', phrase: 'un mouvement' },
}

export const PLANTS = [
  {
    id: 'hydrogene',
    name: 'Hydrogène',
    color: '#3f80c4',
    bg: ['#e3f1fa', '#cfe5f3'],
    pieces: ['Eau déminéralisée', 'Électrolyseur', 'Compresseur', 'Électricité renouvelable', 'Turbine à gaz', 'Stockage d’hydrogène'],
    edges: {
      v00: { type: 'fluide', dir: 1, at: 150 },     // eau → électrolyseur
      v10: { type: 'fluide', dir: 1, at: 172.5 },   // hydrogène → compresseur
      h2: { type: 'fluide', dir: 1, at: 150 },      // compresseur → stockage
      v11: { type: 'fluide', dir: -1, at: 105 },    // stockage → turbine à gaz
      h0: { type: 'energie', dir: -1, at: 247.5 },  // électricité renouvelable → électrolyse
    },
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
    edges: {
      v00: { type: 'matiere', dir: 1, at: 187.5 },  // bois → convoyeur
      v10: { type: 'matiere', dir: 1, at: 123.75 }, // convoyeur → silo
      h2: { type: 'matiere', dir: 1, at: 150 },     // silo → chaudière
      v11: { type: 'fluide', dir: -1, at: 127.5 },  // vapeur : chaudière → turbine
      v01: { type: 'meca', dir: -1, at: 157.5 },    // arbre : turbine → alternateur
    },
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
    edges: {
      v00: { type: 'fluide', dir: 1, at: 165 },     // gaz chauds → chaudière
      v10: { type: 'fluide', dir: 1, at: 150 },     // fumées → cheminée
      h1: { type: 'fluide', dir: 1, at: 150 },      // vapeur → turbine
      v11: { type: 'fluide', dir: 1, at: 187.5 },   // vapeur → aérocondenseur
      v01: { type: 'meca', dir: -1, at: 157.5 },    // arbre : turbine → alternateur
    },
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
    edges: {
      v00: { type: 'energie', dir: 1, at: 142.5 },  // lumière → panneaux
      v10: { type: 'energie', dir: 1, at: 127.5 },  // courant continu → onduleur
      h2: { type: 'energie', dir: 1, at: 150 },     // courant alternatif → transformateur
      v11: { type: 'energie', dir: -1, at: 153.75 }, // transformateur → batteries
      v01: { type: 'energie', dir: -1, at: 153.75 }, // batteries → réseau
    },
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
    edges: {
      v00: { type: 'fluide', dir: 1, at: 150 },     // vent (air en mouvement) → pales
      v10: { type: 'meca', dir: 1, at: 142.5 },     // rotation du rotor → génératrice
      h2: { type: 'energie', dir: 1, at: 150 },     // électricité produite → poste
      v01: { type: 'matiere', dir: 1, at: 150 },    // le mât repose sur la fondation
      v11: { type: 'energie', dir: 1, at: 217.5 },  // câble enterré → poste
    },
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
