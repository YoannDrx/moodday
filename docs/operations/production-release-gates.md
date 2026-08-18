# Moodday — portes de mise en production

Dernière mise à jour : 18 août 2026

Ce document est la checklist exécutable de la release France 18+. Une case ne
peut être cochée qu'avec une preuve datée et reproductible. Les flags Billing,
IA, cercle aidant, push, import et administration restent fermés tant que leur
gate n'est pas validé.

## Phase 0 — baseline et garde-fous

- [x] Flags sensibles explicites et désactivés par défaut.
- [x] Mode maintenance disponible ; mutations safe-action et POST Better Auth
      bloqués, avec seule exception explicite pour la déconnexion.
- [x] Crons et webhooks Resend/Stripe authentifiés renvoient également 503 avec
      retry pendant la maintenance, avant toute écriture ou appel fournisseur.
- [x] Ancienne surface `/app` redirigée vers `/dashboard`.
- [x] Administration désactivée par défaut.
- [x] Analyse Knip importable sans base E2E.
- [x] Commande `pnpm verify` définie.
- [x] `pnpm verify` entièrement vert après mise à niveau des dépendances.
- [x] `.vercelignore`, test de non-régression et porte
      `pnpm verify:vercel-predeploy` empêchent l'envoi de fichiers `.env` et
      refusent une configuration fournisseur incomplète ou partagée.

## Phase 1 — identité et dépendances

- [x] Next.js `16.3.0` et Better Auth `1.6.27` verrouillés.
- [x] Aucun avis runtime critique ou élevé non traité.
- [x] Vérification e-mail obligatoire, lien anti-rejeu et script de révocation
      des sessions historiques non vérifiées prouvés sur PostgreSQL jetable.
- [x] Consentements 18+, CGU et confidentialité versionnés à l'inscription.
- [x] Gate de réacceptation des comptes historiques prouvée sur cinq profils Playwright.
- [ ] Premier retour OAuth et exigences de preuve d'e-mail prouvés avec les fournisseurs réels.
- [x] Appareils, révocation de sessions et réauthentification sensible
      implémentés ; fenêtre de dix minutes prouvée sur cinq profils Playwright.
- [x] TOTP et codes de récupération à usage unique prouvés sur cinq profils ;
      passkey prouvée avec authentificateur WebAuthn virtuel Chromium.
- [ ] Passkeys validées manuellement sur Safari/iOS, Android et clés physiques ciblées.
- [x] CSP sans `unsafe-inline` pour les scripts et sans `unsafe-eval` en
      production, couverte par tests structurels et parcours auth de build production.
- [x] Better Auth n'accepte que les origines Preview Vercel exactes ; aucun
      wildcard `*.vercel.app`, et WebAuthn reste lié à l'origine effective.

## Phase 2 — hors ligne et push

- [x] File IndexedDB v2 chiffrée et liée au propriétaire.
- [x] Déconnexion bloquée ou purge explicite si des opérations restent en attente.
- [x] Aucun cache d'API ou de page authentifiée dans le service worker.
- [x] Souscription push supprimée lors de la déconnexion et de la suppression.
- [x] E2E Alice vers Bob vert.
- [x] Rétention locale maximale de 30 jours, y compris purge des métadonnées
      corrompues sans horodatage fiable.

## Phase 3 — cercle aidant et exports

- [x] Révocation totale sur la requête suivante, prouvée sur cinq profils.
- [x] Permissions de lecture réellement imposées côté serveur et couvertes à plus de 90 % de branches.
- [x] Observations cachées absentes de l'export produit patient, prouvé sur un téléchargement réel.
- [ ] Procédure DSAR séparée : génération chiffrée, audit sans contenu, lien
      Blob privé à usage unique, expiration et purge différée implémentés et
      testés ; validation DPO et cycle Blob réel en Production encore à prouver.
- [x] Limites Free/Plus atomiques par transaction sérialisable ; invitations concurrentes prouvées sur cinq profils.
- [x] Permissions, fenêtres 7/30/90 jours et expiration sont configurables et
      affichées ; digest d'accès quotidien/hebdomadaire sans contenu médical
      implémenté, idempotent et surveillé.

## Phases 4 et 5 — intégrité et produit

- [x] Service de dates IANA unique et tests DST verts.
- [x] Adhérence fondée sur l'historique effectif des plannings, avec périodes actives, PRN, hebdomadaire et DST.
- [x] Mutations multi-tables transactionnelles et idempotentes ; rollback,
      stock concurrent, retry concurrent et suppression de compte prouvés sur
      PostgreSQL jetable.
- [x] Mode consultation, recherche, tags, import et plan de sécurité terminés
      et prouvés sur les cinq profils Playwright.
- [x] Les surfaces publiques publiées ont été nettoyées des composants de
      template et les affirmations restantes sont factuelles ou assorties de leurs
      limites.
- [x] Catalogues de traduction client nettoyés des offres/témoignages/apps
      fictifs ; onboarding Push/Aidant et upsells Plus soumis indépendamment aux
      flags serveur, avec tests fail-closed.

## Phases 6 à 8 — exploitation, IA et Stripe

- [x] Webhook Resend signé, idempotent et anti-rejeu en tests automatisés.
- [x] Vercel Cron, verrou DB, retries et watchdog implémentés ; concurrence et
      reprise d'une fenêtre antérieure prouvées sur PostgreSQL réel jetable.
- [x] Compte Vercel lié confirmé sur un plan Pro.
- [x] Vercel Authentication limitée à `deploymentType=preview` ; contrôle réel
      d'un Preview passé de `200` à la redirection d'authentification, tandis que
      la Production canonique reste publique en `200`.
- [x] Valeurs non secrètes et kill switches publiés en Preview et Production ;
      Billing, IA, aidants, push, import et administration restent désactivés.
- [ ] Nouveau watchdog, crons fréquents et variables obligatoires publiés puis
      vérifiés sur le déploiement Production.
- [ ] Secrets inclus dans la preview supprimée du 14 août tournés, anciennes
      valeurs révoquées, journaux fournisseurs contrôlés et preuves datées.
- [x] Registre de rotation structuré, sans secret et fail-closed ; fournisseurs
      manquants/dupliqués, actions incohérentes et dates futures rejetés.
- [x] Registre d'approbations structuré et fail-closed : 21 décisions liées au
      même commit, avec dates, expiration et références opaques vérifiées.
- [x] La gate d'approbation lie aussi ces décisions au candidat explicitement
      fourni, exige un worktree propre et refuse tout changement autre que les
      deux registres de preuves après ce commit.
- [ ] `pnpm verify:vercel-predeploy` vert pour Preview et Production, sans
      doublon ni secret sensible partagé entre les deux environnements.
- [x] Logs structurés sans contenu sensible dans les parcours couverts ; les
      e-mails opérationnels sont rétrospectivement expurgés et les webhooks portent
      request ID, route, statut, durée et code d'erreur.
- [x] Rétention technique implémentée comme job quotidien idempotent et surveillé.
- [x] Corpus IA technique bilingue validé : 100 cas synthétiques, 100 % de
      routage déterministe, structure et références valides, sans recommandation
      médicale ; runner fournisseur fail-closed et sans contenu dans ses logs.
- [ ] Clé OpenAI dédiée créée/rotée avec preuve fournisseur, puis évaluation
      live des 100 cas exécutée sur le commit candidat avec seuils atteints.
- [x] Quotas IA et concurrence sérialisés dans PostgreSQL ; un signal de crise
      ne consomme ni génération mensuelle ni créneau journalier.
- [x] Rollout IA fermé par défaut aux identifiants internes, indépendamment du
      kill switch ; passage public impossible sans `AI_ROLLOUT_MODE=public`.
- [ ] Revue humaine clinique et validations juridique/OpenAI documentées.
- [ ] Stripe live, KYC, catalogue, Test Clocks et réconciliation validés.
- [x] Validation Stripe échoue fermée sur compte, catalogue, portail, code
      fiscal et environnement ; Test Clocks automatisés sans clé live.
- [x] Réconciliation Stripe bidirectionnelle : état divergent, abonnement
      distant manquant localement et prix Moodday ambigu produisent une alerte sans
      correction automatique.

## Phases 9 et 10 — conformité et qualité

- [x] France et 18+ alignés dans le produit et les textes automatisés.
- [x] Consentement explicite aux données de santé séparé des CGU et de la
      politique de confidentialité, sans backfill des comptes historiques ;
      retrait et conséquence décrits publiquement.
- [x] Registre des traitements, évaluation HDS, réponse aux incidents et
      registre nominatif des approbations externes établis.
- [ ] AIPD, DPA, HDS, TVA, rétention et sous-traitants approuvés.
- [x] Workflows CI, audit, SBOM, licences, migrations et E2E
      multi-navigateurs configurés et exécutables ; CodeQL repose sur le
      `default setup` GitHub étendu afin d'éviter deux analyses concurrentes.
- [x] Le workflow de release exécute sur PostgreSQL 17 jetable les preuves de
      verrou/retry des jobs et d'intégrité transactionnelle des traitements et
      suppressions de compte.
- [x] Aucun `test.skip` ou scénario ignoré dans les suites unitaires et E2E ;
      une porte automatisée empêche leur réintroduction et WebAuthn CDP est
      collecté exclusivement par le projet Chromium.
- [x] Aucun retry Playwright n'est autorisé localement ou en CI ; une réussite
      E2E ne peut pas masquer un premier échec transitoire. Le workflow de PR
      applique les mêmes seuils de couverture que la porte de release.
- [x] Toutes les Actions distantes des workflows sont épinglées à un SHA
      immuable, GitHub exige désormais cet épinglage au niveau du dépôt et un
      test interdit le retour à un tag mutable.
- [x] Actions restreintes au niveau GitHub aux fournisseurs nécessaires :
      Actions GitHub officielles, `pnpm/action-setup` et
      `gitleaks/gitleaks-action`.
- [x] Secret scanning, push protection, alertes de vulnérabilités, Dependabot et
      CodeQL étendu activés ; premier scan CodeQL exécuté avec succès.
- [x] Protection intermédiaire de `main` : PR obligatoire, administrateurs
      inclus, historique linéaire, conversations résolues, force-push et
      suppression interdits.
- [x] Gitleaks 8.30.1 vert sur 72 commits et sur tous les fichiers versionnables
      du worktree ; exceptions limitées à 15 fingerprints historiques exacts.
- [x] Audit complet des dépendances vert : tous les avis élevés corrigibles de
      l'outillage sont verrouillés ; la seule CVE sans version amont corrigée
      possède un patch pnpm et un test d'exploitation fail-closed. Licences
      Production et SBOM CycloneDX 1.6 (737 composants) vérifiés.
- [ ] Dépôt ramené dans une organisation privée avec Code Security et Secret
      Protection, nouveaux workflows publiés, checks stricts obligatoires,
      et aucune alerte runtime critique ou haute.
- [x] Axe automatisé sans violation sérieuse ou critique sur 27 pages publiques
      ou authentifiées et cinq profils navigateur/appareil.
- [x] CI jetable, répétition 12 → 24 migrations, dump logique et restauration
      isolée alignés sur PostgreSQL 17 ; comparaison des 41 tables et absence
      de dérive Prisma prouvées localement.
- [x] Audit Neon en lecture seule : projets Production/Preview séparés et région
      `aws-eu-central-1` confirmés, baseline actuelle de 12 migrations sans
      migration incomplète.
- [ ] Cible fournisseur Preview alignée sur PostgreSQL 17, répétition 12 → 24
      migrations sur cette cible, branche Production protégée et
      rétention/restauration 30 jours prouvées.
- [ ] Organisation Neon sur une offre compatible Production et MFA imposé à
      tous ses administrateurs.
- [x] Seuil global de couverture de release atteint : 82,65 % des lignes et
      83,12 % des branches ; seuils critiques à 90 % de branches verts pour
      permissions, exports, suppression, Auth, adhérence, webhooks, hors ligne,
      audits de rotation et environnement Vercel.
- [x] Budgets Lighthouse CI locaux validés sur trois runs par URL : médiane
      performance 87 landing, 86 connexion et 86 dashboard ; accessibilité 100,
      bonnes pratiques au moins 96 et SEO 100.
- [ ] Audit manuel WCAG 2.2 AA, tests sur appareils et Core Web Vitals p75 en
      trafic réel validés.
- [ ] Restauration RPO 24 h / RTO 4 h et rollback répétés.

Audit GitHub courant :
[`github-production-audit-2026-08-18.md`](./github-production-audit-2026-08-18.md).

Preuves datées : [14 août 2026](./release-evidence-2026-08-13.md).

Audit de complétude phase par phase :
[14 août 2026](./completion-audit-2026-08-14.md).

## Gate final

- [ ] Aucun P0/P1 sécurité ou confidentialité.
- [ ] Toutes les preuves externes sont datées et reliées au compte Production.
- [ ] Achat live contrôlé remboursé, IA kill switch testé et alertes reçues.
- [ ] Validation explicite Product, Engineering, juridique et comptable.
