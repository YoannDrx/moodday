# Ordonnanceur de notifications

Moodday traite les rappels toutes les cinq minutes exclusivement avec Vercel
Pro Cron. Aucun workflow GitHub Actions ne déclenche la production. Vercel ne
retentant pas une invocation échouée, PostgreSQL conserve les leases, retries,
dead letters et heartbeats nécessaires à la reprise déterministe.

## Configuration

- La route `GET /api/cron/notifications` exige `Authorization: Bearer <secret>`.
- `CRON_SECRET` est défini séparément en Preview et Production et n'est jamais
  transmis à GitHub Actions.
- Les clés VAPID Production et Preview doivent rester distinctes.
- `/api/cron/notifications` s'exécute toutes les cinq minutes ; le watchdog
  `/api/cron/watchdog` toutes les quinze minutes.
- Les crons Vercel ne s'exécutent que sur le déploiement Production, jamais sur
  Preview. Les tests Preview appellent donc les routes explicitement.
- Les rappels d'abonnement et la réconciliation Stripe sont quotidiens. Ils
  restent sans effet lorsque Billing est désactivé.
- Le digest d'accès aidant s'exécute chaque jour à 09 h 15. Il exige le flag
  aidant, Resend et le secret cron entièrement configurés ; sinon la route
  retourne un état explicite sans traitement partiel.

## Garanties applicatives

- Une transaction prend un verrou consultatif PostgreSQL par nom de job avant
  d'attribuer une lease.
- Une ligne `processing` récente bloque tout autre worker, y compris au passage
  d'une nouvelle fenêtre cron.
- Le plus ancien retry arrivé à échéance est repris avant de créer l'exécution
  courante ; un traitement abandonné depuis dix minutes est récupérable.
- Le backoff est exponentiel, borné à une heure et limité à six tentatives.
- Une livraison push possède une clé idempotente par rappel et endpoint haché.
  Elle est retentée à échéance même après la fenêtre initiale de quinze minutes,
  puis classée `dead` après trois tentatives.
- Les endpoints HTTP 404/410 sont supprimés. Aucun endpoint ni contenu de santé
  n'est écrit dans les logs.
- Le nom d'un traitement n'est inclus que si la souscription porte à la fois le
  consentement `detailed` et la déclaration serveur `trustedDevice=true`.
- Le digest aidant ne contient que le nombre d'accès et le nombre d'aidants
  distincts sur une fenêtre quotidienne ou hebdomadaire choisie. Le curseur
  utilisateur n'avance qu'après l'envoi réussi, ce qui rend le retry du job sûr.
- Le watchdog surveille aussi `caregiver-access-digests` lorsque le partage
  aidant est activé : un succès vieux de plus de 26 heures ou deux échecs
  consécutifs déclenchent une alerte générique bornée.

## Vérification

1. Appeler le cron avec son secret depuis un terminal d'exploitation contrôlé.
2. Vérifier une réponse HTTP 2xx et les heartbeats `notifications`,
   `external-deletions`, `operational-retention` et, si activé,
   `caregiver-access-digests` dans PostgreSQL.
3. Vérifier qu'une double exécution simultanée ne crée pas de doublon dans
   `NotificationDelivery`.
4. Rendre artificiellement le heartbeat notifications obsolète et confirmer
   l'e-mail générique d'alerte, puis l'e-mail de rétablissement.
5. Forcer une livraison en échec et confirmer les états `failed`, `retry`, puis
   `dead` sans double envoi.
6. Un réessai manuel d'une dead letter exige la commande
   `pnpm notifications:retry-dead --delivery-id <id> --confirm RETRY_DEAD_DELIVERY`.

## Rotation

Lors d'une rotation, générer un secret aléatoire, mettre à jour Vercel
Production, redéployer, vérifier un appel signé, puis invalider l'ancienne
valeur. Preview est tournée séparément. Une rotation échouée laisse les crons en
503/401 et doit déclencher le runbook d'incident, jamais un contournement sans
authentification.

Un Instant Rollback Vercel ne restaure pas automatiquement la configuration des
crons du déploiement précédent. Pendant un rollback, les crons doivent être
désactivés ou remis à jour manuellement dans le dashboard avant de rouvrir les
écritures.
