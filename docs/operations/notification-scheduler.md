# Notification scheduler

Moodday traite les rappels de traitement toutes les cinq minutes via le workflow
GitHub Actions `notification-scheduler.yml`. Le plan Vercel Hobby n'autorise que
les crons quotidiens ; Vercel conserve donc uniquement le rappel d'abonnement à
09:00 UTC.

## Configuration

- La route `GET /api/cron/notifications` exige `Authorization: Bearer <secret>`.
- Le secret GitHub `MOODDAY_CRON_SECRET` doit être identique à `CRON_SECRET` dans
  l'environnement Vercel Production.
- Les clés VAPID Production et Preview doivent rester distinctes.
- Le workflow planifié ne devient actif qu'une fois présent sur la branche GitHub
  par défaut.

## Vérification

1. Déclencher manuellement le workflow depuis GitHub Actions.
2. Vérifier une réponse HTTP 2xx et un JSON contenant `ok: true`.
3. Vérifier qu'une double exécution ne crée pas de doublon dans
   `NotificationDelivery`.
4. Contrôler l'onglet Actions après chaque livraison et au moins une fois par
   semaine. Les tâches GitHub planifiées peuvent démarrer avec retard ; si cette
   latence devient incompatible avec l'usage réel, migrer le déclencheur vers un
   ordonnanceur avec SLA plutôt que d'affaiblir l'idempotence applicative.

## Rotation

Lors d'une rotation, générer un secret aléatoire, mettre à jour Vercel Production
et le secret GitHub dans la même fenêtre, puis déclencher le workflow manuellement.
