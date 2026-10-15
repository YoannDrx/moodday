# Clôture des blocages — 7 septembre 2026

Cette passe complète le [plan de clôture](implementation-closure-2026-09-06.md).
Les résultats ci-dessous portent sur le travail local, pas sur Production.

## Corrections vérifiées

### 1. Invitations aidants et file des lectures

La trace Chromium du scénario concurrent montrait les lectures POST `/caregiver`
se succéder avant l'invitation : certaines duraient 6,5 à 12,3 secondes, puis
l'invitation n'avait toujours pas été appliquée à la fin de l'attente.
[Next.js documente l'exécution séquentielle des Server Actions côté client](https://nextjs.org/docs/app/guides/server-actions).

- Les six lectures du dashboard utilisent maintenant des GET annulables, sans
  cache, sur `/api/caregiver/dashboard` ; elles ne passent plus dans la file des
  mutations. Les Server Actions restent utilisées pour les écritures.
- La façade ne réimplémente pas les permissions : elle appelle les services
  autorisés existants. Compte vérifié/consentements, feature flag et contrôle
  de la relation restent obligatoires. Aucun paramètre d'identité arbitraire.
- Les lectures de résumé/activité attendent la résolution du rôle accompagné.
- Les erreurs n'exposent ni contenu métier ni notes ; succès et refus sont
  servis avec `Cache-Control: private, no-store`.
- Tests route/client/UI ciblés : **22 réussis**.
- Recette aidants complète : **20/20**, Chrome, Firefox, WebKit, Chrome mobile,
  WebKit mobile, sans retry. Concurrence Chrome : 3,8 s, contre un échec à
  45,6 s lors de la reproduction précédente. Ce n'est pas un benchmark de prod.
- Un scénario supplémentaire garde les GET en attente pendant l'envoi pour
  prouver que l'invitation ne dépend plus du chargement du dashboard.

### 2. Contrôle anti-abus de l'authentification

L'adaptateur Better Auth/Prisma expirait dans `incrementOne` : transaction de
5 secondes terminant après 10,4 secondes sur ce poste. La correction conserve
les limites, les clés des compteurs existants et le stockage PostgreSQL.

- `customStorage.consume` utilise un seul INSERT/ON CONFLICT paramétré, sans
  transaction interactive et sans admission get/set non atomique.
- Un refus ne prolonge pas la fenêtre ; compteur borné ; erreur DB = refus de
  poursuivre, jamais accès autorisé par défaut.
- Les anciens compteurs sont respectés lors de la bascule.
- La rétention technique supprime les compteurs inactifs depuis plus de 24 h,
  au-delà de toutes les fenêtres actuellement configurées (au plus une heure).
- **Aucune migration de schéma ni nouveau service payant.**
- PostgreSQL local réel : **24 requêtes simultanées, 5 acceptées, 19 refusées** ;
  expiration, refus sans prolongation et ancien compteur vérifiés.
- Commande reproductible : `DATABASE_URL=<base locale isolée> pnpm verify:auth-rate-limit`.
- Tests configuration/compteur/rétention : **9 réussis**.

### 3. Date du check-in natif

- Actualisation après retour au premier plan et changement de date/fuseau,
  avec nouvelle vérification du brouillon avant de permettre la saisie.
- Le jour et le fuseau d'un point déjà commencé restent stables pendant l'édition.
- Changement de fuseau sans changement de date : contrôles débloqués après restauration.
- Après enregistrement, un deuxième point peut être commencé sans préremplir
  arbitrairement les réponses du précédent.
- Tests d'écran natif : **9 réussis**, avec adaptateurs DOM ; pas une recette
  VoiceOver ou HealthKit sur iPhone.

### 4. Acquittements tardifs de brouillons et préférences

- La réconciliation SQLite ne remplace/supprime que la ligne correspondant à
  l'identifiant, à la version serveur, au contenu et à l'état effectivement envoyés.
- Si la saisie a changé pendant la requête, le contenu récent reste intact et
  un conflit est signalé ; aucune fusion automatique non revue.
- Une suppression tardive ne supprime pas un nouveau brouillon recréé.
- Tests SQL sur SQLite en mémoire : **5 réussis** ; tests du socle local :
  **7 réussis**. Cela teste les écritures SQL, pas le chiffrement natif SQLCipher.

## Vérification globale

- Suite unitaire complète avant le dernier ajout SQLite : **181 fichiers,
  1 144 tests réussis**. Les cinq tests SQL ajoutés ensuite ont passé séparément.
- TypeScript web et mobile : réussis après les corrections SQLite.
- ESLint ciblé : trois erreurs de typage des gardes/async corrigées, puis
  vérification des fichiers concernés réussie. Les autres fichiers de cette
  passe n'avaient pas de diagnostic dans le contrôle ciblé précédent.
- Dernière régression route/client/compteur/SQLite : **22 tests réussis**.
- Recette globale cinq profils : **interrompue, non validée** (176 scénarios
  prévus). Le nouveau scénario qui retient volontairement les GET du dashboard
  a réussi sur Chromium. Deux échecs précédaient l'incident de stockage :
  invitation concurrente bloquée avant toute mutation sur un bouton encore
  désactivé pendant l'hydratation, et résultat de prévisualisation d'import
  absent dans le délai de cinq secondes. Ils doivent être reproduits sur un
  environnement de recette sain ; ils ne sont pas assimilés à des succès ni
  attribués automatiquement à l'incident survenu ensuite.

### Incident de l'environnement de recette local

Le 7 septembre vers 00:43 Europe/Paris, PostgreSQL local a renvoyé
`PANIC: could not fdatasync file ...: Input/output error`, puis les connexions
ont été fermées/refusées. Le moteur Docker ne répondait ensuite plus à son
endpoint `_ping` (timeout explicite de cinq secondes). Le volume du Mac
affichait encore 32 Gio disponibles ; la cause exacte de l'erreur d'E/S n'est
pas établie. Il ne s'agit **pas d'une observation sur PostgreSQL de production**.

- Recette et serveur Next local de cette passe arrêtés.
- Aucune suppression de volume/conteneur/fichier, aucun reset PostgreSQL,
  aucun redémarrage global de Docker : d'autres projets peuvent l'utiliser.
- Traces conservées dans `test-results/` (40 Mo au diagnostic).
- Reprise : rétablir Docker sans toucher aux autres projets, vérifier la santé
  et la récupération de la base isolée `moodday-audit-20260906`, puis rejouer
  les deux échecs et la recette complète. Ne pas désactiver fsync pour contourner
  l'incident. Aucune preuve de restauration de production n'en découle.

## Ce qui reste une condition de lancement

1. Terminer les vérifications du candidat complet et les parcours natifs encore
   ouverts dans le plan (timeline, adaptation complète, parité FR/EN, sources).
   La correction SQLite de cette passe protège les acquittements d'écriture ;
   les courses potentielles lors du rafraîchissement distant et de l'abandon
   d'un brouillon restent à couvrir, sans les déclarer résolues par ces tests.
2. Rotation/révocation documentée des secrets réellement utilisés et isolation
   des environnements. Les 12 anciennes cases ne sont pas signées par ces tests.
3. Décision HDS et AIPD validée ; le propriétaire a été sollicité sur les preuves.
4. Stripe canonique/catalogue/secret, Google OAuth et RevenueCat/StoreKit :
   démonstration sur les vrais environnements de recette, puis configuration du
   candidat autorisé. Aucun rejeu global du compte Stripe partagé.
5. Nouveau build iOS, installation réelle/TestFlight, HealthKit, notifications,
   SQLCipher, achats sandbox, accessibilité et fiche App Store complète.

Les validations externes ne sont pas remplacées par du code. Les travaux
techniques encore ouverts ne sont pas présentés comme dépendant tous du propriétaire.
Pas de publication ni d'activation commerciale tant que ces conditions subsistent.
