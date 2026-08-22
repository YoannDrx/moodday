# Mood Day V2 — kit d’illustrations « Carnet vivant »

## Rôle du kit

Les illustrations prolongent le carnet personnel sans transformer Mood Day en
application enfantine ou clinique. Elles apportent un point de respiration,
facilitent la reconnaissance d’un espace et donnent une continuité visuelle
entre le site public, l’authentification et l’application connectée.

Le langage visuel associe gouache éditoriale, découpes de papier, grain tactile
léger et formes adultes. La palette reste limitée au vert profond `#155C5A`, au
papier `#F6F3EC`, à l’abricot `#F3C9A8`, à la sauge `#AFC9BC` et à la lavande
`#D9D2E9`.

## Catalogue

| Variante      | Fichier                    | Emplacements privilégiés                     |
| ------------- | -------------------------- | -------------------------------------------- |
| `welcome`     | `welcome-journal.png`      | landing, connexion, inscription, onboarding  |
| `checkIn`     | `check-in-pebbles.png`     | Aujourd’hui, check-in, confirmation douce    |
| `landmarks`   | `landmarks-thread.png`     | navigation, Repères, revue hebdomadaire      |
| `appointment` | `appointment-chair.png`    | Soin, rendez-vous, préparation de séance     |
| `treatment`   | `treatment-routine.png`    | traitements, prises, routines                |
| `circle`      | `circle-support.png`       | Cercle, invitation, demande de soutien       |
| `privacy`     | `privacy-journal.png`      | confidentialité, consentements, appareils    |
| `offline`     | `offline-boat.png`         | hors-ligne, attente de synchronisation       |
| `safety`      | `safety-lighthouse.png`    | plan de sécurité, ressources de crise        |
| `brief`       | `consultation-brief.png`   | brief, export et partage temporaire          |
| `plus`        | `plus-journal.png`         | Plus, restauration d’achat, abonnement actif |
| `connections` | `connections-calendar.png` | Google Agenda, calendrier natif, Santé       |

Les fichiers de production sont dans `public/brand/illustrations/`. Leur point
d’entrée web est `BrandIllustration` dans
`src/components/brand/brand-illustration.tsx`; une page ne référence jamais le
chemin PNG directement. Les PNG transparents restent les masters web. Le mobile
embarque leurs variantes WebP 900 px dans `apps/mobile/assets/illustrations/` :
1,3 Mo pour le kit complet au lieu d’environ 23 Mo de masters.

## Règles d’usage

- Une illustration ne remplace ni un titre, ni une icône d’action, ni un état
  explicite. Elle accompagne la compréhension mais ne porte aucune information
  médicale.
- Elle est décorative par défaut (`alt=""`). Un texte alternatif n’est fourni
  que si le visuel contribue réellement au récit, comme l’illustration héro de
  la landing.
- Une seule illustration dominante est utilisée au-dessus de la ligne de
  flottaison. Les autres restent compactes et ne concurrencent pas l’action
  principale.
- Les visuels ne sont pas animés. Un éventuel mouvement futur doit respecter
  `prefers-reduced-motion` et ne jamais boucler sur un écran de saisie.
- Aucun recadrage ne doit supprimer le sujet principal. Utiliser `object-contain`
  et un fond issu des tokens Carnet vivant.
- Les écrans de crise privilégient l’accès aux actions et numéros utiles ; le
  phare peut être présent mais ne doit jamais repousser ces éléments.
- Pour une langue ou une taille de texte différente, l’illustration cède
  toujours la place au contenu (`hidden`, réduction ou déplacement sous le
  texte).

## Prompts de génération

Les douze images ont été produites séparément en mode ImageGen intégré, avec la
taxonomie `stylized-concept`. Le socle commun était : illustration éditoriale
premium à la gouache et en papier découpé, grain tactile subtil, composition
adulte, arrière-plan transparent, palette Mood Day, sans texte, logo, filigrane,
croix médicale, cerveau caricatural ni visage détaillé.

Les sujets sont respectivement : carnet ouvert devenant horizon ; trois galets
et un fil ; fil traversant des repères de jours ; fauteuil de consultation et
carnet ; pilulier et carte de routine ; deux mains autour d’une tasse ; carnet
fermé protégé ; bateau dans une crique ; phare et chemin ; pages de brief ;
carnet Plus avec marque-page solaire ; carte calendrier et objet connecté.

Toute extension du kit doit reprendre ce socle, générer un sujet à la fois et
être vérifiée sur fonds papier, vert profond et lavande avant intégration.
