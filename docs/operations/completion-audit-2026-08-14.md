# Moodday — audit de complétude du plan Production

Date de l'audit : 18 août 2026
Périmètre : release France, adultes 18+, branche
`codex/moodday-production-readiness`

Ce document rapproche les phases 0 à 10 du plan accepté avec les preuves
disponibles. Il ne transforme pas une validation fournisseur ou humaine en
preuve technique. Une phase marquée « implémentée » peut donc conserver une
porte d'activation externe fermée.

## Légende

- **Implémenté et vérifié** : le code, les migrations et les contrôles
  automatisables sont présents et une preuve locale reproductible existe.
- **Implémenté, preuve Production ouverte** : le code est terminé, mais son
  fonctionnement doit encore être démontré sur le compte fournisseur de
  Production.
- **Validation humaine ouverte** : la décision relève d'une autorité juridique,
  clinique, comptable, sécurité, accessibilité ou go/no-go.
- **Activation interdite** : une porte fail-closed empêche le déploiement ou
  l'ouverture tant que la preuve manque.

## Synthèse de complétude

| Phase                | État du travail interne                        | Porte restante                          | Autorité ou environnement                |
| -------------------- | ---------------------------------------------- | --------------------------------------- | ---------------------------------------- |
| 0 — baseline         | Implémenté et vérifié                          | Aucune porte interne                    | CI locale et future CI GitHub            |
| 1 — identité         | Implémenté et vérifié                          | OAuth réel et passkeys physiques        | Fournisseurs OAuth et appareils ciblés   |
| 2 — hors ligne/push  | Implémenté et vérifié                          | Push réel multi-appareils               | Vercel/Push et appareils ciblés          |
| 3 — aidants/exports  | Implémenté et vérifié                          | Cycle DSAR Blob et validation DPO       | Vercel Blob Production et DPO            |
| 4 — intégrité        | Implémenté et vérifié                          | Aucune porte interne                    | Répétition fournisseur avant migration   |
| 5 — finition produit | Implémenté et vérifié                          | Recette finale                          | Product et accessibilité                 |
| 6 — exploitation     | Implémenté, preuve Production ouverte          | Secrets, crons, alertes, restore        | Vercel, Neon, Resend, GitHub             |
| 7 — IA               | Implémenté, validation humaine ouverte         | Juridique et sécurité clinique          | DPO/juridique et professionnel compétent |
| 8 — Stripe           | Implémenté, preuve Production ouverte          | KYC, catalogue, Tax, Test Clocks, achat | Stripe et responsable comptable          |
| 9 — conformité       | Documents préparés, validation humaine ouverte | 21 approbations versionnées             | Responsables désignés                    |
| 10 — qualité         | Automatisation implémentée et verte localement | CI distante, audit manuel, p75 réel     | GitHub, testeurs et trafic Production    |
| Déploiement final    | Non commencé volontairement                    | Toutes les portes précédentes           | Go/no-go collectif                       |

## Phase 0 — stabilisation et garde-fous

**Statut : implémenté et vérifié.**

- Les flags de maintenance, facturation, IA, aidants, push, import et
  administration échouent fermés et les fonctionnalités sensibles restent
  désactivées.
- `/app` redirige vers `/dashboard`, l'administration générique a été retirée
  et l'espace opérationnel restant est protégé.
- `pnpm verify` couvre lint, TypeScript, Vitest, audit complet des dépendances
  avec validation du patch de sécurité local, Prisma, frontière du paquet
  Vercel, build Next.js et Knip.
- La baseline actuelle est de 905 tests Vitest dans 139 fichiers. La couverture
  release atteint 82,65 % des lignes, 83,12 % des branches et 80,84 % des
  fonctions.
- Les seuils critiques à 90 % de branches sont désormais explicitement imposés
  aux permissions, exports produit et réglementaire, suppressions locales et
  externes, configuration et routes Auth, adhérence, webhooks, actions hors
  ligne, diagnostic hors ligne et stockage IndexedDB. Les résultats observés
  vont de 90,21 % à 100 %.
- Une porte automatique refuse toute réintroduction de scénario `skip` ou
  `fixme` dans Vitest ou Playwright.

Preuves :
[preuves techniques](./release-evidence-2026-08-13.md),
[portes de release](./production-release-gates.md).

## Phase 1 — dépendances, identité et sécurité du compte

**Statut : implémenté et vérifié ; deux recettes externes restent ouvertes.**

- Next.js 16.3.0 et Better Auth 1.6.27 sont verrouillés ; le schéma Better Auth
  est issu de la version retenue.
- Vérification e-mail, réponses non énumérables, révocation des sessions non
  vérifiées, consentements versionnés, gate des comptes historiques,
  réauthentification de dix minutes, sessions/appareils, TOTP, codes de
  récupération et passkeys sont couverts.
- La CSP de Production supprime `unsafe-eval` et les scripts inline non
  autorisés ; les origines Better Auth et WebAuthn Preview restent exactes.
- Les logs sensibles ont été remplacés par des événements structurés sans
  contenu.

Restent à prouver :

1. premier retour OAuth avec chaque fournisseur réel et chaque état de preuve
   d'e-mail ;
2. passkey sur Safari/iOS, Android et au moins une clé physique ciblée.

Ces tests ne nécessitent pas de changement fonctionnel connu ; ils nécessitent
les comptes et appareils réels.

## Phase 2 — cloisonnement hors ligne et appareils partagés

**Statut : implémenté et vérifié.**

- IndexedDB v2 lie chaque opération à son propriétaire et chiffre son payload
  avec une clé WebCrypto non extractible.
- Le changement Alice → Bob ne charge ni ne synchronise la file d'Alice ; la
  déconnexion volontaire exige de rester connecté ou de purger.
- La suppression de compte purge file, clé, caches et souscription push.
- Le service worker ne cache pas les réponses authentifiées ; les conflits
  exigent une décision explicite et les retries sont bornés.
- Les opérations locales sont purgées au plus tard après 30 jours.
- Les notifications détaillées exigent simultanément un appareil fiable et un
  consentement de contenu détaillé.

Reste à recetter sur appareils réels : expiration d'un endpoint, révocation de
la souscription au logout et réception générique/détaillée. Cette preuve est
regroupée avec la mise en service Push de la phase 6.

## Phase 3 — cercle aidant et exports

**Statut : implémenté et vérifié ; preuve DSAR Production ouverte.**

- Une politique serveur unique déduit patient, aidant, relation, expiration,
  permissions, fenêtres et droits de plan ; aucun `mode` client ne décide de
  l'autorisation.
- Révocation transactionnelle, concurrence Free/Plus, permissions réelles,
  fenêtres 7/30/90 jours, expiration, audit de lecture et digest sans contenu
  médical sont couverts.
- L'export produit du patient exclut toute observation cachée ; l'aidant perd
  l'accès immédiatement après révocation.
- Le DSAR est séparé de l'admin, soumis à revue humaine, chiffré AES-256-GCM,
  livré par token à usage unique et programmé pour purge.

Restent à prouver : cycle complet sur Vercel Blob Production, expiration/purge
réelle et validation DPO du processus. La route publique ne doit pas être
activée avant ces preuves.

## Phase 4 — exactitude et intégrité des données

**Statut : implémenté et vérifié.**

- Un service temporel IANA commun gère les journées civiles, Paris, UTC, les
  fuseaux extrêmes et les deux transitions DST Europe/Paris.
- L'adhérence utilise la période active et les révisions historiques de
  planning ; elle exclut futur et PRN, respecte les jours hebdomadaires et
  retourne `null` sans dose attendue.
- Création/modification de traitement, révisions, stock, prises, corrections et
  annulations sont transactionnels et auditables.
- Les mutations multi-tables utilisent transactions et identifiants
  d'idempotence ; rollback et accès concurrents ont été prouvés sur PostgreSQL
  17 jetable.
- Les bornes de tailles, pagination et fenêtres interactives sont appliquées.

La répétition fournisseur 12 → 24 reste obligatoire avant la maintenance, mais
aucun écart fonctionnel interne n'est actuellement identifié.

## Phase 5 — fonctionnalités de finition

**Statut : implémenté et vérifié.**

- Mode consultation avec brouillon, période, métriques expliquées, événements,
  questions et PDF accessible, sans recommandation médicale ni envoi direct.
- Journal avec tags personnalisés, catégories, recherche serveur, filtres,
  calendrier et pagination bornée.
- Import JSON/CSV avec validation, prévisualisation, doublons, transaction et
  rapport d'erreurs sans fusion silencieuse.
- Plan de sécurité facultatif, chiffré localement pour l'usage hors ligne, avec
  3114, 15 et 112 et sans partage automatique.
- Appareils de confiance, alertes de connexion, aide, statut et procédures
  export/suppression sont présents ; les écrans et métriques de template ont
  été retirés.
- Les contenus publics résiduels du template ont été retirés : huit changelogs,
  deux articles de démonstration et trois routes génériques. Les articles
  d'accueil FR/EN sont factuels, les guides, la tarification, l'essai, l'IA et
  le cercle aidant suivent leurs flags côté serveur, et les pages Aide/Statut
  sont bilingues. Les tests de non-régression couvrent ce périmètre.
- Deux anciens catalogues de landing et le bloc Careers orphelin ont été retirés
  des traductions envoyées au client. L'onboarding masque indépendamment Push et
  Aidant selon leurs flags serveur. Les upsells PDF/Plus authentifiés deviennent
  non cliquables lorsque Billing est fermé, et l'adhérence n'est plus libellée
  comme une corrélation avec l'humeur.

Preuve principale : matrice produit verte sur Chromium, Firefox, WebKit et les
deux profils mobiles, consignée dans les
[preuves techniques](./release-evidence-2026-08-13.md).

## Phase 6 — notifications, webhooks et exploitation

**Statut : implémenté ; preuves Production et assainissement des secrets
ouverts. Activation interdite.**

- Resend vérifie le corps brut Svix, refuse les signatures absentes/invalides,
  déduplique et ne journalise aucun payload.
- Le moteur de jobs PostgreSQL assure verrou, lease, idempotence, retries,
  dead-letter et heartbeats ; le watchdog alerte et limite les répétitions.
- Les crons Vercel et la réconciliation Stripe quotidienne sont définis ;
  `/api/health` reste minimal et les logs sont structurés sans contenu sensible.
- Le mode maintenance coupe désormais les crons et les webhooks Resend/Stripe
  avant toute lecture fournisseur ou écriture en base, avec une réponse 503
  générique, `Retry-After: 300` et `Cache-Control: no-store` ; les secrets
  invalides restent refusés sans divulguer l'état de maintenance.
- Les rétentions techniques proposées sont implémentées dans un job idempotent.
- Le déroulé opérateur, les contrôles d'arrêt et le rollback sont consolidés
  dans le [runbook de mise en production](./production-release-runbook.md).

Les actions externes obligatoires, dans cet ordre, sont :

1. tourner ou révoquer les douze ressources recensées après l'incident de
   preview, contrôler leur activité et compléter le registre de preuve ;
2. isoler tous les secrets Preview/Production et reprovisionner les couples
   d'URL Neon poolée/non poolée ;
3. faire passer `pnpm verify:vercel-predeploy` sans exception ;
4. publier une nouvelle Preview, prouver `/api/health`, les webhooks et les
   smoke tests, sans fichier `.env` ;
5. passer Neon sur une offre Production, protéger la branche, imposer le MFA,
   obtenir 30 jours de rétention et chronométrer un restore fournisseur ;
6. publier les workflows GitHub, activer ruleset, contrôles obligatoires,
   CodeQL, Secret Protection et Dependabot sur une offre compatible ;
7. déployer les nouveaux crons Production, déclencher volontairement watchdog,
   dead-letter, récupération et alerte de suppression ;
8. seulement après preuve du scheduler Vercel, retirer l'ancien scheduler
   GitHub afin d'éviter simultanément interruption et double envoi.

Preuves : [incident Preview](./incidents/2026-08-14-vercel-preview-env-upload.md),
[audit Neon](./neon-production-audit-2026-08-14.md),
[audit GitHub](./github-production-audit-2026-08-18.md).

## Phase 7 — IA au lancement

**Statut : implémenté et évalué de façon déterministe ; évaluation fournisseur
et validation humaine ouvertes. Activation publique interdite.**

- Plus, quota mensuel, créneau quotidien, consentements séparés, notes opt-in,
  langue, `store: false`, timeout, fallback, kill switch, concurrence et
  interruption de crise sont implémentés.
- Les entrées sont minimisées ; prompt, note et sortie ne sont pas persistés
  dans les logs techniques.
- Le corpus synthétique bilingue de 100 cas est vert sur le routage
  déterministe, la structure, les références et l'interdiction de recommandation
  médicale. Le runner fournisseur est fail-closed et n'émet que des compteurs.
- `AI_ROLLOUT_MODE=internal` constitue une seconde porte indépendante du kill
  switch.

Restent obligatoires : création/rotation attestée de la clé dédiée, évaluation
des 100 cas avec OpenAI sur le candidat courant, revue juridique du traitement,
validation du consentement et revue clinique compétente des scénarios. Ces
décisions doivent être enregistrées dans le registre d'approbations pour le
même commit candidat.

## Phase 8 — Stripe au lancement

**Statut : implémenté et fail-closed ; preuve live ouverte. Activation
interdite.**

- Le serveur impose produit, prix, essai et droits ; le catalogue, le portail,
  le compte, le KYC, les taxes et l'environnement sont validés avant activation.
- Webhooks et réconciliation sont idempotents et détectent prix inconnu,
  événement hors ordre et divergence sans correction ambiguë.
- Le runner Test Clocks couvre les transitions prévues et refuse une clé live.

Le compte test observé refuse actuellement les paiements et les métadonnées de
catalogue restent incomplètes. Il faut encore : valider le compte live et le
KYC, créer/vérifier les deux prix TTC, faire approuver TVA/rétractation,
exécuter tous les Test Clocks, tester le portail et effectuer un achat live
contrôlé suivi de son remboursement. `BILLING_ENABLED` doit rester à `false`
jusqu'à la dernière preuve.

## Phase 9 — conformité, contenu et promesses publiques

**Statut : implémentation et documents préparés ; validation humaine ouverte.**

- France et 18+ sont alignés ; les consentements légaux et santé sont versionnés
  et aucune date de naissance complète n'est collectée.
- Registre de traitements, AIPD de travail, analyse HDS, sous-traitants/régions,
  rétention, incident et approbations sont documentés.
- Les affirmations publiques non démontrées ont été retirées ; PostHog n'est pas
  chargé et aucune bannière inutile n'est introduite.
- Les 21 décisions nécessaires disposent d'un registre machine-readable qui
  exige date, preuve opaque, approbateur non personnel et même commit candidat.

Le registre reste volontairement entièrement `pending`. Les documents doivent
être approuvés par les autorités compétentes ; les références de signature sont
conservées hors dépôt puis reliées sans contenu personnel dans le registre.

Preuves : [approbations](../compliance/release-approvals.md),
[format de preuve](./release-approval-evidence.md).

## Phase 10 — CI, qualité, accessibilité et performance

**Statut : automatisation implémentée et verte localement ; contrôles distants
et manuels ouverts.**

- Installation figée, audit, dependency review, CodeQL, secret scanning, SBOM,
  licences, Prisma, migrations, couverture, E2E, axe et Lighthouse sont définis.
- Les preuves PostgreSQL de concurrence/retry des jobs et d'intégrité
  transactionnelle des traitements et suppressions sont désormais exécutées
  dans un job de release dédié sur PostgreSQL 17 jetable.
- Toutes les Actions distantes sont épinglées à un SHA immuable et PostgreSQL 17
  est utilisé dans les jobs jetables.
- Playwright collecte Chromium, Firefox, WebKit et deux profils mobiles ; le
  scénario CDP passkey est explicitement cantonné à Chromium sans skip.
- La matrice intégrale rejouée avec les retries désactivés est verte à 156/156
  sur ces cinq profils, en 4 min 54 s, avec une base PostgreSQL 17 jetable.
- La configuration interdit désormais tout retry local ou distant, et la CI de
  pull request applique la porte de couverture release plutôt qu'une simple
  collecte de rapport.
- Axe est vert sans violation sérieuse ou critique ; Lighthouse atteint les
  budgets locaux sur trois runs pour la landing, la connexion et le dashboard
  authentifié, avec des médianes performance respectives de 87, 86 et 86.
- Une répétition 12 → 24 migrations et un dump/restore logique complet sont
  verts sous PostgreSQL 17.11 local.

Restent à obtenir : CI distante verte sous les protections finales, audit
manuel WCAG 2.2 AA (clavier, VoiceOver, Android, zoom, contraste, mouvement),
recette push sur appareils, tests de dégradation fournisseur, restore Neon
chronométré, rollback Vercel répété et Core Web Vitals p75 après ouverture.

## Déploiement final et définition de terminé

**Statut : non commencé volontairement.**

La procédure exécutable, les invariants, les critères d'arrêt et le rollback
sont consolidés dans le
[runbook de mise en production](./production-release-runbook.md).

Aucune nouvelle Preview ni migration Production ne doit être lancée avant la
rotation des secrets. L'ordre de sortie obligatoire est le suivant :

1. fermer l'incident de secrets et isoler les environnements ;
2. rendre Vercel, Neon et GitHub conformes et obtenir une Preview entièrement
   verte ;
3. terminer les preuves OAuth, passkey, push, Resend, Blob et restore ;
4. obtenir les validations IA, juridiques, cliniques, comptables et
   accessibilité ;
5. valider Stripe test puis live ;
6. figer le commit candidat et compléter les 21 approbations sur ce commit ;
7. répéter maintenance, migration, smoke tests et rollback ;
8. ouvrir successivement comptes internes, Stripe, IA interne puis public Plus
   opt-in, avec surveillance continue pendant 24 heures.

Le go/no-go doit rester **no-go** tant que l'une des commandes suivantes échoue
ou qu'une preuve externe manque :

```bash
pnpm verify
pnpm test:coverage:release
pnpm verify:credential-rotations
pnpm verify:release-approvals
pnpm verify:vercel-predeploy
```

À la date de cet audit, les trois dernières portes sont rouges par conception.
Cette situation protège la Production : elle ne constitue pas une autorisation
de les neutraliser.
