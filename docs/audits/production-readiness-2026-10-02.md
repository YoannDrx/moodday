# Mood Day — audit de préparation à la production

**Date : 2 octobre 2026, Europe/Paris. Verdict : NON PRÊT pour une ouverture publique, la commercialisation ou une publication App Store.**

Le produit possède un socle sérieux et de nombreux parcours réellement fonctionnels. La priorité est de terminer leur cohérence, de fermer les risques de sécurité et de prouver l'exploitation. Une réécriture générale ne serait pas justifiée par cet audit.

## 1. Périmètre, preuves et limites

État examiné : commit `1cde6ff` **avec toutes les modifications locales préexistantes**, dont 55 fichiers suivis modifiés et de nouveaux fichiers non suivis. Les résultats ne certifient ni le commit seul ni le déploiement public. Aucun fichier produit, configuration fournisseur, secret, abonnement ou donnée de production n'a été modifié. Seuls le rapport, ses preuves et des artefacts de vérification ont été produits. [Résultats structurés et reproductions](/Users/yoannandrieux/Projets/moodday/docs/audits/evidence-2026-10-02/README.md).

Méthode : lecture du README, des manifestes, des différences locales, des schémas/migrations, des services, routes, interfaces web/native, tests et runbooks ; exécution des contrôles locaux ; PostgreSQL 17.11 temporaire exclusivement sur loopback ; build Next de production et comptes synthétiques ; consultations HTTP et visuelles anonymes du site public. Les services payants et envois réels ont été neutralisés dans la recette locale.

Les qualifications employées sont : **Vérifié**, **Défaut reproduit**, **Risque par lecture**, **Hypothèse à confirmer**, **Non testé**. Les audits d'août/septembre constituent un historique, pas une preuve actuelle. Il n'y a pas de compromission ni de fuite intercompte démontrée dans cette mission ; cela n'équivaut pas à une certification de sécurité.

### Résultats obtenus aujourd'hui

| Vérification | Résultat et portée |
| --- | --- |
| `pnpm lint:ci` | Réussi, sans correction automatique |
| `pnpm ts` et `pnpm typecheck:mobile` | Réussis ; pas une preuve d'exécution sur téléphone |
| `pnpm test:ci --maxWorkers=2` | **182 fichiers, 1 149 tests réussis** |
| `pnpm test:coverage:release --maxWorkers=2` | **Échec de la gate**, malgré les 1 149 tests réussis : lignes/statements 78,65 % < 80 % ; branches webhooks 87,62 % < 90 % |
| `pnpm build`, avec base et paramètres isolés | Réussi, Next.js 16.3.0 |
| `prisma validate` ; `prisma migrate deploy` | Schéma valide ; **33 migrations appliquées depuis une base vide** |
| `verify:medication-integrity` | Réussi : rollback, stock concurrent, rejeu concurrent, conservation d'audit, suppression et file de purge externe |
| `verify:operational-jobs` | Réussi : un seul worker admis et reprise d'un retry ancien |
| `verify:auth-rate-limit` | Réussi au contrôle final : 24 concurrents, 5 admis, 19 refusés, expiration et anciens compteurs conservés |
| Playwright, build de production, 5 profils, 2 workers, aucun retry de scénario | **176 scénarios réussis en 6,3 min** : Chromium, Firefox, WebKit, Chrome mobile et WebKit mobile ; comptes et fournisseurs synthétiques |
| `pnpm audit --prod --json` | Échec : métadonnées du gestionnaire **6 critiques, 26 élevées, 11 modérées, 1 faible** ; ce ne sont pas 44 vulnérabilités exploitables démontrées |
| `verify:credential-rotations` | Échec : **12 entrées non clôturées** |
| `verify:vercel-source-boundary` | Réussi : fichiers d'environnement exclus de l'envoi source Vercel |
| Site public, lectures anonymes | Accueil, connexion, inscription, aide, confidentialité et crise accessibles ; `/api/health` 200 ; API santé sans session 401 ; robots/sitemap 200 |
| Axe sur le site public | Aucune violation détectée WCAG 2 A/AA et 2.1 AA sur accueil, connexion, inscription, crise, à 1 280 et 390 px ; ne couvre pas lecteurs d'écran ni tous les états |

La première exécution unitaire et la première création de base ont subi `ENOSPC`. L'instance temporaire a été arrêtée et ses seuls fichiers nettoyés. Après retour d'espace disponible, la base a été recréée et les tests relancés avec concurrence limitée. Un premier contrôle du rate limiter a également échoué sans diagnostic détaillé ; la répétition instrumentée puis le script original ont réussi. Ne pas interpréter ces incidents locaux comme des incidents de production.

Le premier essai Chromium sur `127.0.0.1` a donné 31 succès et 5 échecs : 4 refus d'origine sur le consentement et une passkey non enregistrée. La configuration du projet prévoit explicitement `localhost` pour WebAuthn. La recette finale utilise cette origine. Un diagnostic séparé a confirmé que le POST de consentement comparait l'Origin à l'origine interne `localhost` : Origin IP → 403, localhost/absent → 200. **Ces cinq échecs ne sont pas comptés comme des défauts des parcours sur la configuration canonique.** Les alias et reverse proxies restent à tester dans les environnements distants.

Non exécutés : achat réel, OAuth avec un compte fournisseur, envoi/réception Resend réel, inspection des consoles de production, charge soutenue, restauration fournisseur historique, rollback réel, EAS/TestFlight, HealthKit/SQLCipher/StoreKit/VoiceOver sur appareil, évaluation IA payante, installation fraîche `--frozen-lockfile`, SBOM/licences/Knip de cette passe. Node local v24.9.0 diffère du Node 22.x de CI : rejouer la release sur son runtime cible.

## 2. Produit réel et architecture

**Cible retenue :** adultes en France souhaitant garder des repères entre leurs journées et leurs rendez-vous, notamment lorsqu'une saisie longue est difficile. Rôles : titulaire du carnet, proche invité avec droits explicites, administrateur opérationnel. Le produit n'est ni un dossier médical professionnel ni un service d'urgence ; aucun rôle soignant prescripteur n'a été établi.

La boucle de valeur est : faire un point léger → retrouver des faits compréhensibles → préparer un rendez-vous → conserver les suites. Le traitement déclaré, les prises et le plan de sécurité doivent soutenir cette boucle. Les promesses d'analyse, de partage et de synchronisation engagent davantage la confiance que le nombre d'écrans.

Architecture : monolithe Next.js App Router/React/TypeScript à la racine, Expo/React Native dans `apps/mobile`, contrats/domaines partagés dans `packages`, PostgreSQL/Prisma, Better Auth, Vercel pour le web. Auth, consentements, propriété des objets et permissions sont vérifiés côté serveur. Web : IndexedDB chiffré ; natif : SQLite/SQLCipher et SecureStore ; synchronisation par opérations et curseurs. Les modèles historiques et V2 coexistent.

Services externes implémentés : Resend ; Google/Apple/GitHub OAuth ; Stripe et RevenueCat ; Vercel Blob ; OpenAI ; Google Calendar ; Web Push ; HealthKit et calendrier natif. Les flags empêchent l'activation de nombreux modules sans configuration. Leur présence dans le code n'établit pas leur disponibilité réelle.

**À conserver :** contrats partagés, monolithe, Postgres pour l'atomicité, architecture d'opérations offline, filtres serveur, séparation des notes privées, contrôle de publication des garanties. Aucun besoin démontré de microservices, Redis ou nouveau fournisseur d'IA. Le choix d'hébergement doit en revanche être réexaminé à partir de la qualification HDS, avant d'augmenter les volumes réels.

## 3. Problèmes prioritaires

P0 = incident critique démontré ou exposition immédiatement exploitable ; P1 = bloque le périmètre de lancement concerné ; P2 = important ; P3 = amélioration. **Aucun P0 produit n'a été reproduit.** Les avis de sécurité critiques imposent néanmoins un traitement immédiat de la dépendance et une qualification du runtime déployé.

| ID | Priorité | Constat | Nature |
| --- | --- | --- | --- |
| SEC-01 | P1, urgence sécurité | Next.js et dépendances dans des plages affectées par des avis nouveaux | Version affectée vérifiée ; exploitabilité à qualifier |
| SEC-02 | P1, toute ouverture | Clôture des rotations et isolation des environnements non prouvées | Gate réellement en échec |
| LEG-01 | P1, données réelles | Qualification HDS/AIPD et contrats non documentés comme approuvés | Preuves absentes du registre |
| DATA-01 | P1, cœur web/mobile | Check-in V2 enregistré mais absent de l'historique web | Reproduit via API + PostgreSQL + navigateur |
| DATA-02 | P1, natif | Réponse de rafraîchissement tardive écrasant un brouillon récent | Reproduit sur fonction extraite et SQLite mémoire |
| DATA-03 | P1, création/synchronisation | Rejeu concurrent d'un check-in rejeté par unicité ; contenu différent silencieusement accepté comme ancien résultat | Reproduit sur PostgreSQL réel |
| QA-01 | P1, livraison | Gate de couverture de release rouge | Mesuré |
| AUTH-01 | P1 si OAuth proposé | Premier/ancien compte Google et Apple non validés chez les fournisseurs | Non testé ; panne générale non démontrée |
| BILL-01 | P1 si vente Plus | URL webhook sans www encore redirigée ; flux fournisseur actuel non validé | 307 observé ; destination Stripe actuelle non inspectée |
| OPS-01 | P1 avant ouverture | Reprise métier/rollback non prouvés pour le candidat ; runbook encore à 27 migrations | Lecture et absence de preuve actuelle |
| MOB-01 | P1 publication native | Validation sur appareil et cohérence des promesses App Store manquantes | Lecture et non-test natif |
| UX-01 | P2 | OAuth sans retour d'erreur explicite et libellés coupés sur mobile | Lecture + capture publique |
| UX-02 | P2 | Appels « Commencer gratuitement » aboutissant à des inscriptions fermées | Observé sur le site public |
| ARCH-01 | P2 | Parcours Soin mélangeant objets historiques et V2, parité FR/EN partielle | Lecture |
| PERF-01 | P2 | Export complet chargé en mémoire ; absence de budget d'abus V2 partagé repéré | Risque par lecture, pas incident de charge |
| SEC-03 | P2 | Validation d'upload fondée sur le MIME déclaré ; conservation des octets d'origine | Lecture |
| MAIL-01 | P2 | Préfixe de tests qui neutralise aussi les e-mails en production | Lecture |

### SEC-01 — Dépendances : la preuve « aucun avis critique » est périmée

**Preuves :** [package.json:117](/Users/yoannandrieux/Projets/moodday/package.json:117) fixe Next `16.3.0` ; [package.json:186](/Users/yoannandrieux/Projets/moodday/package.json:186) déclare Sharp `0.35.3`. L'audit du lockfile remonte de nouveaux avis et des overrides devenus insuffisants pour js-yaml/brace-expansion.

L'[avis officiel next/og](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) couvre Next 16.2.0 à <16.3.6, avec une condition d'entrée attaquant dans le rendu SVG Node. Les images sociales du dépôt utilisent du contenu éditorial versionné : cette condition n'est pas démontrée ici. L'[avis officiel AVIF](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) concerne l'optimisation AVIF et annonce un correctif 16.3.3. L'avis Windows ne constitue pas une preuve d'exploitabilité sur l'hébergement Vercel ciblé.

**Impact :** candidat refusé par la gate de dépendances et dette de sécurité sur le framework public. **Correction :** actualiser vers une version stable corrigée couvrant au minimum ces avis (16.3.6 pour next/og), vérifier Sharp et les chemins transitifs effectifs web/mobile, mettre à jour le lockfile et réexaminer les exceptions existantes. Ne pas ajouter une exclusion générale pour faire passer CI.

**Effort :** 1–3 jours d'ingénierie, selon compatibilité Expo ; dépend de la matrice de runtime réelle. **Incertitude :** faible sur les versions, élevée sur l'exploitabilité du déploiement actuel. **Acceptation :** audit high/critical sans avis non traité, justification datée de chaque exception, build + recette du candidat corrigé, version réellement déployée identifiée.

### SEC-02 — Rotation des secrets et séparation des environnements

**Preuves :** `verify:credential-rotations` renvoie 12 `rotation_incomplete` ; [registre](/Users/yoannandrieux/Projets/moodday/docs/operations/evidence/credential-rotation-2026-08-14.json:1) contient 12 statuts `pending`. L'incident historique d'envoi d'environnement en Preview est documenté. Le filtre d'envoi actuel passe ; il ne révoque pas une ancienne valeur.

**Impact :** une exposition historique ne peut être déclarée close ; identité, base, stockage et fournisseurs sont concernés. Aucune affirmation que les anciennes clés sont encore actives : les consoles n'ont pas été consultées ici.

**Correction :** vérifier fournisseur par fournisseur rotation, révocation de l'ancienne valeur, revue d'activité et environnement destinataire ; consigner uniquement références opaques et dates. Pour les services abandonnés, la révocation et la suppression de l'intégration valent mieux qu'une nouvelle clé inutile. Ne pas comparer des valeurs masquées `[SENSITIVE]`.

**Effort :** 1–3 jours opérateur, hors délais fournisseur ; propriétaire sécurité + accès aux consoles. **Incertitude :** élevée sur l'état distant. **Acceptation :** gate verte, preuve d'ancienne valeur inutilisable et d'isolation Preview/Production, sans secret dans le dépôt.

### LEG-01 — Le statut « non médical » ne clôt pas le risque réglementaire

**Preuves :** [analyse HDS](/Users/yoannandrieux/Projets/moodday/docs/compliance/hds-assessment.md:1), [sous-traitants](/Users/yoannandrieux/Projets/moodday/docs/compliance/processors-and-regions.md:1) et [registre d'approbations](/Users/yoannandrieux/Projets/moodday/docs/operations/evidence/release-approvals-2026-08.json:1) ; 21 décisions encore `pending`, incluant HDS, AIPD, bases légales et rétention.

La qualification dépend du traitement et du contexte de recueil ; la région `fra1` ne constitue pas une certification. Voir le [cadre HDS de l'ANS](https://esante.gouv.fr/produits-services/hds). La CNIL demande une AIPD lorsque le traitement est susceptible d'engendrer un risque élevé : [définition officielle](https://www.cnil.fr/fr/definition/analyse-dimpact-aipd). Ces références justifient une analyse spécialisée, pas une certification par cet audit.

**Correction :** décision écrite sur HDS et le périmètre réellement exploité, analyse d'impact adaptée, DPA/transferts/support/sauvegardes, durées et retrait du consentement ; vérifier les obligations d'accessibilité, de consommation/TVA et Apple selon les marchés et options retenus. Si HDS applicable, changer uniquement les composants nécessaires à une chaîne d'hébergement conforme. Ne pas engager une migration complète sans qualification.

**Effort :** 1–2 jours pour préparer le dossier technique ; délai et coût de validation spécialisée à chiffrer séparément. **Incertitude :** forte sur la conclusion juridique. **Acceptation :** décision attribuée, datée, liée au périmètre/commit et aux contrats réels ; textes publics alignés. Une bêta avec données de santé réelles n'est pas une dispense.

### DATA-01 — Le journal web ignore les check-ins V2

**Reproduction :** compte synthétique vérifié et consentant ; POST `/api/v2/check-ins` → 201 ; PostgreSQL contient 1 `CheckIn`, 0 `MoodEntry` ; ouvrir `/mood/history` sans filtre → « Aucune entrée pour ces filtres ». [Capture](/Users/yoannandrieux/Projets/moodday/docs/audits/evidence-2026-10-02/history.png).

**Cause :** [searchJournal:85](/Users/yoannandrieux/Projets/moodday/src/features/mood/journal-search.action.ts:85) ne lit que `moodEntry`. La projection [readMoodRange](/Users/yoannandrieux/Projets/moodday/src/features/insights/mood-read-model.ts:11), ajoutée pour courbes/exports, ne couvre pas cette recherche. **Impact :** données conservées mais invisibles, impression de perte et recherche des notes incomplète après saisie V2/native.

**Correction :** projection de journal unifiée avec origine/type, pagination stable, date civile et précision temporelle ; conserver les notes visibles à leur propriétaire sans les inclure automatiquement dans un brief. Ne pas doubler les écritures dans V1 et V2 pour masquer le problème.

**Effort :** 2–4 jours ; dépend du contrat canonique de journal. **Incertitude :** faible. **Acceptation :** saisie présence/rapide/complète et ancienne entrée apparaissent après reconnexion, recherche, filtre de date et pagination, sans doublon ni transformation d'une absence de score en zéro ; vérification croisée web/iOS.

### DATA-02 — Un rafraîchissement peut écraser une saisie mobile récente

**Preuves :** [refreshUserDraft:1292](/Users/yoannandrieux/Projets/moodday/apps/mobile/src/lib/local-database.ts:1292) vérifie l'état avant l'appel réseau, puis réécrit inconditionnellement après la réponse. `refreshSyncedPreferences` suit le même schéma ; `discardUserDraft` réutilise aussi un état lu avant l'attente.

Un harnais a exécuté la fonction `refreshUserDraft` extraite du fichier, avec réponse réseau différée et SQLite mémoire : lecture « synced » → modification locale « dirty » → arrivée de l'ancienne réponse → ancien contenu enregistré « synced ». **C'est une preuve du défaut de logique, pas une recette SQLCipher/iPhone.** Les cinq tests de réconciliation d'acquittement existants ne couvrent pas ce rafraîchissement. La restauration de préparation de rendez-vous n'empêche pas non plus une saisie pendant le chargement : [écran:128](/Users/yoannandrieux/Projets/moodday/apps/mobile/app/appointment/[appointmentId].tsx:128).

**Correction :** appliquer un compare-and-swap sur la version/contenu/identité lus, revalider après réseau, préserver le brouillon récent et signaler le conflit ; gérer serveur absent, abandon puis recréation, changement de compte et réponses hors ordre. Réutiliser la stratégie de réconciliation déjà présente.

**Effort :** 2–4 jours, hors appareil réel. **Incertitude :** faible pour la fonction, fréquence UI à mesurer. **Acceptation :** tests déterministes avec promesses différées pour refresh/save/discard et préférences ; une édition plus récente ne disparaît jamais ; preuve native en réseau lent et hors ligne.

### DATA-03 — Idempotence de création incomplète

**Reproduction PostgreSQL :** 12 appels simultanés à `createCheckIn`, même utilisateur, même `operationId`, même contenu → **1 réussite, 11 `P2002`, 1 ligne conservée**. Rejouer ensuite le même identifiant avec valence 9 au lieu de 5 retourne silencieusement 5.

**Cause :** [service:47](/Users/yoannandrieux/Projets/moodday/src/features/v2/check-ins/service.ts:47) lit le reçu avant l'upsert, puis crée le reçu sans arbitrage du conflit concurrent ; le digest est stocké mais n'est pas comparé lors du rejeu. L'API convertit l'erreur en 503. Il n'y a pas de doublon en base dans cette preuve, mais le client reçoit un échec après une opération effectivement réalisée.

**Correction :** verrou/réservation atomique par utilisateur-opération ou reprise de conflit hors transaction ; renvoyer le même résultat pour une répétition identique et un conflit explicite pour un contenu différent. Aligner aussi `/sync/push`, dont le retour « duplicate » ne compare pas le digest : [sync:1441](/Users/yoannandrieux/Projets/moodday/src/features/v2/sync/service.ts:1441).

**Effort :** 1–3 jours ; dépend du contrat d'erreur et de la normalisation du digest. **Incertitude :** faible. **Acceptation :** 24 appels simultanés identiques donnent le même identifiant sans 5xx et une seule écriture ; contenu différent → 409/code de conflit ; interruption et rejeu par API directe et sync testés.

### QA-01 — La gate de couverture bloque réellement CI

**Preuves :** [configuration:50](/Users/yoannandrieux/Projets/moodday/vitest.config.mjs:50) et résultat de `test:coverage:release`. Global : lignes/statements 78,65 %, branches 78,41 %, fonctions 81,03 %. Webhooks agrégés 87,62 % ; RevenueCat 64,51 %, Stripe 100 %, Resend 97,61 % de branches. Le workflow de qualité exécute cette gate.

**Correction :** couvrir les comportements manquants, en priorité réception RevenueCat : événement test/sans utilisateur, erreur fournisseur et persistance du statut, reprise/dédoublonnage et branches de refus. Ajouter les reproductions DATA-01/02/03 aux bonnes couches et tester les services/API V2 encore non exercés. Ne pas abaisser les seuils ou tester une copie de l'implémentation pour obtenir du vert.

**Effort :** 2–4 jours ; dépend des corrections. **Incertitude :** faible. **Acceptation :** gate existante verte sur le candidat, avec assertions métier et scénarios de panne ; builds web/natif et E2E associés au même SHA. Le pourcentage seul ne prouve pas la qualité.

### AUTH-01 — Google : défaut général non établi, parcours fournisseur non prouvé

**Vérifié :** Google et Apple sont affichés sur la connexion publique. [Configuration Google:75](/Users/yoannandrieux/Projets/moodday/src/lib/auth.ts:75) conditionnée par identifiant/secret, `disableSignUp` dès que le mode n'est pas `public`, état OAuth côté base, chiffrement des tokens, rapprochement d'e-mails vérifiés. L'inscription publique annonce actuellement sa fermeture. **Un nouveau compte Google peut donc être refusé volontairement ; ce n'est pas une preuve de mauvais callback.** Le mode `invite` ne propose pas ici de création sociale équivalente à l'allowlist e-mail.

**Non testé :** premier compte et compte existant chez Google, consent screen, URI exactes, annulation, compte à e-mail non vérifié, liaison à un compte e-mail, retour iOS et révocation. Selon la [documentation Better Auth officielle](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/authentication/google.mdx), le callback doit correspondre au domaine de l'application et à `/api/auth/callback/google`.

**Plan de diagnostic :** commencer sur un environnement de recette dédié avec un compte Google de test et le mode d'inscription prévu ; contrôler origine canonique/callback autorisé et configuration du consent screen ; enregistrer uniquement étape, code d'erreur et request ID ; vérifier la session créée, les quatre consentements et l'accès santé après retour. Tester ensuite le compte existant, le refus/annulation et le retour natif. Ne pas utiliser la vraie base pour fabriquer ces preuves.

**Effort :** 0,5–2 jours après accès aux consoles/comptes de test. **Incertitude :** élevée sur la cause de la panne signalée. **Acceptation :** parcours provider → callback → session → consentement → check-in prouvé ; aucun accès santé avant autorisation ; refus d'inscription compréhensible. Alternative de lancement web : ne proposer que l'e-mail tant qu'OAuth n'est pas validé. Les exigences Apple doivent être évaluées séparément pour la publication iOS.

### BILL-01 — Flux commercial externe non clôturé

**Vérifié aujourd'hui :** HEAD `https://moodday.app/api/webhooks/stripe` → **307** vers l'URL avec `www`. Le précédent audit avait identifié une destination Stripe sur l'ancienne URL ; sa configuration actuelle n'a pas été relue. Stripe considère les réponses 3xx comme des échecs : [documentation fournisseur](https://docs.stripe.com/webhooks). Le correctif local renvoyant 503 lorsque la facturation est fermée est présent ; les tests de webhook passent.

**Correction avant vente :** identifier compte/catalogue/destination Moodday, URL finale, version API et secret ; inventorier les événements affectés sans rejouer ceux d'autres applications ; démontrer paiement test, mise à jour durable des droits, rejeu, ordre inversé, échec puis reprise, remboursement et annulation. Vérifier séparément RevenueCat/StoreKit, la restauration et les doubles abonnements.

**Effort :** 2–4 jours web ; 2–4 jours supplémentaires native selon readiness fournisseur. **Incertitude :** élevée sur la configuration distante. **Acceptation :** reçus et entitlement concordants, réconciliation sans anomalie non expliquée, alerte livrée. **Ne bloque pas une bêta sans vente, avec toute facturation fermée.**

### OPS-01 — Reprise et runbook non alignés sur le candidat

**Preuves :** [runbook:52](/Users/yoannandrieux/Projets/moodday/docs/operations/production-release-runbook.md:52), lignes 104 et 141 attendent toujours 27 migrations et 64 tables, alors que 33 migrations viennent d'être appliquées. La [preuve de sauvegarde historique](/Users/yoannandrieux/Projets/moodday/docs/operations/backup-restore.md:1) distingue explicitement clonage de branche et restauration métier ; RPO historique, rétention et bascule complète ne sont pas démontrés ici.

**Correction :** dériver les migrations/tables attendues du candidat, répéter upgrade depuis la dernière release avec données synthétiques représentatives, restauration d'un point antérieur puis connexion/check-in/export ; chronométrer RPO/RTO acceptés par le métier. Tester la reprise du déploiement précédent compatible avec les migrations additives. Ne jamais assimiler rollback applicatif et restauration de base.

**Effort :** 1–3 jours après accès à la recette fournisseur. **Incertitude :** moyenne. **Acceptation :** exercice daté reproductible, compte rendu sans contenu privé, rollback compatible désigné, contact d'astreinte et alerte réellement reçue. Les registres d'approbation devraient différencier bêta cœur/vente/IA/native : leur liste fixe actuelle exige notamment OpenAI et Stripe même si ces modules sont retirés du périmètre. Adapter cette gouvernance sans supprimer les garanties communes.

### MOB-01 — Promesses natives et preuve sur appareil

**Preuves :** [fiche FR/EN](/Users/yoannandrieux/Projets/moodday/apps/mobile/store.config.json:14) promet une timeline commune check-ins/traitements/routines/rendez-vous ; [landmarks:52](/Users/yoannandrieux/Projets/moodday/apps/mobile/src/lib/landmarks.ts:52) construit la timeline uniquement avec les check-ins. Les prises/routines sont des compteurs séparés ; les rendez-vous ne sont pas fournis à cette fonction. Le point complet existe désormais : ne pas reprendre l'ancien constat « seulement rapide ».

**Impact :** promesse fonctionnelle partiellement tenue ; unitaires DOM et profils mobile web ne valident pas iOS natif. L'état App Store/EAS observé en septembre n'a pas été actualisé en console aujourd'hui.

**Correction :** livrer la timeline réellement annoncée ou réduire la description, puis geler un nouveau binaire et une fiche de même version ; recette iPhone : session, retour OAuth/MFA, SQLCipher/clé, mode avion après arrêt/redémarrage, changement de compte, autorisations partielles HealthKit, notifications, calendrier et StoreKit si activés. Français d'abord est une alternative explicite à une parité bilingue inachevée.

**Effort :** 3–6 jours de recette/corrections ciblées, hors revue Apple ; dépend de DATA-02 et des consoles. **Incertitude :** forte pour le runtime natif. **Acceptation :** matrice signée sur appareils cibles, fiche factuelle, absence de donnée brute HealthKit dans le trafic, suppression locale et serveur contrôlée.

### UX-01 — Connexion : erreurs silencieuses et texte mobile coupé

**Preuves :** [ProviderButton:36](/Users/yoannandrieux/Projets/moodday/app/auth/signin/provider-button.tsx:36) attend `signIn.social` sans exploiter le résultat `error` ni afficher l'état d'échec de la mutation ; [grille fournisseurs](/Users/yoannandrieux/Projets/moodday/app/auth/signin/sign-in-providers.tsx:66) en deux colonnes. La [capture à 390 px](/Users/yoannandrieux/Projets/moodday/docs/audits/evidence-2026-10-02/mobile-signin.png) montre les textes Google/Apple débordants/tronqués.

**Correction :** erreurs inline accessibles, bouton réactivé et retry, retour d'annulation explicite ; une colonne fournisseurs sur petit écran, deux lorsque la largeur le permet. Encoder le callback imbriqué au lieu de concaténer ses paramètres.

**Effort :** 0,5–1 jour. **Incertitude :** faible sur le code et l'affichage, impact exact d'une erreur fournisseur à reproduire. **Acceptation :** 320/390 px et texte agrandi sans texte coupé ; erreurs 400/429/503/hors ligne lisibles au clavier/lecteur d'écran. Aucun appel OAuth réel n'a été simulé en production.

### UX-02 — Acquisition vers une impasse

**Preuves :** plusieurs CTA de l'[accueil:310](/Users/yoannandrieux/Projets/moodday/src/features/landing/immersive-landing.tsx:310) promettent un démarrage immédiat ; [/auth/signup:62](/Users/yoannandrieux/Projets/moodday/app/auth/signup/page.tsx:62) affiche la fermeture. La navigation publique alterne aussi « vous » et « tu ».

**Correction :** libellé « Bêta privée — accès sur invitation » lorsque fermé, avec connexion existante et information claire ; n'ajouter une liste d'attente que si un responsable et un usage sont définis. Conserver la transparence actuelle sur Plus indisponible.

**Effort :** 0,5–1 jour. **Incertitude :** faible. **Acceptation :** les trois modes closed/invite/public ont des CTA cohérents jusque dans l'écran d'arrivée ; pas de promesse de création immédiate sans possibilité réelle.

### ARCH-01 — Deux générations de parcours restent mêlées

**Preuves :** [Soin:105](/Users/yoannandrieux/Projets/moodday/app/(logged-in)/(patient-layout)/consultation/page.tsx:105) envoie « Rendez-vous : préparation, séance, débrief » vers la liste historique `/therapy`, et « Routines » vers `/exercises`. Les objets V2 Appointment/Routine sont affichés séparément plus bas et consommés par le mobile. Des libellés de Soin et des écrans natifs restent codés en français malgré des réglages/une fiche anglaise.

**Correction :** une entrée principale par objet canonique ; anciennes thérapies/exercices conservés comme historiques explicitement nommés et migrés/projetés progressivement ; contrat de lecture commun et matrice web/native/langue. Pas de suppression de tables avant vérification des données historiques.

**Effort :** 3–6 jours selon adaptation/migration retenue ; dépend de la décision produit. **Incertitude :** moyenne sur tous les usages. **Acceptation :** rendez-vous et routine créés sur un client retrouvés au bon endroit sur l'autre ; aucune action principale ne mène à un modèle concurrent non expliqué ; langues annoncées testées.

### PERF-01 — Export et abus : capacité non prouvée

**Preuves :** [export complet:3](/Users/yoannandrieux/Projets/moodday/src/features/account/user-data-export.ts:3) charge les collections dans une transaction ; [json-download:5](/Users/yoannandrieux/Projets/moodday/src/features/account/json-download.ts:5) sérialise/enfile toutes les sections depuis `start()`. L'objet entier reste donc en mémoire avant le « stream ». Les routes V2 check-in/sync utilisent une authentification mais aucune limitation applicative commune de débit/volume n'a été repérée dans leur middleware. Ce constat n'exclut pas une protection fournisseur distante non inspectée.

**Correction :** mesurer l'export sur un historique synthétique volumineux ; paginer/sérialiser progressivement ou passer en job téléchargeable si les mesures le justifient ; conserver un instantané cohérent. Définir limites par compte pour écritures, synchronisations, appareils et bytes, avec 429/Retry-After sans pénaliser une reprise offline légitime. Mesurer latence p95/p99, mémoire, saturation du pool, durées des transactions et backlog.

**Effort :** 1–2 jours de mesure, 1–3 jours de correction ciblée. **Incertitude :** élevée sur le seuil de saturation, pas de panne reproduite. **Acceptation :** budget de capacité explicite et test sur données synthétiques ; pas d'export tronqué, pas de croissance mémoire incontrôlée ni d'admission illimitée d'un compte abusif. Pas de cache partagé sur données santé.

### SEC-03 — Upload d'avatar insuffisamment normalisé

**Preuves :** [upload-image:37](/Users/yoannandrieux/Projets/moodday/src/features/images/upload-image.action.ts:37) accepte tout MIME commençant par `image/` jusqu'à 2 Mio ; le client limite plus strictement, mais peut être contourné. [adaptateur Blob:56](/Users/yoannandrieux/Projets/moodday/src/lib/files/vercel-blob-adapter.ts:56) stocke les octets d'origine en public sans décodage/réencodage ni retrait EXIF.

**Impact :** formats actifs/inattendus et métadonnées personnelles potentiellement conservés ; **XSS/exfiltration non démontrées**, notamment car stockage sur origine distincte et CSP présente.

**Correction :** liste de formats réellement supportés côté serveur, vérification par décodage avec bibliothèque corrigée, limite de dimensions, réencodage/retrait EXIF, MIME cohérent, quotas ; clarifier le caractère public de l'avatar. **Effort :** 1–2 jours après SEC-01. **Incertitude :** moyenne. **Acceptation :** faux MIME/SVG/polyglotte/image gigantesque refusés ; EXIF absent du résultat ; remplacement et suppression de l'ancien Blob vérifiés.

### MAIL-01 — Comportement de test actif pour des adresses réelles

**Preuve :** [send-email:75](/Users/yoannandrieux/Projets/moodday/src/lib/mail/send-email.ts:75) renvoie un succès sans envoi pour toute adresse commençant par `playwright-test-`, sans vérifier l'environnement ni le domaine réservé. Avec plusieurs destinataires, un seul préfixe suffit à neutraliser tout l'envoi.

**Correction :** adaptateur mail explicitement isolé pour les tests, ou condition stricte environnement de test + domaine réservé ; jamais une convention de préfixe en production. **Impact :** vérification, récupération et suppression inopérantes pour une adresse pourtant valide. **Effort :** 0,5 jour ; incertitude faible. **Acceptation :** une adresse réelle de ce préfixe emprunte l'adaptateur normal en test unitaire du mode production ; aucun e-mail externe pendant les E2E.

## 4. Matrice des fonctionnalités et parcours

| Parcours | État réel | Vérifications / restant |
| --- | --- | --- |
| Découverte, tarifs, aide, crise | Présents ; Plus annoncé indisponible ; CTA inscription incohérent | HTTP/visuel/axe aujourd'hui ; fermer UX-02 |
| Inscription e-mail et consentements | Implémentés, fermeture publique volontaire | E2E synthétiques ; livraison Resend, spam/bounce et liens réellement reçus à valider |
| Connexion, récupération, déconnexion, MFA | Fonctionnels dans la recette | E2E, réauthentification et codes TOTP ; compte fournisseur réel non testé |
| Passkeys | Implémentées ; contexte localhost nécessaire en recette | Authentificateur virtuel Chromium ; Safari/iPhone/Android physique à valider |
| Google/Apple | Boutons publics et intégrations présentes | Aucun aller-retour réel aujourd'hui ; AUTH-01/UX-01 |
| Accès santé / consentements périmés | Contrôles serveur présents | 401 anonyme public ; E2E ancien consentement/refus/rejeu ; reverse proxy à valider |
| Check-in et offline web | Saisie/sync fonctionnelles ; défaut de concurrence et historique | E2E nominal et sept jours offline ; reproductions DATA-01/03 |
| Point complet natif | Présence, rapide et compléments anxiété/note existent | Unitaires d'écran ; ergonomie/adaptation et saisie multiappareils à recetter |
| Journal et courbes | Projection V1/V2 pour courbes/export ; historique encore V1 | DATA-01 ; dates/DST et projection couverts par unitaires |
| Traitements/prises/PRN/stock | Implémentés avec atomicité et audit | PostgreSQL intégrité réussi ; scénarios natifs, échéances/fuseaux et erreurs à valider |
| Soin/routines/consultation | Modèles V1 et V2 disponibles, navigation ambiguë | Import/tags/PDF/plan testés ; ARCH-01 ; continuité web/iOS à valider |
| Partage de brief | Capacité temporaire, notes privées exclues, révocation | E2E téléchargement/fragment/révocation ; Blob DSAR réel distinct non testé |
| Cercle titulaire/proche | Permissions et expiration implémentées, deux générations | Recette invitations/révocation/refus/expiration ; rôle aidant natif et contrats V2 à compléter |
| Administrateur | Surface fermée par défaut, rôle frais + MFA | E2E fermeture ; pas de recette admin active distante |
| Plan de sécurité | Présent, ressource crise publique | E2E web ; disponibilité native après redémarrage sans réseau à prouver |
| Exports JSON/CSV/PDF, suppression | Implémentés ; listes de champs et réauthentification | Téléchargement réel synthétique, suppression et file externe ; capacité/purge fournisseur restant |
| Notifications | Scheduler/retry/dédoublonnage implémentés | Test de concurrence et jobs ; livraison et confidentialité écran verrouillé non testées |
| Google Agenda / calendrier natif | Implémentés, activation conditionnelle | Tests isolés seulement ; retour fournisseur, conflits, permissions/révocation réels à prouver |
| HealthKit | Agrégats serveur, brut local prévu | Contrats/unitaires ; iPhone et trafic non inspectés |
| Stripe / RevenueCat / Plus | Implémentés, vente web fermée publiquement | Unitaires ; catalogue/achats/reprise/remboursements réels de test à prouver |
| Insights IA | Politique, quotas/timeout et rollout contrôlés | Unitaires ; corpus live et revue spécialisée non réalisés ; retirer du lancement initial possible |
| Langues / accessibilité | FR/EN web partiel selon surface, mobile surtout FR | Axe et responsive web ; lecture vocale, zoom et dynamic type natifs à faire |

## 5. Bilan par domaine et décisions produit/design

- **Authentification/autorisation :** contrôles serveur, e-mail vérifié, quatre consentements, sessions revérifiées en base pour permettre la révocation immédiate, réauthentification sensible et MFA admin sont de bons choix. Les tests ne remplacent pas la preuve OAuth ni les essais d'alias. Pas d'isolation multi-organisation à certifier : le produit est personnel, l'isolation pertinente est compte/relationship/contrat.
- **Données :** transactions, contraintes et opérations signées par propriétaire sont de vrais points forts. La coexistence V1/V2 est maintenant le principal risque produit, davantage qu'un manque de tables. Conserver migrations additives et projection ; compléter intégrité des rejeux, recherche et timeline. Réconcilier sauvegardes, purges différées et rétention documentée sans promettre l'effacement immédiat de toutes les copies.
- **Sécurité/confidentialité :** CSP à nonce, absence de cache API, contrôles d'accès, logs expurgés et stockage local cloisonné sont présents. Le service worker ne conserve pas pages authentifiées/API. CORS/CSRF n'ont pas fait l'objet d'un pentest complet ; les cookies et routes doivent être éprouvés sur les domaines réels et requêtes cross-site. Pas de preuve générale d'absence d'injection/XSS.
- **Infrastructure :** pipelines pinés par SHA, bases CI isolées, gates et watchdog existent. Le passage effectif par ces portes, les protections de branche, la livraison des alertes, les coûts et la restauration distante ne sont pas démontrés aujourd'hui. Corriger le runbook avant utilisation.
- **Performance :** pagination de check-ins et requêtes bornées sur plusieurs listes ; exports complets et hydratation de sync à mesurer. Aucun chiffre de capacité commerciale déduit des temps locaux. Les dépendances mobiles transitives dans l'audit ne sont pas automatiquement embarquées dans une fonction web.
- **UI/UX :** identité calme et lisible, quatre intentions principales, états d'erreur/attente présents. Défauts objectifs : historique incomplet, CTA fermé, boutons OAuth coupés. Préférences de design : choisir un ton unique, réduire l'illustration de connexion mobile pour rapprocher les champs, présenter une action principale par écran et une confirmation distinguant « enregistré sur cet appareil » de « synchronisé ».
- **Accessibilité :** résultat axe positif sur les pages visitées ; absence de débordement global à 390 px, mais débordement interne OAuth constaté. Tester parcours complet clavier, focus après erreur/modale, lecteur d'écran, texte agrandi, réduction de mouvement et annonces de synchronisation. Ne pas déclarer WCAG/RGAA conforme depuis axe seul.
- **Acquisition/confiance :** pas de preuve utilisateur ni de taux de conversion dans cet audit. Choisir une promesse unique autour de la préparation de rendez-vous et montrer un exemple explicitement fictif. Mesurer activation/premier check-in réussi/retour volontaire/export utile via événements minimaux sans notes ni scores ; éviter un outil de session replay sur ces écrans. Blog/SEO utiles en second plan ; sitemap/robots disponibles, métadonnées sensibles et URLs partagées à conserver non indexables.
- **Intégrations :** erreurs/retries/idempotence sont prévus, mais ne confondre ni l'acceptation d'un webhook et l'application d'un droit, ni un test mock et une livraison. Tester annulation et révocation autant que le nominal. Budget IA déjà prévu, à raccorder à une alerte fournisseur avant activation.
- **Obligations :** documents et consentements versionnés présents ; validation spécialisée restante. Une bannière cookies n'est pas une exigence automatique si seuls des mécanismes exemptés sont utilisés : inventorier réellement stockage/trackers et revoir dès ajout d'analytics. Vérifier l'applicabilité des obligations d'accessibilité et de droit de la consommation avant le périmètre commercial.

**Choix stratégique recommandé :** première bêta web France 18+, sans vente ni IA, centrée sur check-in → historique fiable → préparation/export → suppression. Autoriser l'accès aux données réelles seulement après SEC-02/LEG-01 et les corrections du cœur. Reporter HealthKit, Agenda, push, Cercle et native si leurs preuves retardent ce périmètre ; leurs options doivent alors être retirées des promesses/menus. Si l'iPhone est la cible commerciale première, garder le même cœur mais accepter explicitement la gate appareil et DATA-02 avant lancement.

**À simplifier/supprimer :** points d'entrée concurrents V1/V2, garanties sans preuve courante, mentions FR/EN non tenues, CTA sans débouché. **À ne pas ajouter maintenant :** réseau social, diagnostic, assistant thérapeutique, dashboard soignant complet, microservices ou nouveau système de cache. Leur coût et leur risque ne répondent pas aux défauts observés.

## 6. Plan ordonné de mise en production

Efforts en jours-personne, ordre de grandeur pour quelqu'un connaissant le dépôt ; ils ne sont pas des délais garantis. Les travaux se recouvrent : ne pas additionner mécaniquement toutes les estimations des fiches.

| Étape | Travail concret | Dépendances / responsable | Effort | Sortie vérifiable |
| --- | --- | --- | --- | --- |
| A — Définir le candidat | Périmètre web/natif, langues et flags ; figer les changements locaux dans un candidat reproductible | Product + CTO | 0,5–1 j | SHA, scope et promesses de release identiques |
| B — Sécurité urgente | SEC-01, SEC-02 ; dossier LEG-01 en parallèle | Engineering, opérateurs, spécialiste juridique | 2–5 j techniques + délai externe | Dépendances traitées, clés révoquées, décisions/contrats probants |
| C — Fiabiliser le cœur | DATA-01/02/03 ; erreurs OAuth et e-mails ; cohérence Soin | Engineering + QA ; natif seulement si retenu | 5–9 j | Reproductions devenues tests verts, pas de perte ni erreur de rejeu |
| D — Fermer les gates | QA-01, installation verrouillée, web/mobile types/build, 5 profils, Node CI | Après B/C | 2–4 j | Toutes gates du candidat vertes sans retries de scénarios |
| E — Répéter l'exploitation | OPS-01 ; upgrade réel de recette, restauration, rollback, alarmes et support | Ops ; validation hébergement | 1–3 j | Compte rendu daté, RTO/RPO acceptés, alerte reçue |
| F — Recette du périmètre externe | OAuth/e-mail ; autres fournisseurs uniquement si livrés | Accès de test et candidat stable | 1–3 j cœur ; lots optionnels supplémentaires | Parcours réel de bout en bout, échecs/reprises compris |
| G — Bêta limitée | Panel volontaire, langage et informations légales adaptés, mesure de la boucle utile | Go/no-go documenté ; instruction de déploiement distincte | Période à définir | Données correctement conservées/retrouvées/exportées/supprimées ; support opérationnel |
| H — Améliorations | Timeline native, parité linguistique, capacité, achats/IA si valeur démontrée | Retours bêta et gates propres à chaque option | Lots séparés | Gains d'usage mesurés, pas uniquement nouveaux écrans |

Pour le cœur web, prévoir **environ 10–18 jours-personne** de correction/qualification technique, hors délais juridiques/fournisseurs et sans engagement commercial. Un lancement native/Plus/IA simultané élargit nettement ce périmètre ; il n'est pas recommandé pour fermer les problèmes actuels.

## 7. Checklist de lancement vérifiable

Chaque case doit porter SHA, environnement, date, opérateur et lien de preuve sans secret. Les validations de cette mission portent sur l'état local actuel, pas sur le futur candidat corrigé.

- [ ] Candidat propre, dépendances verrouillées, scopes et flags validés ; installation fraîche reproductible sur Node cible.
- [ ] Avis high/critical traités ; aucune exception globale non justifiée ; runtime déployé identifié.
- [ ] Incidents/rotations clôturés, anciennes valeurs révoquées et environnement de recette isolé.
- [ ] HDS/AIPD/bases légales/DPA/transferts/rétention/accessibilité décidés pour le périmètre réel ; consentements, aide et support cohérents.
- [ ] `lint:ci`, `ts`, `typecheck:mobile`, `test:coverage:release`, audit, schéma, build, SBOM/licences et analyse de code du candidat passent.
- [ ] 5 profils Playwright verts sans retry ; MFA/passkey, session expirée/révoquée, récupération, quatre consentements, suppression couverts.
- [ ] Check-in web/natif → historique/recherche/courbe/export cohérents ; offline 7 jours et changement de fuseau/DST ; note privée exclue des partages par défaut.
- [ ] Rejeu identique concurrent, contenu divergent, double clic, timeout après commit et interruption testés ; une seule écriture et résultat explicite.
- [ ] Brouillon sauvegardé pendant refresh/discard et changement de compte préservé ; sync en conflit comprise par l'utilisateur.
- [ ] Compte A ne lit/modifie/exporte pas B ; proche avec permission partielle, expirée et révoquée testé ; administration indisponible ou MFA prouvé.
- [ ] E-mails réellement reçus en recette ; bounce/erreur visible ; liens expirés/rejoués/refusés ; pas de données de santé dans envois/logs.
- [ ] OAuth réel prouvé ou boutons retirés ; annulation, nouvel utilisateur, compte existant, consentement et retour mobile traités.
- [ ] Si payant : Stripe/RevenueCat testent paiement, retry, duplication, désordre, grâce, remboursement, révocation et restauration ; réconciliation et alertes passent.
- [ ] Si native : iPhone réel/TestFlight, SQLCipher, réseau coupé/redémarrage, permissions partielles, notifications, VoiceOver/dynamic type et fiche exacte prouvés.
- [ ] Si IA/HealthKit/Agenda/push/Cercle : gates propres signées ; sinon fonctions et promesses fermées.
- [ ] Mesures de latence/ressources sur charge synthétique décidée ; export volumineux complet ; limites d'abus et coûts documentés.
- [ ] Upgrade depuis la release précédente, restauration historique et rollback compatible répétés ; pas seulement création d'une base vide.
- [ ] Alertes testées : erreur auth/check-in/export, indisponibilité DB, job mort, backlog de purge, retard webhook et conflit d'entitlement ; destinataire et procédure d'escalade nommés.
- [ ] Surveillance de lancement avec kill switches indépendants, seuils décidés avant ouverture et contact support ; rollback déclenchable sans improvisation SQL.
- [ ] Instruction distincte du propriétaire pour déployer/activer ; après publication autorisée, smoke tests et surveillance sur le déploiement identifié.

## 8. Inconnues et décisions nécessaires

1. Quel premier périmètre vend-on réellement : web seul, iPhone, Plus, FR uniquement ? Hypothèse de ce plan : bêta web gratuite France 18+.
2. Le SHA/configuration réellement déployés et l'état des données/migrations de production ne sont pas attestés par le build local.
3. Preuves privées de révocation, isolation, contrats HDS/DPA, AIPD et responsables à obtenir ; leur absence du registre ne prouve pas que rien n'a été fait hors dépôt.
4. Comptes de test/accès Google, Apple, Resend, Stripe, RevenueCat et EAS nécessaires aux recettes correspondantes. Ils n'ont pas été utilisés pour valider les parcours aujourd'hui.
5. Appareils iOS/Android ciblés, versions supportées et engagements d'accessibilité à fixer ; les émulations web ne répondent pas à cette question.
6. Nombre d'utilisateurs attendu, historique maximal, budget fournisseur, objectifs RPO/RTO et couverture du support à décider avant les essais de capacité.
7. Aucune étude utilisateur n'établit encore ici que les repères sont compris ou que le brief est utile en rendez-vous. Réaliser 5–8 séances avec tâches concrètes et données fictives avant d'élargir les promesses.

Les corrections techniques peuvent avancer sans attendre toutes les décisions externes. En revanche, leur réalisation ne doit pas servir à inventer les preuves fournisseurs, juridiques ou natives manquantes.
