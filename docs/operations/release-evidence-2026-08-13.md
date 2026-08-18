# Moodday — preuves techniques consolidées au 18 août 2026

Cette fiche consigne les contrôles réellement exécutés sur la branche
`codex/moodday-production-readiness`. Elle ne constitue ni une validation
juridique, ni une autorisation d'ouverture publique.

## Contrôles verts

- La suite Vitest consolidée compte 905 tests répartis dans 139 fichiers. La
  porte de couverture release est verte à 82,65 % des lignes/statements,
  83,12 % des branches et 80,84 % des fonctions, sans exclusion de fichier ni
  diminution de seuil. `pnpm verify` confirme lint, TypeScript, les 905 tests,
  l'audit complet des dépendances, Prisma, le build Next.js 16.3.0 et Knip
  entièrement verts. Le build prérend 56 pages statiques ; les anciennes
  surfaces génériques `/changelog` et `/not-found` ne figurent plus dans son
  inventaire.
- Les contrôles d'identité ajoutés couvrent les limites de validité, la
  réauthentification de dix minutes, la protection anti-rejeu des liens de
  vérification et la CSP de production. Les contrôles de disponibilité prouvent
  aussi que Stripe, l'IA et les autres fonctionnalités sensibles échouent
  fermées lorsque leur flag ou leur configuration est incomplet.
- `pnpm audit:all` couvre désormais les dépendances de production et de
  développement. Les 42 avis élevés transitifs initialement détectés dans les
  outils CI ont été corrigés par versions ou overrides verrouillés. La CVE
  `CVE-2026-56876` d'`extract-zip`, qui ne possède aucune version amont
  corrigée au 18 août, est neutralisée par un patch pnpm versionné ; un test
  extrait une archive synthétique avec lien symbolique traversant et exige son
  rejet avant que l'exception d'audit ciblée soit appliquée. Le contrôle de
  licences Production est vert et le SBOM CycloneDX 1.6 contient 737 composants.
- React Email a été migré vers l'API unifiée 6.9.2 et Resend vers 6.20.0 ; le
  serveur Preview et les méta-paquets dépréciés ont été retirés. Les 16 modèles
  ont été exportés en HTML sans erreur. Le modèle Markdown utilisé par
  l'invitation aidant accepte désormais des props immuables, et les e-mails de
  facture ne reçoivent plus d'URL externe : ils renvoient vers la page de
  facturation Moodday canonique.
- La répétition la plus récente a appliqué les 12 migrations du snapshot puis
  les 12 migrations de release sur PostgreSQL 17.11 jetable : 24 migrations,
  41 tables, conservation du fixture valide, nettoyage ciblé de l'orphelin,
  aucun consentement fabriqué et aucune dérive Prisma. Tous les services
  PostgreSQL jetables des workflows CI utilisent désormais la version majeure
  17, alignée sur Neon Production.
- `pnpm verify:backup-restore` a créé un dump logique local d'une base migrée,
  puis l'a restauré dans une seconde base PostgreSQL 17.11 jetable. Les volumes
  des 41 tables, l'historique des 24 migrations et la valeur numérique `0` du
  fixture synthétique sont identiques ; le diff Prisma final est nul. Lors de
  l'exécution du 18 août 2026 sur l'image Alpine, le dump de 116 962 octets a
  pris 389 ms, la restauration 552 ms et l'écart RPO synthétique observé 9 s.
  Les commandes de nettoyage et de mesure sont couvertes contre les options
  GNU absentes de BusyBox. Le dump, les
  deux bases et le
  conteneur ont été détruits après vérification. Ces mesures ne prouvent pas le
  RPO/RTO du fournisseur Production.
- Le nouveau job CI `database-integrity` a été reproduit localement sur une
  base PostgreSQL 17 jetable après application des 24 migrations. La preuve des
  jobs confirme exclusion du worker concurrent, exécution unique et reprise de
  la fenêtre en retry. La preuve traitements/suppression confirme rollback
  atomique, sérialisation du stock, retry idempotent, conservation de l'audit
  d'annulation, cascade de compte et création atomique du job de suppression
  externe. Le conteneur a été détruit après l'exécution.
- La matrice Playwright intégrale a été rejouée le 18 août sur une base
  PostgreSQL 17 jetable, avec les retries désactivés : 156 tests sur 156 sont
  verts en 4 min 54 s sur Chromium, Firefox, WebKit, mobile Chromium et mobile
  WebKit. La répétition couvre notamment identité, export, aidants, hors ligne,
  finition produit et accessibilité ; aucun succès ne dépend donc d'un retry.
  Les corrections issues de cette répétition stabilisent l'hydratation des
  formulaires d'inscription et de récupération, la déconnexion protégée, le
  calcul civil des fixtures d'export et la règle Better Auth officielle
  `/request-password-reset`.
- La configuration Playwright et le workflow CI refusent désormais tout retry,
  tandis que le workflow de pull request applique directement les seuils de
  couverture release. Un test de politique empêche ces garanties de régresser.
- Playwright : les 16 scénarios produit déjà couverts restent verts. En plus,
  10 exécutions d'identité sur Chromium, Firefox, WebKit, mobile Chromium et
  mobile WebKit prouvent qu'un compte non vérifié est bloqué, que le lien signé
  n'est utilisable qu'une fois et qu'une session de plus de dix minutes est
  immédiatement refusée sur une route sensible. Les 5 variantes du scénario
  d'inscription prouvent également l'enregistrement des consentements `age_18`,
  `terms` et `privacy` avec leur version.
- Cinq exécutions supplémentaires prouvent qu'un compte historique dont les
  consentements courants sont absents est redirigé vers la gate légale, puis que
  les quatre versions sont enregistrées avec la source `migration_gate` avant
  tout retour au dashboard.
- Le consentement `health_data` est distinct des CGU et de la politique de
  confidentialité. Dix exécutions multi-navigateurs prouvent que l'inscription
  et la gate historique exigent un choix explicite, versionné, et qu'aucun
  consentement existant n'est backfillé.
- Le cycle TOTP est vert sur les cinq profils : enrôlement avec un code RFC 6238,
  activation, nouvelle connexion, consommation d'un code de récupération et
  rejet de sa réutilisation. Le secret et les codes de récupération sont vérifiés
  comme absents en clair dans PostgreSQL.
- Le parcours passkey qui manquait sur la page de connexion a été ajouté. Un
  authentificateur WebAuthn virtuel Chromium prouve l'enrôlement, la persistance,
  la déconnexion et la reconnexion sans mot de passe. La spécification CDP est
  collectée uniquement par le projet Chromium ; les autres profils ne déclarent
  plus de test ignoré. La matrice identité compte 21 succès sans skip et le
  parcours extrait a été rejoué sous PostgreSQL 17 avec les 24 migrations.
- Une porte de politique inspecte récursivement toutes les suites Vitest et
  Playwright et fait échouer la CI si un scénario `skip` ou `fixme` est
  réintroduit.
- Le script de maintenance a été exécuté sur une base PostgreSQL jetable avec
  deux comptes témoins : une session non vérifiée supprimée, une session
  vérifiée conservée.
- Le mode maintenance bloque également toutes les mutations POST Better Auth
  par une réponse générique 503 avec `Retry-After`. La déconnexion reste la
  seule exception afin qu'une personne puisse quitter et révoquer sa session.
- Le mode maintenance bloque désormais aussi les crons authentifiés et les
  webhooks Resend/Stripe avant toute écriture ou initialisation fournisseur. Il
  renvoie un 503 générique, `Retry-After: 300` et `Cache-Control: no-store` ; un
  secret Cron invalide reste refusé en 401. Les quatre cas Cron et les deux
  parcours webhook sont couverts.
- Une création de session significative déclenche un e-mail générique pour les
  comptes vérifiés lorsque ni la famille d'appareil ni le groupe réseau
  approximatif ne correspondent à une session antérieure. L'adresse IP brute,
  le user-agent et l'e-mail ne sont ni persistés dans une nouvelle table ni
  journalisés par ce contrôle ; un échec Resend ne casse pas la connexion.
- Cercle aidant : 20 exécutions sur les cinq profils prouvent l'unicité de la
  relation autorisée lorsque deux onglets invitent simultanément sur le plan
  Free, la révocation à la requête suivante, le refus d'une invitation et le
  rejet d'un token expiré. La première répétition après enrichissement du
  formulaire a détecté sur iPhone 15 un dialogue plus haut que le viewport ; le
  contenu est désormais borné par `100dvh` et défilable. Une seconde matrice
  complète sur base neuve est verte à 20/20. L'export produit réel inclut une
  contribution marquée visible et exclut une contribution cachée identifiable
  par sentinelle.
- Le patient peut maintenant configurer et vérifier les permissions exactes,
  les fenêtres de données de 7, 30 ou 90 jours et une expiration facultative.
  Le journal affiche la ressource réellement consultée. Un digest configurable
  quotidien ou hebdomadaire agrège seulement le nombre d'accès et d'aidants
  distincts, sans nom ni donnée médicale ; sa progression n'est enregistrée
  qu'après livraison réussie et son heartbeat est surveillé par le watchdog.
- L'export produit JSON 2.2 est vert sur les cinq profils Playwright. Il
  contient maintenant consentements, tags, préparations de consultation, plan
  de sécurité et historiques complets de planning/stock, tout en excluant les
  secrets et la contribution aidant cachée témoin.
- Axe est vert sur les cinq profils Playwright (Chromium, Firefox, WebKit,
  mobile Chromium et mobile WebKit). La matrice compte 60 tests réussis : dix
  pages publiques, le contrat public de la page de crise et un parcours
  authentifié qui audite dix-sept pages actives par profil, soit 135 audits de
  page sans violation sérieuse ou critique. La page de crise reste accessible
  sans compte et expose des liens téléphoniques vers le 3114, le 15 et le 112.
  La page de notifications n'est pas annoncée ni auditée tant que le flag et la
  configuration push restent désactivés. Les audits manuels clavier, VoiceOver,
  lecteur d'écran Android, zoom 200 %, contraste et réduction des animations
  restent une gate humaine distincte.
- Lighthouse CI public, trois runs le 18 août : médiane performance 87 pour la
  landing et 86 pour la connexion, accessibilité 100, bonnes pratiques 100 et
  96, SEO 100. Les trois passes de chaque URL satisfont la porte agrégée LHCI.
- Lighthouse CI authentifié, trois runs après optimisation : médiane
  performance 86, accessibilité 100, bonnes pratiques 100, SEO 100 et CLS nul.
  Le fixture crée un compte uniquement dans une base PostgreSQL 17 locale
  explicitement marquée comme jetable et enregistre les quatre consentements
  courants, dont le consentement séparé aux données de santé.
- Le chargement initial ne transporte plus la bibliothèque Motion pour les
  transitions d'un bouton, ni le validateur des variables serveur via le
  gestionnaire PWA. Le formulaire de support et son schéma Zod sont chargés à
  la demande. Sur le dashboard, l'estimation de JavaScript inutilisé du rapport
  Lighthouse est passée de 63–72 Kio à 21 Kio.
- La porte de couverture release ne remonte plus aucune insuffisance. Les
  seuils renforcés à 90 % de branches restent verts pour l'authentification,
  l'autorisation aidant, les exports, la suppression locale et externe,
  l'adhérence médicamenteuse, les actions et le stockage hors ligne, la
  déconnexion et les webhooks. Les nouveaux scénarios couvrent
  aussi la récupération de compte, les médicaments, l'import prévisualisé, la
  PWA/push, l'invitation aidant, le menu utilisateur et les primitives UI.
- Les verrous et retries PostgreSQL, le watchdog, la rétention opérationnelle,
  l'autorisation aidant et le calcul d'adhérence via le service applicatif sont
  couverts par des tests unitaires dédiés. Les services correspondants atteignent
  entre 90,21 % et 100 % de branches.
- Le service temporel commun valide les fuseaux IANA, utilise Europe/Paris
  comme repli explicite du lancement France et produit des bornes exactes de
  23 h et 25 h aux transitions DST. Humeur, exercices, insights, streaks,
  journal, thérapie, consultation, cercle aidant, médicaments, notifications
  et exports utilisent désormais ces primitives. Les tests couvrent UTC,
  Europe/Paris, America/Adak et Pacific/Kiritimati.
- `pnpm verify:medication-integrity`, avec une URL PostgreSQL locale exigée,
  prouve un rollback simulé sans mutation partielle, deux prises concurrentes
  sérialisées par verrou transactionnel sans stock négatif, la survie de
  l'audit d'annulation après suppression de la prise et sa purge avec le compte.
  Deux retries simultanés d'un ajustement de stock ne créent qu'un reçu et un
  événement. La suppression du compte et la création du job Blob externe sont
  atomiques. Les créations, modifications et corrections de stock émises par
  l'interface utilisent désormais un identifiant stable et un reçu sans
  payload médical.
- Les imports CSV conservent explicitement les valeurs numériques `0`. Une
  plage inclusive de 366 jours est désormais rejetée lorsque la limite produit
  est 365 jours.
- La matrice de finition produit est verte sur Chromium, Firefox, WebKit,
  mobile Chromium et mobile WebKit : cinq succès en 43,4 secondes. Le parcours
  prouve la prévisualisation puis l'import CSV transactionnel, la recherche
  textuelle serveur, la création et la réutilisation d'un tag protecteur, la
  préparation de consultation et le téléchargement d'un véritable PDF, ainsi
  que le chiffrement local du plan de sécurité avant son affichage hors ligne.
- Le PDF de consultation contient la période, les changements d'humeur, les
  données de sommeil et d'anxiété, les événements choisis et une adhérence
  expliquée avec nombre de doses prises/attendues et exclusion explicite des
  prises à la demande.
- Les anciennes pages et promesses génériques publiées ont été retirées ou
  rendues factuelles : pas d'envoi automatique au professionnel, de bénéfice
  médical, de disponibilité garantie, de partage « en un clic » ou de faux
  réseaux sociaux. Le support annonce un objectif de réponse non contractuel.
- Huit changelogs de template et deux articles de démonstration non factuels ont
  été retirés. Les articles d'accueil FR/EN ont été réécrits avec le périmètre
  France 18+, les limites non médicales et les ressources 3114, 15 et 112. Les
  routes publiques génériques `/careers` et `/payment/*`, ainsi que les anciens
  assistants développeur de setup, déploiement direct et catalogue Stripe, ont
  été supprimés. Deux tests empêchent leur réintroduction.
- Les promesses Plus sont désormais calculées côté serveur : IA, cercle aidant
  et essai ne sont rendus que si leur flag respectif et la facturation sont
  disponibles. Le faux badge de popularité a été retiré. Le guide aidant est
  masqué quand le partage est fermé ; les pages Aide et Statut sont cohérentes
  en français et en anglais.
- Les anciennes traductions de landing encore livrées au navigateur ont été
  réduites aux seules clés actives. Les offres fictives Pro/Ultra, témoignages,
  apps mobiles, montres, essai actif et corrélations médicales ne font plus
  partie du payload client ; une porte statique empêche leur réintroduction.
- L'onboarding reçoit les disponibilités Push et Aidant depuis le serveur. Il
  omet entièrement l'étape si les deux flags sont fermés et masque chaque groupe
  indépendamment lorsqu'un seul est ouvert. La page Tendances ne présente plus
  l'adhérence médicamenteuse comme une corrélation avec l'humeur : elle l'affiche
  comme un taux calculé distinct, avec des libellés non causaux.
- Les traces d'e-mail ne conservent plus le destinataire, le sujet libre, les
  métadonnées ni le message fournisseur. Le destinataire est remplacé par une
  référence HMAC ; une migration expurge aussi les lignes historiques. Les
  événements d'abonnement ne déclarent plus un succès lorsque Resend échoue.
- Les événements Stripe, Resend et rappels d'abonnement utilisent des champs
  structurés et sans contenu : release, request ID, route, statut, durée et
  code d'erreur. L'audit statique ne retrouve plus d'e-mail, sujet, note,
  payload, montant, numéro de facture ou identifiant utilisateur brut dans les
  appels au logger runtime.
- `pnpm verify:operational-jobs` exécute le moteur contre PostgreSQL local : un
  second worker concurrent est refusé pendant la lease du premier, la tâche
  n'est appelée qu'une fois et un retry arrivé à échéance dans une ancienne
  fenêtre cron est repris sans créer une seconde exécution.
- Les retries de livraisons push restent éligibles après la fenêtre initiale du
  rappel. Le plafond de trois tentatives, la dead letter et l'outil de réessai
  contrôlé sont conservés. Une notification contenant le nom du traitement
  exige maintenant `contentMode=detailed` et `trustedDevice=true` sur la même
  souscription ; toutes les souscriptions historiques sont migrées en mode
  générique.
- IndexedDB purge maintenant après 30 jours les opérations chiffrées et les
  snapshots locaux, ainsi que toute entrée dont l'horodatage de rétention est
  absent ou corrompu. Une entrée plus récente du même propriétaire reste isolée
  et disponible ; aucune donnée d'un autre compte n'est chargée ou synchronisée.
- La rétention quotidienne purge également les livraisons push terminées après
  90 jours et les reçus d'idempotence médicamenteux après 30 jours.
- Après la détection d'un `.env` dans un paquet de preview, aucune absence
  d'exposition d'un fichier local n'est présumée sans preuve fournisseur. La
  règle `.env.*` de `.vercelignore`, sa vérification exécutable et les tests
  protègent désormais toutes les variantes locales. La création et la rotation
  d'une clé OpenAI dédiée restent une preuve fournisseur séparée et ouverte.
- L'intégration IA utilise la Responses API avec `store: false` et Structured
  Outputs stricts. Les entrées fournisseur sont limitées à la date locale et
  aux valeurs humeur, énergie, anxiété et sommeil ; les tags sont exclus, et la
  note de journal n'est incluse qu'avec le second consentement. Le prompt, la
  note et la sortie ne sont jamais écrits dans `AIUsage` ou les logs.
- L'admission IA est sérialisée par verrou transactionnel PostgreSQL avant tout
  appel fournisseur. `pnpm verify:ai-admission` prouve qu'une seule de deux
  demandes concurrentes obtient le créneau journalier et qu'un signal de crise
  libère ce créneau sans consommer de quota.
- Le corpus déterministe de 100 cas synthétiques bilingues est vert : routage,
  structure, références et interdiction de recommandation médicale sont testés
  sans appel fournisseur. Le runner `pnpm verify:ai-live-eval` est fail-closed,
  exige un acquittement explicite et ne journalise que des compteurs ; il n'a
  pas été exécuté sur le candidat courant avec une clé dédiée attestée.
- Le rollout IA possède deux portes cumulatives : `AI_INSIGHTS_ENABLED` reste
  le kill switch, tandis que `AI_ROLLOUT_MODE=internal` (valeur par défaut)
  exige l'identifiant dans `AI_INTERNAL_USER_IDS`. L'ouverture à tous les Plus
  nécessite une modification explicite vers `public` après les validations
  humaines et juridiques.
- Stripe Node `22.5.0` est la version publiée la plus récente au contrôle et
  utilise l'API `2026-07-29.dahlia`. Checkout s'appuie sur Billing, laisse les
  moyens de paiement dynamiques, impose les prix côté serveur et étiquette les
  sessions avec un `integration_identifier` conforme.
- Le validateur Stripe contrôle maintenant le compte, les exigences KYC, les
  deux prix TTC, le produit, les lookup keys, les métadonnées et le portail
  (factures, moyen de paiement, annulation en fin de période, changement
  mensuel/annuel). Stripe Tax échoue fermé si aucun code produit confirmé n'est
  configuré ; le script de provisioning ne contient plus de code fiscal deviné.
- La réconciliation quotidienne liste aussi les abonnements distants. Elle
  détecte désormais les divergences locales, les abonnements Moodday absents de
  PostgreSQL et les prix ambigus, sans jamais corriger automatiquement.
- Le runner `stripe:verify-test-clocks` est limité aux clés test et nettoie ses
  simulations. Il couvre essai de 14 jours, activation, renouvellement,
  annulation en fin de période, réactivation, changement mensuel/annuel,
  paiement initial échoué et annulation immédiate. Le compte test actuellement
  configuré a refusé l'exécution avant toute création avec
  `Stripe test charges are disabled`.
- `pnpm stripe:validate-catalog` confirme le même blocage externe : mode test,
  paiements et virements désactivés, plus métadonnées incomplètes sur les deux
  prix. Aucun objet Stripe n'a été modifié pour masquer cet échec.
- L'export réglementaire est désormais séparé de l'export produit et absent de
  toute route ou page admin. Il inclut les contributions aidant cachées ou
  révoquées concernant la personne, mais exclut les secrets de session, OAuth,
  TOTP, passkey et push. Le script exige un acquittement de revue humaine,
  chiffre l'artefact en AES-256-GCM et n'enregistre en base que des références
  HMAC, l'empreinte et les dates. La remise place l'enveloppe dans un Blob
  privé, ne conserve que le digest HMAC d'un token à usage unique et programme
  sa purge sous 15 minutes après remise ou à l'expiration de 24 heures. Le
  fragment secret est retiré de l'URL avant affichage et transmis uniquement
  dans le corps d'un POST. Ce parcours est vert sur Chromium, Firefox, WebKit
  et leurs deux profils mobiles ; le cycle Blob réel doit encore être prouvé
  avec le fournisseur Production.
- La migration additive d'audit DSAR et les migrations suivantes ont été
  appliquées sur PostgreSQL 17.11 local : 24 migrations sur 24, 41 tables et aucun
  diff Prisma. Un artefact témoin a
  été écrit en permissions `0600`, vérifié sans donnée témoin en clair,
  déchiffré avec authentification GCM, puis l'artefact et les lignes témoins ont
  été supprimés explicitement.

## Gates techniques ou opérationnelles encore ouvertes

- Les mesures Lighthouse locales utilisent l'agrégation standard de LHCI sur
  trois runs. Les Core Web Vitals p75 doivent encore être confirmés après
  ouverture sur du trafic réel.
- Les portes temporelle, d'atomicité et de finition produit des phases 4 et 5
  ainsi que la couverture globale sont vertes. Les validations externes restent
  distinctement ouvertes.
- Le réaudit GitHub du 18 août constate que le dépôt a été rendu public sans
  nouveau push sur `main`. Secret scanning, push protection, alertes de
  vulnérabilités, Dependabot et CodeQL étendu ont été activés. `main` impose
  désormais PR, historique linéaire, résolution des conversations et interdit
  force-push et suppression, y compris aux administrateurs. Le premier CodeQL
  a révélé 21 alertes sur l'ancien `main`; leurs causes encore présentes ont été
  corrigées dans le worktree. Gitleaks 8.30.1 ne trouve aucune fuite après scan
  des 72 commits et de tous les fichiers versionnables. GitHub exige maintenant
  des références d'Actions par SHA et limite les fournisseurs aux Actions
  GitHub officielles, à pnpm et à Gitleaks. Les checks obligatoires, le retour à
  une organisation privée compatible et le rescan du commit candidat restent
  ouverts. Rapport :
  [`github-production-audit-2026-08-18.md`](./github-production-audit-2026-08-18.md).
- L'audit Neon en lecture seule confirme deux projets isolés dans
  `aws-eu-central-1` et une baseline identique de 12 migrations, sans migration
  incomplète. La Production utilise PostgreSQL 17.10 et la Preview 18.4 ; la
  répétition locale fidèle 12 → 24 est désormais verte sous PostgreSQL 17.11,
  mais doit encore être répétée sur une nouvelle cible Preview fournisseur
  PostgreSQL 17. La branche primaire Production n'est pas protégée et
  l'historique PITR n'est que de six heures. L'organisation est sur l'offre Free
  et n'impose pas le MFA. La cible de rétention à 30 jours, l'offre Production,
  le MFA administrateur et le restore fournisseur chronométré restent des gates externes. Le rapport
  expurgé est disponible dans
  [`neon-production-audit-2026-08-14.md`](./neon-production-audit-2026-08-14.md).
- La clé OpenAI dédiée, sa rotation après l'incident Preview et l'évaluation
  fournisseur des 100 cas doivent encore être prouvées. Aucun taux d'acceptation
  OpenAI n'est retenu comme preuve pour le candidat courant. Les revues juridique
  et clinique restent également obligatoires avant toute activation.

## Incident de répétition de migration, récupéré sans déploiement applicatif

Une première commande de répétition a utilisé par erreur les variables de
connexion chargées depuis `.env`, car seule `DATABASE_URL` avait été remplacée
et `directUrl` restait distant. La migration de fondation a échoué avant toute
validation sur 35 lignes `user_preferences` orphelines. L'inventaire technique
a prouvé que PostgreSQL avait annulé tout son DDL : la première table de
fondation n'existait pas et aucune migration nouvelle n'était terminée. La ligne
Prisma d'échec a été marquée `rolled_back` ; aucune migration de fondation ou
ultérieure n'a été appliquée sur cet environnement. Une migration préflight
additive supprime désormais uniquement les préférences et souscriptions push
sans compte propriétaire. La répétition suivante a remplacé `DATABASE_URL` et
`DATABASE_URL_UNPOOLED`. La répétition la plus récente est repartie d'une base
locale vide, a appliqué les 24 migrations, obtenu 41 tables et un diff Prisma
final nul.

## État et protections Vercel contrôlés

Le dépôt est lié au projet Vercel `moodday` et l'équipe propriétaire expose un
plan `pro`. La production actuellement publiée est antérieure à ce jalon : son
déploiement actif ne déclare que le cron quotidien
`/api/cron/subscription-reminders`. Le cron cinq minutes, le watchdog et les
autres routes planifiées sont présents dans `vercel.json`, mais ne seront
enregistrés qu'au prochain déploiement Production.

Les valeurs non secrètes et kill switches de release ont été publiés dans les
environnements Preview et Production sans déclencher de déploiement. Billing,
Stripe Tax, IA, aidants, push, import et administration restent à `false` ; le
rollout IA reste `internal`. `pnpm verify:vercel-environment` ne lit ni
n'affiche les valeurs, et maintient la gate rouge tant qu'une clé obligatoire
manque, existe en doublon ou qu'un secret sensible est partagé entre Preview et
Production. Le dernier inventaire trouve encore notamment les secrets DB,
Better Auth, Resend webhook, Stripe live, OpenAI Production, DSAR et les clés
push incomplètement provisionnés ou isolés. Le connecteur Stripe a demandé une
réauthentification ; aucune validation live ni mutation Stripe n'a été tentée.

Une erreur Better Auth observée dans les logs Preview provenait du rejet de
l'origine exacte du déploiement. La configuration accepte désormais seulement
les URL Vercel exactes injectées par la plateforme et refuse volontairement un
wildcard `*.vercel.app`. L'origine passkey suit le déploiement exact en Preview
et l'URL canonique en Production ; quatre tests de non-régression couvrent cette
séparation.

La première preview de répétition a ensuite signalé l'inclusion d'un `.env`
local dans le paquet envoyé par la CLI. Elle a été supprimée immédiatement,
sans promotion ni alias Production et avant les smoke tests. L'incident est
consigné dans
[`2026-08-14-vercel-preview-env-upload.md`](./incidents/2026-08-14-vercel-preview-env-upload.md).
Tous les secrets présents dans ce fichier sont considérés exposés au contexte
de build jusqu'à rotation et contrôle des journaux fournisseurs. Aucune nouvelle
preview n'est autorisée avant fermeture de cette gate. `.vercelignore`, une
vérification exécutable, un test et la CI empêchent désormais l'envoi de `.env`
ou `.env.*` ; `pnpm verify:vercel-predeploy` ajoute l'audit d'isolation des
environnements. Un second registre machine-readable exige maintenant, pour les
douze ressources ou fournisseurs concernés, la date de révocation, le provisionnement de la
nouvelle valeur lorsqu'il s'agit d'une rotation, la revue d'activité, une
référence de preuve opaque et un opérateur interne. Le registre reste
volontairement rouge tant que ces actions externes ne sont pas exécutées. Les
deux audits fournisseurs possèdent un seuil de release dédié à 90 % de branches ;
le registre de rotation atteint 100 % et l'audit Vercel dépasse ce seuil.

Une seconde gate machine-readable couvre désormais les 21 approbations
juridiques, cliniques, comptables, accessibilité, fournisseur et go/no-go. Elle
exige une date, une référence de preuve opaque, un approbateur interne et le
même commit candidat pour chaque décision ; elle refuse les preuves futures ou
expirées. Le SHA fourni par `RELEASE_CANDIDATE_COMMIT` doit maintenant exister,
être ancêtre du HEAD et correspondre aux 21 signatures. La gate exige aussi un
worktree propre et refuse tout changement après ce SHA en dehors des deux
registres JSON de preuve.
`pnpm verify:release-approvals` reste volontairement rouge tant que
les autorités externes n'ont pas signé.

La comparaison des valeurs, réalisée uniquement en mémoire dans un répertoire
temporaire détruit en fin d'audit, prouve que Blob, `CRON_SECRET`, la clé API
Resend et l'audience Resend sont encore réutilisés entre Preview et Production.
Le vérificateur ne journalise que les noms et codes d'écart. Les deux couples
d'URL Prisma Vercel échouent également le contrôle de topologie et doivent être
reprovisionnés avec une URL runtime Neon poolée, une URL de migration non poolée
vers le même endpoint et TLS obligatoire.

La documentation d'exploitation a aussi été alignée sur le comportement Vercel
actuel : exécution des crons uniquement en Production, absence de retry natif,
sécurisation par `CRON_SECRET` et nécessité de gérer les crons manuellement lors
d'un Instant Rollback.

Le 18 août, deux Previews Dependabot fondés sur l'ancien `main` ont été trouvés
publics après le changement de visibilité GitHub. Le déploiement exact
`dpl_BPZKSAqcEfURb8chctiA47kNN9Vv` a été supprimé et son URL retourne désormais
`404`. Vercel Authentication a ensuite été activée avec la portée explicite
`ssoProtection.deploymentType=preview` : un autre Preview est passé de `200` à
la redirection d'authentification, tandis que le domaine canonique Production
est resté en `200`. Cette mutation préventive ne déploie aucun code, ne touche
aucun secret et ne remplace pas la rotation fournisseur toujours obligatoire.
La preuve détaillée est ajoutée au
[rapport d'incident Preview](./incidents/2026-08-14-vercel-preview-env-upload.md).

## Gates externes toujours fermées

- Stripe live : KYC, catalogue, Test Clocks, TVA, achat réel et remboursement.
- IA : revue juridique OpenAI, validation du consentement et revue humaine des
  scénarios de sécurité clinique. Le corpus technique est vert mais ne remplace
  pas ces signatures.
- Conformité : AIPD, DPA, analyse HDS, politique de rétention, sous-traitants,
  CGU et confidentialité approuvées par les responsables compétents.
- Exploitation : la restauration logique locale est chronométrée et automatisée ;
  la restauration depuis un snapshot fournisseur, le rollback Production et
  les alertes reçues sur l'infrastructure Production restent à prouver, ainsi
  que la validation opérationnelle Vercel Pro.
- Sécurité fournisseurs : rotation et révocation de tous les secrets du `.env`
  inclus dans la preview supprimée, vérification des journaux et séparation
  stricte des coffres Preview/Production.
- GitHub : dépôt privé dans une organisation Team/Enterprise avec Code Security
  et Secret Protection, ruleset `main`, contrôles obligatoires et services
  CodeQL/secret scanning/Dependabot effectivement actifs avant fusion de la
  release. GitHub Pro seul ne satisfait pas les contrôles CodeQL du dépôt privé.

## Rétention technique implémentée, validation externe requise

Le cron applique désormais les valeurs proposées dans le plan uniquement aux
traces techniques : 90 jours pour les traces e-mail, 12 mois pour les accès
aidant et les usages IA sans contenu, 13 mois pour les webhooks Stripe et 30
jours pour les jobs terminés. Son heartbeat est contrôlé par le watchdog. Ces
valeurs restent soumises à l'approbation juridique avant activation publique.

Les flags Billing et IA restent désactivés. Cette fiche ne doit jamais être
utilisée pour contourner une gate externe.
