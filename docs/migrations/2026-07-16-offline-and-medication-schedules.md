# Migration offline et horaires de traitements — 16 juillet 2026

## État

Migration promue et vérifiée sur la branche Neon principale le 16 juillet 2026.

- Projet : `cool-grass-93927297` (`moodday`)
- Branche principale : `br-snowy-glade-agsyake2`
- Branche de restauration : `br-lively-brook-agz4sjbk`
- Branche temporaire vérifiée puis supprimée : `br-sweet-star-agyt99ok`
- Base : `neondb`

## Périmètre

Trois migrations additives ont été appliquées dans une transaction :

1. `20260516123000_med_intake_scheduled_dose_slots`
2. `20260517103000_medication_schedule_times`
3. `20260716141000_offline_operation_idempotency`

Elles ajoutent :

- les créneaux planifiés `scheduledForDate`, `doseIndex` et `doseKey` ;
- plusieurs horaires par traitement et le jour hebdomadaire ;
- les clés de rappels déjà envoyés ;
- les identifiants d'opérations offline sur humeur, prises, thérapie et exercices ;
- les index de consultation et d'idempotence associés.

Aucune table, colonne existante, donnée, vue, policy, fonction, permission ou relation n'a été supprimée ou modifiée.

## Vérifications réalisées

- comparaison du schéma de la branche temporaire avec son parent avant promotion ;
- application atomique des 17 instructions DDL ;
- contrôle des 10 colonnes, types, valeurs par défaut et nullability sur `main` ;
- contrôle des 7 index ajoutés, dont 5 index uniques ;
- nouvelle comparaison après promotion : diff vide ;
- test d'idempotence préalable sur la branche temporaire, puis suppression des données de test.

## Rollback

Le premier rollback est applicatif : l'ancienne version du code peut ignorer les colonnes additives sans suppression immédiate du schéma.

Si une restauration des données ou du schéma devient nécessaire :

1. arrêter la promotion applicative ou revenir au déploiement précédent ;
2. conserver `br-lively-brook-agz4sjbk` intacte ;
3. comparer les écritures arrivées sur `main` depuis la migration ;
4. créer une nouvelle branche à partir du point de restauration approprié ;
5. valider les parcours critiques sur cette branche ;
6. basculer uniquement après décision explicite sur les écritures à conserver.

La suppression inverse des colonnes n'est pas la stratégie de premier recours, car elle détruirait les prises planifiées et identifiants d'opérations créés après la promotion.

## Dette de migration Prisma

La base ne possède pas de table `_prisma_migrations`. Le projet a historiquement utilisé `prisma db push` pour synchroniser le schéma.

Il ne faut pas lancer `prisma migrate deploy` directement sur cette base. Avant de l'adopter, il faudra :

1. créer une branche Neon depuis `main` ;
2. produire une migration de baseline correspondant au schéma complet existant ;
3. marquer cette baseline comme appliquée sur la branche de test ;
4. vérifier qu'un `migrate deploy` à vide ne génère aucun changement ;
5. documenter et promouvoir ce baselining séparément.
