# Mood Day V2 — état d'implémentation

Date de référence : 22 août 2026.

Ce document décrit la première tranche verticale réellement exécutable de la
refonte. Il ne transforme pas la présence de code en promesse de disponibilité :
les intégrations externes, les validations réglementaires et les tests avec des
utilisateurs restent des gates de sortie.

## Résultat livré

### Une fondation web/mobile commune

- Le dépôt est un workspace pnpm comprenant l'application Next.js actuelle,
  `apps/mobile` et les packages `domain`, `contracts`, `api-client`,
  `design-tokens` et `i18n`.
- L'application Expo SDK 55 utilise Expo Router et un development build. Elle
  expose les quatre intentions Aujourd'hui, Repères, Soin et Cercle.
- Better Auth est partagé entre web et mobile. Les sessions natives utilisent
  SecureStore et les schémas de deep link sont distincts en développement,
  preview et production.
- Le client API commun gère l'authentification, les enveloppes d'erreur stables
  et les identifiants d'opération.

Le web reste volontairement à la racine pendant cette tranche. Le déplacer
immédiatement dans `apps/web` aurait modifié simultanément les chemins Vercel,
Prisma, Playwright, scripts d'exploitation et preuves de production. Ce
déplacement sera effectué séparément après un preview vert, sans mélanger une
relocalisation mécanique avec la nouvelle logique métier.

### La première boucle quotidienne

- L'ancien dashboard ouvre maintenant une expérience « Aujourd'hui » organisée
  autour d'une seule action principale.
- Le check-in ne contient aucune valeur arbitrairement préremplie. Il accepte :
  présence seule, point rapide (valence, activation, irritabilité) et point
  complet (anxiété et note facultatives).
- Le même noyau est utilisable sur le web et dans l'application native.
- Sur mobile, un check-in est enregistré d'abord dans la base locale chiffrée,
  puis envoyé à l'API. Une coupure réseau conserve l'opération en attente.
- Les rendez-vous et routines V2 peuvent être créés depuis le mobile, y compris
  hors ligne, puis apparaissent dans le hub Soin web après synchronisation.
- Une routine active peut être marquée comme accomplie depuis Soin mobile. Le
  résultat est projeté immédiatement dans SQLCipher, survit à un redémarrage
  hors ligne puis se réconcilie avec le serveur. Une contrainte PostgreSQL
  garantit une seule occurrence canonique par routine et date civile, sans
  streak ni retard à rattraper.
- Un rendez-vous canonique possède désormais des questions publiques ou
  privées, des repères de séance append-only, des décisions de débrief et des
  briefs versionnés. Le parcours est utilisable sur le web et sur mobile ; les
  questions, la séance et le débrief restent saisissables hors ligne.
- Le brief est construit côté serveur depuis une liste de champs autorisés. Il
  exclut structurellement les questions privées et ne lit jamais les notes du
  journal.
- La navigation et le hub Soin ont été réorganisés selon les quatre intentions
  de la V2.
- Les associations affichées dans Repères conservent désormais leur signe,
  exigent au moins cinq jours comparables et exposent leurs limites. L'adhérence
  aux traitements reste séparée des associations statistiques.
- Le kit « Carnet vivant » contient douze illustrations de production partagées
  par le web et React Native. Il couvre accueil, check-in, Repères, rendez-vous,
  traitements, Cercle, confidentialité, offline, sécurité, brief, Plus et
  connexions. La landing, l'identité, la navigation et les quatre espaces
  principaux utilisent désormais ces repères sans faire porter d'information
  médicale à l'image.

### Cercle et droits Plus — fondation serveur

- La baseline additive comprend maintenant relations patient/aidant, contrats
  versionnés, permissions explicites, demandes de soutien, contributions et
  journal d'accès sans contenu.
- L'invitation est liée à l'e-mail authentifié, expire, stocke seulement une
  empreinte de jeton et reste rejouable avec le même `operationId`.
- L'acceptation exige le jeton, le bon compte et une invitation non expirée.
- La révocation ferme la relation et tous ses contrats dans la même transaction.
  Toute lecture aidant doit revalider relation, contrat, échéance et permission
  à la requête suivante.
- La projection Plus agrège les sources vérifiées Stripe, App Store et Play
  Store. Une source active suffit ; deux sources actives produisent une alerte
  de double abonnement sans annulation automatique.
- Les écrans web et mobile utilisent maintenant ces contrats V2 : invitation,
  portée exacte, expiration, lien volontairement partagé, acceptation,
  demandes précises, réponse et révocation. Le destinataire lit ce qui sera vu
  et ce qui ne le sera pas avant d'accepter.
- Aucun e-mail ni push n'est envoyé automatiquement dans cette tranche. La
  personne qui invite décide explicitement de partager le lien via le presse-
  papiers web ou la feuille système mobile.

### Contrats et API V2

La première spécification est publiée à `/api/v2/openapi.json` et couvre :

- `GET /api/v2/today` ;
- `GET /api/v2/check-ins` avec pagination par curseur ;
- `POST /api/v2/check-ins` avec `operationId` idempotent.
- `GET|POST /api/v2/routines` ;
- `GET|POST /api/v2/routine-occurrences` ;
- `GET|POST /api/v2/appointments` ;
- `GET|POST /api/v2/appointments/{appointmentId}/artifacts` ;
- `GET|POST /api/v2/circle`, `POST /api/v2/circle/accept` et
  `DELETE /api/v2/circle/{relationshipId}` ;
- `GET|POST /api/v2/support-requests` et
  `PATCH /api/v2/support-requests/{supportRequestId}` ;
- `GET /api/v2/entitlements` ;
- `POST /api/v2/sync/push` et `GET /api/v2/sync/pull`.

Les routes et l'action serveur web appellent le même service métier. Les
réponses utilisent soit `{ data, requestId }`, soit une erreur structurée avec
`code`, `message`, `recoverable` et `requestId`.

### Baseline de données additive

Les migrations `20260821153000_moodday_v2_foundation`,
`20260822013000_v2_circle_contracts`,
`20260822023000_v2_appointment_artifacts` et
`20260822210000_v2_routine_occurrence_daily_uniqueness` ajoutent les premiers
agrégats V2 sans supprimer les tables V1 :

- CheckIn, Observation, DailyAggregate, SourceConnection et SyncCursor ;
- Routine et RoutineOccurrence ;
- Clinician, Appointment et AppointmentQuestion ;
- Device et SyncOperation ;
- SubscriptionSource, EntitlementSnapshot et BillingEvent.
- CircleRelationship, ShareContract, SupportRequest, CaregiverContribution et
  AccessLog.
- AppointmentEvent, AppointmentDecision et AppointmentBrief, ainsi qu'un reçu
  d'opération optionnel sur AppointmentQuestion.

Des contraintes SQL protègent les bornes 0–10, la cohérence des fenêtres et de
la couverture, les check-ins rapides incomplets, les positions de question et
les périodes de rendez-vous. Les trois migrations V2 additives ont été répétées
sur une branche isolée puis appliquées en Production le 22 août 2026. La
sauvegarde fournisseur `codex-v2-predeploy-backup-2026-08-22` est conservée ;
la vérification post-déploiement compte 27 migrations réussies, 64 tables
publiques et aucune dérive Prisma.

### Offline mobile

- SQLCipher est activé dans la configuration Expo native.
- Le runtime vérifie `cipher_version` et refuse d'ouvrir une base si SQLCipher
  n'est pas réellement présent dans le development build.
- Chaque compte possède une base distincte dont le nom ne contient qu'une
  empreinte SHA-256 tronquée. Sa clé aléatoire de 32 octets est distincte,
  conservée dans SecureStore et limitée à l'appareil.
- Les opérations de check-in sont persistées localement avec leur `operationId`.
- Toute mutation est écrite dans SQLCipher avant la première tentative réseau ;
  elle n'est retirée qu'après acceptation ou déduplication serveur.
- Les opérations partagent maintenant une file générique par lots pour les
  check-ins, routines, rendez-vous, questions, repères de séance et décisions,
  avec identifiant stable d'appareil.
- Une synchronisation réussie retire l'opération ; une erreur récupérable la
  conserve sans journaliser son contenu.
- Les payloads locaux sont revalidés avant envoi.
- Le serveur conserve uniquement l'empreinte SHA-256 stable d'un payload dans
  le reçu d'idempotence, jamais la note ou le contenu sensible.
- Le pull delta utilise un curseur opaque et ordonné. Les entités mutables
  exigent une version serveur exacte ; check-ins et doses restent append-only.
- Les snapshots récupérés sont conservés dans SQLCipher pour lecture offline.
- Les créations optimistes d'occurrence sont écrites dans la file et le
  snapshot local dans une même transaction. Un rejet ou conflit retire la
  projection visuelle, mais conserve la ligne de résolution chiffrée.
- La disparition d'une session, y compris après révocation serveur, ferme la
  base SQLCipher du compte avant de réafficher la connexion. La file locale est
  conservée pour une reconnexion du même propriétaire et reste inaccessible à
  un autre compte.
- L'écran « Compte et appareil » expose l'état pending/conflit/rejeté. Il bloque
  la déconnexion lorsqu'une donnée locale n'est pas résolue, propose une
  synchronisation, et sépare la purge destructive derrière une confirmation
  explicite. La purge supprime le fichier SQLCipher et sa clé SecureStore.

Cette tranche prouve le moteur delta pour les trois premiers agrégats et les
artefacts append-only du rendez-vous. Les brouillons, doses V2, réglages et
conflits Google/Mood Day restent à brancher sur le même protocole.

## Direction artistique

Le fichier Figma éditable « Mood Day V2 — Directions & Product UX » contient les
tokens sémantiques de couleur et trois directions comparables, chacune en mobile
390 × 844 et desktop 1440 × 900, avec un contenu identique :

1. Carnet vivant — chaleureux, éditorial et tactile ;
2. Clarté native — dense juste ce qu'il faut, immédiatement familière ;
3. Horizons — composition plus expressive et sensible au temps.

Fichier : https://www.figma.com/design/wNRCFRLgw6ome0Z6TMsf3m

La direction **Carnet vivant** a été choisie le 22 août. Le système de design,
le logo calendrier-cœur révisé, ses deux alternatives, les app icons et la
matrice d'états sont désormais versionnés dans le dépôt. La limite d'appels MCP
du plan Figma Starter bloque encore l'annotation du choix, la capture de contrôle
et l'ajout des interactions dans le fichier distant. Les écrans existants sont
conservés ; le lot cliquable restant est ordonné dans `screen-state-matrix.md`.

## Vérifications de cette tranche

Les commandes suivantes passent sur l'état livré :

```text
pnpm lint:ci
pnpm ts
pnpm typecheck:mobile
pnpm test:ci                 # 152 fichiers, 968 tests
pnpm prisma validate
pnpm build
pnpm --filter @moodday/mobile exec expo install --check
pnpm --filter @moodday/mobile exec expo config --type public
git diff --check
```

## Gates encore ouvertes

### Bloquantes avant migration de données ou bêta externe

- Sauvegarde de référence, tag V1 et test de restauration documenté.
- Entretiens patients, aidants et professionnels ; validation de la frontière
  non médicale et test des trois directions.
- Décision HDS signée et mise à jour complète de l'AIPD.
- Revue de la migration SQL sur un clone de base, application en preview et
  rollback restauré depuis sauvegarde.
- Audit manuel accessibilité web, VoiceOver et TalkBack.

### Construction encore nécessaire

- Couverture exhaustive des écrans et états en Figma ; la direction est choisie,
  mais le quota distant empêche encore le handoff complet.
- Extension du moteur delta aux doses, brouillons et réglages, puis tests réels
  multi-appareils et concurrence PostgreSQL.
- Traitements V2 et plan de sécurité offline dans les clients V2. Les
  occurrences quotidiennes de routines sont raccordées à l'API et au moteur
  offline mobile ; leurs corrections et planifications avancées restent à
  compléter. Le rendez-vous canonique et son brief sont raccordés ; l'export
  PDF/lien temporaire reste à livrer.
- Google Agenda bidirectionnel, calendrier natif, HealthKit puis Health Connect.
- Notifications d'invitation et tests réels de révocation sur session aidant
  active. Les écrans web/mobile, le contrat et le journal d'accès sont codés.
- RevenueCat, StoreKit et Google Play Billing. La projection commune des droits
  Stripe/mobile est codée, mais aucun webhook store n'est encore activé.
- Notifications, exports V2, suppression par source et propagation de la
  suppression de compte vers tous les appareils. Le verrouillage de session et
  la purge volontaire de l'appareil courant sont codés.
- Exécution des workflows Maestro désormais versionnés sur de vrais builds,
  tests fournisseurs, tests de fuseau et heure d'été/hiver, tests de sécurité
  et matrice d'abonnement multi-source.

## Ordre de reprise recommandé

1. Compléter le prototype cliquable « Carnet vivant » dès réouverture du quota
   Figma, en suivant la matrice d'écrans et d'états.
2. Appliquer la migration dans une base preview éphémère et démontrer un
   check-in web → mobile → web, offline puis reconnecté.
3. Rejouer le moteur `/sync/push` et `/sync/pull` contre PostgreSQL avec deux
   appareils, collisions, révocation et changement de fuseau.
4. Étendre Traitements/Routines sur les mêmes contrats (occurrences, doses,
   correction et PRN).
5. Tester Appointment canonique sur deux appareils et ajouter l'export du brief,
   puis seulement connecter Google.
6. Ne brancher Santé et billing qu'après les gates privacy et entitlements
   correspondantes ; tester Cercle sur deux sessions avant activation.
