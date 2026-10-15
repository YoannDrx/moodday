# Mood Day — plan de clôture après audit

Source : [audit du 6 septembre](../audits/production-readiness-2026-09-06.md).
Suite : [corrections et preuves du 7 septembre](launch-blockers-2026-09-07.md).
Le plan décrit le travail à réaliser, pas une certification de disponibilité.
Les modifications préexistantes sont conservées. Pas de remise à zéro de
Production, d'achat réel ou de publication sans fermeture des gates.

## Ordre d'exécution

1. **Fiabilité des parcours** : reproduire les sept échecs navigateur restant
   ouverts, corriger les mutations et leurs états d'erreur, contrôler le rate
   limiter, puis rejouer Chromium/Safari mobile avant la matrice complète.
2. **Lecture des données commune** : rapprocher les observations V1/V2 sans
   double écriture ; conserver les dates civiles, les échelles, les valeurs
   absentes, la présence sans score et la confidentialité des notes. Raccorder
   courbes, résumés et exports avec tests croisés.
3. **Complétude native** : point complet/brouillon, timeline et détail,
   interactions routine/rendez-vous/cercle et traductions FR/EN. Chaque parcours
   doit traiter attente, erreur, hors ligne, conflit et permission refusée.
4. **Sécurité et exploitation** : preuves de rotation/révocation, isolation
   des environnements, restauration du candidat, monitoring et approbations.
5. **Fournisseurs** : OAuth réel, calendrier/Santé, Stripe canonique et
   catalogue, RevenueCat/StoreKit et droits communs. Pas de rejeu d'événements
   du compte Stripe partagé sans attribution certaine à Mood Day.
6. **Livraison iOS** : candidat propre, EAS, appareil réel/TestFlight,
   accessibilité native, fiches/captures/compte de revue et soumission seulement
   après fermeture des gates juridiques, sécurité et recette.

## Journal de cette implémentation

- [x] Fiabilité des mutations de consultation : validation, réseau, conservation
  du brouillon et rafraîchissement serveur.
- [ ] Sept échecs E2E expliqués et scénarios rejoués.
- [x] Lecture commune V1/V2 couverte et intégrée aux courbes, au résumé, aux
  patterns existants et aux exports. La timeline complète et l'IA restent distinctes.
- [ ] Complétude native et FR/EN.
- [ ] Fournisseurs configurés et testés réellement.
- [ ] Gates de lancement clôturées avec preuves.

## Livré localement dans cette passe

### Mutations et brouillons

- Cinq régressions de consultation reproduites avant correction : les erreurs
  de validation/réseau/réponse vide ne sont plus annoncées comme un succès ;
  les champs restent remplis et les contrôles redeviennent utilisables.
- Revalidation de `/consultation` après mutation confirmée côté serveur.
- Invitation aidant : absence de résultat ou erreur de validation = erreur,
  jamais fermeture du dialogue et annonce d'une invitation envoyée.
- Inscription : noms des documents légaux corrigés, testés avec les vrais
  dictionnaires français et anglais, sans afficher de clés de traduction.
- iOS : anxiété facultative, contexte et note privée dans le point enrichi ;
  restauration de ces champs depuis le brouillon, sérialisation des écritures
  locales avant envoi/annulation, conservation en cas d'échec d'annulation.
- iOS : vérification du brouillon avant saisie pour ne pas remplacer une saisie
  récente par une restauration tardive ; contrôles verrouillés pendant l'envoi.
- Faux indicateur « Préparation 2 sur 4 » retiré, remplacé par un accès aux
  rendez-vous réels. Le point enrichi n'est pas encore le parcours adaptatif
  complet avec sommeil sourcé et toutes les variantes du plan initial.

### Données et confidentialité

- `readMoodRange` lit les deux modèles sans double écriture. Une présence sans
  score ne devient pas un zéro, mais compte comme une participation.
- Les check-ins offline sont sélectionnés par date civile déclarée, pas par
  date d'import. DST et fuseau UTC+14 couverts ; tri commun avec le journal.
- Graphique : regroupement selon cette date, source disponible dans l'infobulle.
- CSV/PDF : présence des check-ins V2, source et précision de date explicites.
  Une donnée connue au jour près ne reçoit pas une heure de mesure fictive dans
  le CSV. Le format JSON de portabilité reste séparé et contient les notes privées.
- Les notes libres ne sont pas incluses automatiquement dans les rapports de
  consultation ; les questions/événements expressément préparés restent inclus.
  Aucun contrôle de partage des notes n'est prétendu disponible avant son ajout.
- Associations web : une paire moyenne par jour, minimum cinq jours et couverture
  minimale de 50 % de la période effective. Sens conservé, couverture affichée,
  même-jour explicite. Ce seuil produit prudent n'est pas une validation clinique.

## Vérifications réalisées

- Vitest complet : **176 fichiers, 1 114 tests réussis**, deux workers.
- Tests natifs additionnels du point du jour : **5 réussis**, composants adaptés
  au DOM ; cela ne teste pas SQLCipher/VoiceOver sur appareil.
- Tests ciblés des invitations aidants : **9 réussis**, dont erreurs de validation
  et réponse vide (rejoués après correction de la clé de traduction).
- TypeScript web, Expo et tests natifs : réussis, y compris le dernier rejeu
  `pnpm ts && pnpm typecheck:mobile` après les ajouts de tests et traductions.
- Bundle Expo iOS/Hermes : export réussi, 1 631 modules, 35 assets, environ 6,3 Mo,
  API de recette fictive ; aucun nouveau build Store/TestFlight envoyé.
- Recette Chromium ciblée initiale : **5/5 réussis** (aidants et parcours produit).
- Nouvelle passe Chromium/Safari mobile : **68/69 réussis**, un dépassement du
  temps total de 70 s dans le refus d'invitation Safari mobile. Les attentes
  métier et le budget n'ont pas été relâchés. Pour ce scénario, création des deux
  comptes par l'API de recette ; inscription/connexion UI toujours testées dans
  les tests dédiés. Rejeu ciblé exports + refus d'invitation : **4/4 réussis**
  sur Chromium et Safari mobile. Refus : 3 s et 4 s respectivement. Le CSV
  téléchargé contient le vrai check-in V2 et exclut sa note privée.
- Lint de tous les fichiers de ce lot : deux remarques corrigées, rejeu ciblé
  réussi. TypeScript web/Expo/tests natifs réussis. La matrice cinq profils est
  exécutée séparément ci-dessous ; aucun 171/171 n'est revendiqué avant résultat.
- La tentative de matrice 171 scénarios a été **interrompue**, et non validée :
  délais dépassés au chargement de l'inscription (notification et persistance
  offline), délai total des invitations concurrentes, transaction Better Auth
  `P2028` au-delà de cinq secondes. Le poste exécute également d'autres builds
  et navigateurs : la cause en production n'est pas démontrée. La protection
  anti-abus n'a été ni supprimée ni relâchée. Rejeu ciblé séquentiel requis.
- Préparation API isolée pour le test de concurrence des notifications et des
  invitations ; les assertions métier concurrentes restent inchangées. Le helper
  d'inscription UI attend le document puis l'actionnabilité des vrais champs,
  sans attendre le chargement global des ressources. Aucun délai augmenté.
- Tests d'inscription et de traduction réels : **6 réussis**.
- Dernier rejeu séquentiel (14 prévus) **interrompu après cinq résultats** :
  notification concurrente et invitation expirée réussies ; concurrence,
  révocation et refus aidants encore en échec. Une navigation attendait `load`
  malgré la page rendue (attente corrigée ensuite, pas encore rejouée) ; les
  autres montrent un envoi encore en attente ou un délai total dépassé. Le
  résultat ciblé précédent 4/4 ne suffit donc pas à déclarer ces tests stables.
  Le candidat Next a été reconstruit avec succès avant cette passe.
- En fin de passe : serveur navigateur de recette et conteneur PostgreSQL
  `moodday-audit-20260906` arrêtés ; données de recette conservées, aucune base
  distante modifiée. Aucun commit, push, déploiement ni soumission Apple.
- `verify:credential-rotations` et `verify:release-approvals` échouent explicitement :
  **12 preuves de rotation** et **21 approbations** encore incomplètes dans les
  registres. L'absence de preuve n'établit pas à elle seule l'état du fournisseur.

## Restant, sans ambiguïté

La passe ne clôture pas le plan complet. Restent notamment la timeline unifiée
incluant tous les objets, l'adaptation complète du check-in et des données Santé,
la parité FR/EN native, la lecture V2 des modules IA/historiques encore séparés,
la recette native réelle et les gates de fournisseurs/commercialisation.
Les réponses HDS/AIPD ont été demandées au propriétaire pendant cette passe.
Ni les preuves ni les signatures ne sont générées artificiellement.

## Prochaines unités de livraison et preuves attendues

| Priorité / unité | Travail exact | Critère de sortie |
| --- | --- | --- |
| P1 — stabilité E2E | Rejouer les trois familles en échec avec un worker, examiner les traces, puis exécuter les cinq profils sur un runner dédié. Mesurer séparément les transactions Better Auth. | Aucun échec ni retry masqué ; temps de connexion et charge PostgreSQL consignés. |
| P1 — continuité du journal | Ajouter les objets de soin à la timeline commune, conserver dates civiles et provenance ; retirer ou raccorder les lecteurs V1 restants. | Un check-in mobile, une prise et un rendez-vous apparaissent sur web et mobile ; pas de notes privées dans un partage implicite. |
| P1 — check-in natif | Reprise après changement de jour/fuseau, sommeil sourcé facultatif, étapes ignorables, conflits de brouillons multi-appareils. | Recette après minuit, mode avion, réouverture et saisie simultanée sans perte ni écrasement silencieux. |
| P1 — parité native | Inventaire écran/action/état, traductions FR/EN, routines, rendez-vous, cercle, permissions et accessibilité. | Chaque action annoncée est réellement exécutable ; matrice de parité sans exemple présenté comme donnée personnelle. |
| P0 lancement — secrets | Pour chacune des 12 entrées : identifier consommateurs, créer la nouvelle clé, installer, vérifier, révoquer l'ancienne, consigner une preuve non secrète. | Script de rotation vert avec preuves réelles ; séparation Preview/Production vérifiée. |
| P0 lancement — conformité | Recueillir qualification HDS et validation AIPD ; si applicable, préparer l'hébergement autorisé avant données réelles. | Décisions signées et approbations enregistrées, jamais générées automatiquement. |
| P1 — Google | Compte test réel, consentement OAuth, callback web/iOS, retour annulé, session révoquée ; agenda dédié et conflit bidirectionnel. | Connexion et synchronisation démontrées, autres agendas non lus globalement. |
| P1 — paiement | Attribuer les événements du compte Stripe partagé, préparer catalogue/secret/URL canonique ; sandbox StoreKit/RevenueCat puis réconciliation des droits. | Achat, restauration, remboursement, grâce et doublon multi-source testés ; aucun achat réel nécessaire à la recette. |
| P1 — candidat iOS | Nouveau build du commit vérifié, installation sur iPhone, HealthKit/SQLCipher/APNs/VoiceOver et StoreKit sandbox. | Identifiant du build et résultats d'appareil réel archivés ; un export JS ne suffit pas. |
| P0 lancement — livraison | Restaurer une sauvegarde isolée, finaliser compte de revue/captures/confidentialité/chiffrement, fermer les 21 approbations puis demander la publication. | NO-GO levé explicitement sur le candidat exact ; pas de soumission de l'ancien binaire. |

Les tâches techniques encore ouvertes restent du travail d'implémentation ; elles
ne sont pas toutes bloquées par le propriétaire. Les points externes nécessitent
en revanche une vraie décision, une authentification ou une preuve d'appareil.

## Dépendances qui ne peuvent pas être simulées

- Qualification/signature HDS, AIPD et documents juridiques/fiscaux.
- Identifiants fournisseurs accessibles et validations de compte par leur titulaire.
- iPhone réel pour HealthKit, SQLCipher, notifications, achats et accessibilité.
- Acceptation Apple et autorisation finale de publication.

## Règle de clôture

Une case passe à « terminé » uniquement avec le périmètre exact, les commandes,
le résultat et les limites. Une compilation, une fixture ou un build historique
ne remplace pas la preuve de fonctionnement du candidat en production.
