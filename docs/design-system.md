# Mood Day V2 — système de design « Carnet vivant »

## Intention

Mood Day ressemble à un carnet adulte que l'on retrouve avec plaisir, pas à un
tableau de bord clinique. La direction associe la chaleur du papier, une
typographie éditoriale, des surfaces tactiles et une structure extrêmement
lisible. Chaque détail doit soutenir la promesse : **« Moins saisir. Mieux
comprendre. Mieux se préparer. »**

Le ton est calme, précis, chaleureux et non infantilisant. En français,
l'interface tutoie. Elle ne félicite pas une « performance », ne crée aucune
dette après une absence et ne transforme jamais une association en causalité.

Le kit de douze illustrations de production et ses règles d’accessibilité sont
documentés dans [`docs/v2/illustration-kit.md`](./v2/illustration-kit.md). Les
écrans web utilisent le composant central `BrandIllustration` afin de conserver
dimensions, optimisation et texte alternatif cohérents.

## Marque et logo

Le symbole retenu provisoirement fait évoluer le calendrier-cœur historique :

- le calendrier signifie la continuité entre les jours et les rendez-vous ;
- le cœur abricot signifie le soin choisi, sans croix ni symbole médical ;
- le dessin arrondi et asymétrique reste lisible à 16 px ;
- l'app icon utilise un fond vert profond `#155C5A`, un trait papier
  `#FFF8ED` et un cœur abricot `#F3A67A`.

Les trois concepts déterministes sont conservés dans
`public/brand/concepts/`. `01-calendar-heart.svg` est la proposition de
production ; `02-living-journal.svg` et `03-continuity-thread.svg` restent des
alternatives jusqu'à validation de marque. Le nom s'écrit toujours **Mood Day**.

## Tokens

| Rôle          | Token           | Valeur    | Usage                          |
| ------------- | --------------- | --------- | ------------------------------ |
| Papier        | `canvas`        | `#F6F3EC` | fond global                    |
| Feuille       | `surface`       | `#FFFCF7` | cartes souples                 |
| Feuille forte | `surfaceStrong` | `#FFFFFF` | saisie et modales              |
| Encre         | `ink`           | `#18312F` | texte principal                |
| Encre douce   | `inkMuted`      | `#61716F` | aide et métadonnées            |
| Soin          | `primary`       | `#1E7775` | action principale              |
| Soin profond  | `primaryDeep`   | `#155C5A` | app icon et contrastes         |
| Soin pâle     | `primarySoft`   | `#DDEDE9` | regroupements                  |
| Sauge         | `sage`          | `#AFC9BC` | habitudes et couverture        |
| Abricot       | `apricot`       | `#F3C9A8` | humain, rendez-vous            |
| Lavande       | `lavender`      | `#D9D2E9` | repères et temps               |
| Bordure       | `border`        | `#DDE4DF` | séparation non dominante       |
| Danger        | `danger`        | `#A13F49` | actions réellement sensibles   |
| Focus         | `focus`         | `#166F9E` | focus AA distinct de la marque |

Les couleurs ne portent jamais seules une information. Une source, un conflit,
une permission ou une qualité comporte toujours un libellé ou une icône avec
nom accessible.

## Typographie et composition

- Titres éditoriaux : pile serif native (`ui-serif`, Georgia, Cambria), avec
  tracking légèrement resserré. Elle est volontairement limitée aux grands
  titres et phrases de repère.
- Interface : pile sans-serif native, optimisée pour le rendu et les tailles
  dynamiques sur chaque plateforme.
- Données techniques : monospace uniquement pour les identifiants de diagnostic
  interne, jamais dans un parcours normal.
- Largeur de lecture maximale : 68 caractères pour une explication.
- Interlignage : 1,4 à 1,55 pour le corps ; aucun texte essentiel sous 12 px.

Les rayons sont de 12 px (élément compact), 18 px (contrôle), 28 px (carte) et
32 px (sheet/modal). L'espacement suit une grille 4 px. Une carte principale a
20 à 32 px de respiration selon la largeur.

## Navigation

Quatre intentions seulement sont persistantes :

1. **Aujourd'hui** — une action recommandée, puis la possibilité de s'arrêter ;
2. **Repères** — timeline, revue et pistes explicables ;
3. **Soin** — rendez-vous, traitements, routines et plan de sécurité ;
4. **Cercle** — partage volontaire et demandes précises.

L'action globale « Ajouter » est contextuelle et ne devient pas un cinquième
espace. Sur mobile, les quatre destinations gardent une cible de 48 dp et la
zone sûre. Sur le web, le contenu reste utilisable au clavier sans dépendre du
sidebar.

## Règles d'interaction

- Une page commence par son intention, pas par une métrique.
- Aujourd'hui place son action principale avant tout scroll sur 390 × 844.
- Aucun score n'est présélectionné. « Je suis là » fonctionne sans score.
- Tout brouillon peut être quitté ; aucun abandon ne déclenche de message de
  retard.
- Une source affiche provenance, couverture et caractère partiel quand ils
  influencent la lecture.
- Un conflit explique les deux versions et laisse choisir ; aucune donnée
  mutable n'est écrasée silencieusement.
- Une permission refusée propose de continuer sans la fonctionnalité.
- Une donnée Plus reste visible comme concept, mais l'action payante annonce
  clairement la valeur avant le paywall.
- Les notes privées sont exclues par défaut des insights, briefs et partages.

## États obligatoires

Chaque écran ou sheet documente au minimum : normal, vide, chargement, erreur
récupérable, hors-ligne, conflit, permission refusée/révoquée, contenu Plus,
texte agrandi et mouvement réduit. Pour les captures de santé, calendriers et
aidants, ajouter aussi source partielle, révocation en session et suppression en
cours.

## Mouvement et accessibilité

- Réaction tactile : 120 ms ; transition standard : 220 ms ; confirmation
  calme : 360 ms maximum.
- `prefers-reduced-motion` et le réglage natif suppriment translation,
  parallaxe, boucle et animation décorative.
- Web : objectif WCAG 2.2 AA, focus toujours visible, parcours complet clavier.
- Mobile : 44 pt iOS / 48 dp Android, VoiceOver/TalkBack, tailles dynamiques,
  annonces `liveRegion`, gestes toujours doublés d'une action visible.
- Les états de crise coupent toute reformulation IA et rendent immédiatement
  visibles le plan et les ressources françaises.

## Données sensibles

Aucun événement analytics, log, notification générique ou identifiant externe
ne contient humeur, traitement, note, donnée Santé, personne aidante ou contenu
d'export. Une synthèse générée indique ses données d'entrée, sa date, ses
limites, son statut généré et l'option de désactivation.
