# Moodday — design system

## Marque

Moodday est un compagnon de suivi personnel de santé mentale. Il aide à observer son quotidien et à préparer des échanges avec ses proches ou ses soignants, sans poser de diagnostic ni formuler de recommandation clinique.

- Audience principale : personnes qui suivent leur humeur, leur sommeil, leurs traitements et leurs habitudes.
- Audience secondaire : proches aidants invités avec des permissions explicites.
- Ton : calme, précis, chaleureux, non infantilisant.
- Interdits : vocabulaire de diagnostic, promesse de guérison, injonction positive, photographie hospitalière ou anxiogène.

## Identité

| Rôle        | Token       | Valeur claire |
| ----------- | ----------- | ------------- |
| Canvas      | `canvas`    | `#F7F5F0`     |
| Surface     | `surface`   | `#FFFFFF`     |
| Texte       | `text`      | `#1F2937`     |
| Marque      | `brand`     | `#1E7775`     |
| Sauge       | `success`   | `#4E8768`     |
| Lavande     | `accent`    | `#D8CCE8`     |
| Sable       | `secondary` | `#E9E1D4`     |
| Danger      | `danger`    | `#B42318`     |
| Attention   | `warning`   | `#A15C00`     |
| Information | `info`      | `#276A8A`     |

Manrope est utilisé pour les titres, Inter pour le texte et Geist Mono uniquement pour les identifiants ou données techniques. Les contrôles ont un rayon de 12 px, les cartes 18 px et les modales 24 px.

## Navigation produit

La navigation principale mobile contient cinq destinations : Aujourd'hui, Journal, Traitements, Tendances et Profil. Les exercices, la thérapie, les exports, la confidentialité et le cercle aidant restent accessibles depuis les écrans concernés et les réglages.

## Composants et états

- Chaque formulaire garde un label visible, une aide éventuelle, une erreur liée au champ et une confirmation de sauvegarde.
- Chaque écran métier traite chargement, vide, erreur récupérable, succès, accès refusé et hors-ligne.
- Les actions destructives exigent une confirmation qui nomme précisément l'objet supprimé.
- Les graphiques possèdent un titre, une période, une légende non dépendante de la couleur et un résumé textuel.
- Les cibles tactiles mesurent au moins 44 px ; la navigation mobile vise 48 px.
- Le focus visible utilise `focus-ring` et ne doit jamais être supprimé.

## Mouvement

- Le contenu principal est visible dans le HTML initial.
- Les transitions fonctionnelles durent 120 à 200 ms ; une confirmation expressive peut durer 400 ms.
- Les animations n'entraînent aucun déplacement de mise en page.
- `prefers-reduced-motion` neutralise translations, boucles, parallax et animations décoratives.

## Données sensibles

Aucun événement analytics ne contient humeur, traitement, note, diagnostic, identifiant d'aidant ou contenu d'export. Les écrans ne présentent jamais une corrélation comme une causalité médicale et identifient explicitement toute synthèse générée par IA.
