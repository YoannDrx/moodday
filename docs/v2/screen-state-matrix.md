# Mood Day V2 — matrice d'écrans et d'états

Cette matrice est le contrat de couverture UX de « Carnet vivant ». Elle ne
signifie pas que chaque intégration externe est activée : les colonnes de gate
restent bloquantes jusqu'à preuve explicite.

## États transverses

Tous les identifiants d'écran ci-dessous doivent couvrir : `normal`, `empty`,
`loading`, `recoverable-error`, `offline`, `conflict`, `permission-denied`,
`permission-revoked`, `plus-locked`, `large-text` et `reduced-motion` lorsque
l'état a un sens. Les mutations ajoutent `saving`, `queued`, `synced`,
`duplicate` et `rejected`.

## Public et identité

| Domaine    | Écrans / surfaces                                                                             | Point critique                     |
| ---------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| Site       | promesse, fonctionnement, confidentialité, prix, aide, statut, crise, légal                   | claims non médicaux et accès crise |
| Compte     | inscription, connexion, vérification, récupération, consentements                             | même compte web/mobile             |
| Sécurité   | appareils, session, réauthentification, révocation                                            | révocation à la requête suivante   |
| Onboarding | objectifs, traitements, Santé, Google, calendrier natif, notifications, Cercle, récapitulatif | chaque connexion reste facultative |

## Aujourd'hui et capture

| Parcours    | Écrans / surfaces                                                                      | Point critique                     |
| ----------- | -------------------------------------------------------------------------------------- | ---------------------------------- |
| Aujourd'hui | première visite, journée normale, terminée, énergie basse, hors-ligne, sync en attente | une action visible sans scroll     |
| Check-in    | présence, rapide, complet, contexte, note/voix, confirmation, annulation               | aucune valeur présélectionnée      |
| Ajouter     | menu, check-in, note, événement, question, PRN, soutien                                | capture en moins de deux décisions |
| Reprise     | lendemain, plusieurs jours, deux semaines                                              | aucun retard ou série perdue       |

## Repères

| Parcours    | Écrans / surfaces                                                    | Point critique                   |
| ----------- | -------------------------------------------------------------------- | -------------------------------- |
| Accueil     | timeline, filtres, groupement par jour                               | source visible par événement     |
| Revue       | hebdomadaire, comparaison baseline, semaine pauvre en données        | formulation neutre               |
| Insight     | détail, sens, même jour/j+1, couverture, limites, contester, masquer | signe conservé, aucune causalité |
| Sources     | couverture, pause, révocation, suppression période/tout              | absence ≠ zéro                   |
| Rendez-vous | ajouter l'insight au prochain rendez-vous                            | notes privées exclues            |

## Soin

| Parcours       | Écrans / surfaces                                                                            | Point critique        | Statut codé                   |
| -------------- | -------------------------------------------------------------------------------------------- | --------------------- | ----------------------------- |
| Hub            | rendez-vous, traitements, routines, sécurité                                                 | continuité en un lieu | web + mobile                  |
| Rendez-vous    | liste, création, détail, préparation, séance, débrief, brief, partage                        | objet canonique       | web + mobile, partage restant |
| Professionnels | liste, création, archivage                                                                   | aucun portail pro     | modèle                        |
| Traitements    | aujourd'hui, liste, ajout, édition, détail, historique, stock, prise, oubli, correction, PRN | intégrité dose        | V1 conservée                  |
| Routines       | liste, création, planification, accomplissement, pause, reprise                              | aucune dette          | création + liste              |
| Sécurité       | plan, contacts, signaux personnels, accès offline, crise                                     | toujours disponible   | V1 conservée                  |

## Cercle et espace aidant

| Parcours    | Écrans / surfaces                                                                  | Point critique             |
| ----------- | ---------------------------------------------------------------------------------- | -------------------------- |
| Patient     | liste, invitation, contrat, permissions, expiration, demande, activité, révocation | aucune alerte automatique  |
| Acceptation | identité, portée exacte, durée, refus                                              | ce qui est vu et non vu    |
| Aidant      | rôles, personnes, résumé, demande reçue, réponse, historique                       | pas de donnée hors contrat |
| Audit       | journal d'accès, export, révocation active                                         | session active invalidée   |

La fondation API et données est disponible. Les écrans patient et aidant V2
couvrent invitation, acceptation, contrat, demande, réponse et révocation sur
web et mobile. Ils doivent encore être testés sur deux sessions réellement
concurrentes ; le journal d'accès visible et les contributions restent à
industrialiser.

## Connexions, réglages et paiement

| Domaine         | Écrans / surfaces                                                   | Gate                           |
| --------------- | ------------------------------------------------------------------- | ------------------------------ |
| Santé           | bénéfice, permissions par type, couverture, pause, suppression      | HealthKit/Health Connect réels |
| Calendrier      | Google dédié, import choisi, natif, conflit, resync                 | aucune lecture globale         |
| Notifications   | générique, appareil de confiance, détail traitement                 | consentement distinct          |
| Confidentialité | consentements, exports, suppression, langue, accessibilité          | réauthentification             |
| Plus            | paywall, restauration, actif, source, annulation, double abonnement | matrice stores/Stripe verte    |

## Ordre des wireframes cliquables

Le prochain lot Figma, dès réouverture du quota Starter, doit suivre cet ordre :

1. onboarding court → Aujourd'hui vide ;
2. présence → point rapide → confirmation ;
3. insight explicable → contestation → ajout au rendez-vous ;
4. rendez-vous → préparation → mode séance → débrief → brief ;
5. contrat aidant → demande précise → révocation ;
6. variantes offline, conflit, permission refusée et texte à 200 % ;
7. paywall, restauration et double abonnement.

Le contenu de test reste identique sur desktop et mobile ; seules navigation,
density, sheets, gestes et conventions de plateforme changent.
