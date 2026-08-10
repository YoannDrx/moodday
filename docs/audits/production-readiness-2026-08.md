# Moodday — audit de préparation production

Dernière revue : 2026-08-10

Propriétaire : Product & Engineering

Révision suivante : avant chaque lancement et au minimum mensuellement

## Règle de preuve

Le statut `Prod prouvé` exige simultanément : parcours UI/API/persistance et
autorisations complets, tests unitaires/intégration/E2E, smoke test de
production, dépendances externes vérifiées, monitoring et runbook, textes
publics cohérents avec le comportement réel.

Les statuts autorisés sont : `Prod prouvé`, `Candidat prod`, `Partiel`,
`UI/claim only` et `Bloqué`. `PROJECT_STATUS.md` reste une source historique,
pas une preuve de release.

## Matrice initiale

| Domaine                    | Surface et données                             | Entitlement                     | Preuves actuelles                                                                       | Dépendances / risques                                            | Statut        | Condition de sortie                                                         |
| -------------------------- | ---------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------- |
| Authentification et compte | Better Auth, profil, mot de passe, suppression | Free                            | E2E inscription, mot de passe, suppression et URL canonique verts                       | Smoke prod et alertes auth à compléter                           | Candidat prod | Smoke prod, contrôle cookies/headers, alertes auth                          |
| Humeur et journal          | `/mood`, `MoodEntry`, queue offline            | Free                            | E2E online/offline et idempotence verts                                                 | Conflits multi-appareils et smoke prod                           | Candidat prod | E2E conflits multi-appareils et smoke prod                                  |
| Sommeil, énergie, anxiété  | Champs `MoodEntry`, dashboard et bilans        | Free                            | Lecture/agrégation implémentées                                                         | Cas incomplets et accessibilité                                  | Candidat prod | Cas limites, résumés textuels et E2E                                        |
| Traitements et prises      | `Medication`, `MedIntake`, historique          | Free                            | CRUD, planification et idempotence                                                      | Fiabilité du scheduler                                           | Candidat prod | Livraison push contrôlée sur deux navigateurs                               |
| Thérapie et exercices      | `TherapySession`, `Exercise`, logs             | Free                            | Parcours implémentés                                                                    | Couverture E2E limitée                                           | Candidat prod | E2E création/modification/suppression                                       |
| Bilans                     | `/trends`, agrégats et corrélations            | Free 30 j / Plus illimité       | Visualisations existantes                                                               | Entitlements et vocabulaire                                      | Partiel       | Enforcement serveur, accessibilité et Mode Consultation                     |
| Exports                    | PDF, CSV, JSON                                 | Portabilité Free / rapport Plus | E2E JSON/CSV Free, PDF Plus et CSP WASM verts                                           | Smoke prod, revue du contenu clinique et conservation locale     | Candidat prod | Smoke prod et validation humaine du rapport                                 |
| Cercle aidant              | Relations, permissions, journal d'accès        | 1 Free / 3 Plus                 | E2E permissions/révocation et enforcement serveur du downgrade                          | Journal visible et E2E downgrade complet                         | Candidat prod | Journal visible et E2E downgrade concurrent                                 |
| PWA/offline                | Service worker, IndexedDB, queues              | Free                            | Scénario offline présent                                                                | Résolution explicite des conflits                                | Partiel       | E2E multi-opération et reprise après erreur                                 |
| Notifications              | Push, cron, `NotificationDelivery`             | Essentiel Free                  | Idempotence E2E, retries bornés, migrations live et livraison indépendante par endpoint | Redis dédié, preuve VAPID multi-appareils et alerte cron         | Partiel       | Redis isolé, smoke VAPID sur deux navigateurs et alertes                    |
| Stripe                     | Checkout, portail, webhook, `Subscription`     | Plus                            | Sandbox dédié, catalogue/portail, webhook signé et rejeu idempotent prouvés             | Test Clocks, compte live non vérifié et réconciliation monitorée | Bloqué        | Scénarios Test Clocks, miroir live, KYC et alerte de réconciliation validés |
| IA                         | Journal et bilans                              | Réflexion Free / 8 Plus         | Service unique, consentement, schéma strict, 61 cas d'évaluation et quota glissant 24 h | AIPD/DPA/transferts, clé par environnement et validation humaine | Bloqué        | Gates juridiques, projets séparés, corpus critique et bêta fermée           |
| Sécurité/conformité        | Headers, régions, docs, logs                   | Tous                            | TLS, HSTS, CSP, suppression/export et fonctions Preview en `fra1`                       | `unsafe-inline`, sous-traitants partagés, AIPD/DPA/HDS           | Bloqué        | P0 clos, AIPD/DPA, revue juridique et runbooks éprouvés                     |
| Marketing/SEO              | Landing, sitemap, metadata                     | Public                          | Landing originale, registre de claims, robots, sitemap Moodday et assets OG             | Perf p75, preuves externes et smoke public                       | Candidat prod | Aucun claim expiré, mesures CWV et smoke public validés                     |

## Gates de lancement

- [ ] Aucun P0 ouvert et aucun claim expiré rendu publiquement.
- [ ] Migrations appliquées sur un clone puis sur production avec restauration testée.
- [ ] Bases, Redis, Stripe, OpenAI, Resend, Blob et VAPID séparés par environnement.
- [ ] Fonctions sensibles exécutées en `fra1`; régions des autres sous-traitants consignées.
- [ ] Catalogue Stripe test/live identique à l'allowlist applicative.
- [ ] Essai sans carte, paiement échoué, annulation et downgrade testés.
- [ ] Les droits Free/Plus sont vérifiés côté serveur.
- [ ] Aucun contenu de santé dans logs, traces, analytics ou erreurs.
- [ ] Parcours crise, export, suppression et révocation aidant testés en production.
- [ ] CI complète verte, smoke prod et tableau de bord opérationnel disponibles.
- [ ] Revue juridique/comptable écrite pour données de santé, HDS, TVA et textes.
- [ ] IA limitée à la bêta jusqu'à réussite du corpus critique.

## Preuves de la revue initiale

- `pnpm test:ci` : 219 tests réussis sur 32 fichiers, sans avertissement React
  lié à l'auto-save.
- `pnpm ts`, `pnpm lint:ci` et `pnpm build` : réussis.
- La couverture E2E ne comprend pas encore la facturation, les parcours métier
  complets ni les bilans IA.
- Le sitemap public pointait vers un autre domaine et `robots.txt` était absent.
- Le déploiement contrôlé exécutait les fonctions en `iad1`, malgré les textes
  publics affirmant un hébergement exclusivement européen.
- Les limitations de plans étaient affichées mais pas imposées par les actions
  serveur.
- Les Price IDs Moodday historiques n'avaient aucune souscription Stripe ; les
  produits restent à archiver après création et validation du compte dédié.
- Le sandbox Stripe Moodday `acct_1U1vVs9bvjItdKqK` contient le produit
  `Moodday Plus`, ses prix TTC mensuel et annuel, le branding Moodday et une
  configuration de portail dédiée. L'essai reste actif lors d'un changement
  mensuel/annuel, l'annulation intervient en fin de période et Stripe Tax reste
  désactivé jusqu'à validation comptable.
- Le compte live Stripe n'est pas encore vérifié (`charges_enabled=false`,
  `details_submitted=false`) : raison sociale, adresse, représentant, compte
  bancaire et e-mails Billing natifs restent des gates de production et ne
  doivent pas être inventés dans le sandbox.
- La baseline Prisma a été répétée sur une branche Neon isolée : sept migrations
  historiques résolues, trois migrations déployées, statut à jour et diff de
  schéma vide. Le runbook est versionné dans `docs/operations/prisma-baseline.md`.
- Le secret Neon exposé pendant cette répétition a été rotaté et la branche
  temporaire supprimée ; le compte rendu expurgé est versionné dans
  `docs/operations/incidents/2026-08-07-neon-credential-exposure.md`.

## Revue de fermeture du 10 août 2026

### Preuves obtenues

- `pnpm test:ci` : 229 tests réussis sur 33 fichiers.
- `pnpm ts`, `pnpm lint:ci`, `pnpm build` et `git diff --check` : réussis.
- Playwright sur la branche Neon Preview isolée
  `br-ancient-darkness-b11qc98j` : 12 scénarios exécutés réussis, un scénario
  admin explicitement ignoré faute de fixture. Les parcours couvrent notamment
  inscription, mot de passe, suppression, export JSON/CSV/PDF, révocation
  aidant, notification idempotente et synchronisation offline.
- Le blocage PDF a été reproduit sous la CSP de production puis corrigé : le
  WASM Yoga embarqué nécessite `connect-src data:` et
  `script-src 'wasm-unsafe-eval'`. Le scénario PDF Plus passe ensuite en 6,3 s.
- L'URL canonique serveur utilise désormais `BETTER_AUTH_URL` avant les URL
  Vercel éphémères. Les opérations sensibles Preview ne divergent plus de
  l'origine de confiance Better Auth.
- Le déploiement Preview propre `dpl_DdHmVCaY6Y4LrfC3SoyXU3sHH33a` est `READY` et
  l'alias stable Stripe pointe vers cette version. Le smoke HTTP retourne 200,
  expose HSTS/CSP, sert le `robots.txt` Moodday et confirme l'exécution en
  `fra1`. Un POST Stripe non signé est rejeté en HTTP 400. Le garde de base E2E
  temporaire a été retiré de l'environnement Preview avant ce déploiement. Les
  flags production restent fermés : billing, Stripe Tax et IA sont désactivés.
- Le webhook Stripe Preview accepte uniquement les signatures valides. Un
  événement `checkout.session.expired` a été traité puis rejoué sans seconde
  écriture : une ligne, une tentative.
- Le checkout vérifie maintenant le compte Stripe, les Price IDs, montants,
  devise, intervalle, taxation, lookup keys et métadonnées du produit. Il
  réutilise une session ouverte, bloque un abonnement déjà actif et résiste aux
  créations concurrentes via une clé d'idempotence de cinq minutes.
- Le quota IA Plus est désormais glissant sur 24 heures, en plus de la limite
  de huit générations par période mensuelle.
- Un clone de la production Neon, `br-autumn-bird-agfi2xlt`, a reçu avec succès
  les deux migrations en attente. Les 12 migrations sont à jour et
  `prisma migrate diff` ne détecte aucune dérive après application.
- Une branche de sauvegarde Neon, `br-frosty-waterfall-agiq02sf`, a été créée
  avant la promotion. La production a ensuite reçu
  `20250824040000_moodday_domain_baseline` et
  `20260810120000_subscription_updated_at_no_default` en 4,4 secondes. Les 12
  migrations sont à jour, le diff Prisma est vide et les contrôles de volume
  avant/après sont identiques (26 tables publiques, 2 785 280 octets). La
  branche de sauvegarde est conservée jusqu'au smoke de production.
- Le dépassement de la limite aidant après downgrade est maintenant déterminé
  par ancienneté : les relations excédentaires restent consultables mais toute
  écriture ou extension de permission est refusée côté serveur.
- La livraison push est maintenant journalisée avec une clé pseudonymisée par
  endpoint. Un appareil réussi ne masque plus l'échec d'un autre et chaque
  endpoint conserve son propre cycle de retry.
- Le callback Google OAuth Preview stable est enregistré aux côtés du callback
  Production. La protection Vercel Standard a été désactivée pour rendre les
  webhooks et callbacks Preview accessibles, sans modifier la protection des
  domaines Production.
- Les anciennes variables Vercel Production et Development liées aux offres
  Pro/Ultra et au compte Stripe partagé ont été supprimées. `BILLING_ENABLED`
  reste désactivé en Production jusqu'à l'injection des identifiants du compte
  live Moodday vérifié ; le sandbox Preview dédié conserve ses propres secrets.
- La pull request #5 est fusionnable. GitGuardian, Vercel, lint, typage, build,
  les 229 tests unitaires et la suite Playwright distante sont tous verts sur
  le commit `d929914`.

### Blocages de lancement encore ouverts

| Priorité | Blocage prouvé                                                                                                                             | Impact                                                                               | Condition exacte de fermeture                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| P0       | Le compte Stripe live n'est pas vérifié (`charges_enabled=false`, `details_submitted=false`).                                              | Aucun paiement live fiable ou légalement attribuable.                                | KYC, coordonnées légales/bancaires, support et descriptor validés, puis catalogue/portail/webhook live reproduits. |
| P0       | Redis et Resend ne sont pas encore isolés entre Preview et Production ; le client Google OAuth reste partagé malgré les callbacks séparés. | Rate limiting distribué, emails ou OAuth susceptibles de croiser les environnements. | Ressources et secrets dédiés, audit d'hôtes/préfixes vert et rotation des valeurs partagées.                       |
| P0       | AIPD, DPA/transferts, registre, durées de conservation, HDS et TVA n'ont pas de validation écrite.                                         | Mise en ligne de données sensibles et IA juridiquement non validée.                  | Avis juridique/comptable écrit et textes publics alignés sur les décisions.                                        |
| P0       | La restauration depuis une sauvegarde et les alertes opérationnelles ne sont pas prouvées de bout en bout.                                 | Défaillance silencieuse de base, auth, webhook, cron, export ou suppression.         | Restauration chronométrée, alertes déclenchées volontairement, runbooks éprouvés et smoke prod signé.              |
| P1       | La CSP conserve `'unsafe-inline'` pour les scripts Next/Stripe.                                                                            | Surface XSS plus large que la cible finale.                                          | Nonces/hashes compatibles Next et Stripe validés sans régression E2E.                                              |
| P1       | Les scénarios Stripe Test Clocks et la réconciliation avec alertes ne sont pas encore automatisés.                                         | Essai, grâce, paiement échoué et événements hors ordre non prouvés de bout en bout.  | Matrice Test Clocks verte et alerte de divergence observée.                                                        |
| P1       | L'IA n'a pas de validation humaine ni de gate juridique sur données réelles.                                                               | Risque de sortie inadaptée et de transfert non autorisé.                             | Validation du corpus critique, AIPD/DPA, bêta allowlist et kill switch testé.                                      |

Aucun domaine ne passe encore au statut `Prod prouvé` : les migrations live,
la suite locale et la Preview sont solides, mais les gates Stripe live,
juridiques, de restauration, d'isolation des services et de monitoring restent
nécessaires.

## Runbooks obligatoires avant release

1. Rejouer un webhook Stripe sans doubler l'état.
2. Réconcilier Stripe et PostgreSQL sans correction silencieuse.
3. Désactiver l'IA et conserver le fallback déterministe.
4. Restaurer la base et contrôler les volumes sans lire de contenu utilisateur.
5. Révoquer une clé OpenAI/Stripe/Resend et effectuer sa rotation.
6. Diagnostiquer deux exécutions de cron manquées.
7. Gérer un incident de confidentialité et notifier les responsables désignés.
