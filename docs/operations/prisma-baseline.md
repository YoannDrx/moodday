# Runbook de baseline Prisma

Statut : procédure répétée le 2026-08-18 sur PostgreSQL 17.11 local jetable. La
répétition d'une copie de structure de Production sur une cible fournisseur
isolée reste une gate séparée.

La CI exécute aussi `pnpm verify:migration-upgrade` sur PostgreSQL 17 jetable.
Ce contrôle construit le schéma des 12 migrations de la release précédente,
insère des données témoins valides et orphelines, puis applique les 12 migrations
suivantes. Il vérifie les 24 migrations, 41 tables publiques (dont la table
technique `_prisma_migrations`), l'absence de drift, la
préservation des données valides, le nettoyage ciblé des orphelins, le backfill
des révisions de médicaments et l'absence de consentement fabriqué.

Le dépôt utilise `prisma/schema/schema.prisma` avec les migrations dans
`prisma/migrations`. Aucun dossier `prisma/schema/migrations` ne doit être
recréé : Prisma ne le découvre pas lorsque le schéma est un dossier.

## Préconditions

- Créer une branche jetable depuis la branche cible et relever son ID.
- Comparer les noms d'hôtes, sans afficher les URL : la branche jetable doit
  avoir un hôte différent de la production.
- Fournir **les deux** variables `DATABASE_URL` et `DATABASE_URL_UNPOOLED` à
  chaque commande. Prisma utilise `directUrl` pour les opérations de migration.
- Ne jamais employer `db push`, `migrate reset` ou `migrate dev` sur une base
  hébergée contenant des données.

## Baseline de la base historique

La base préexistante possédait déjà le schéma produit par les migrations
suivantes, mais pas le journal `_prisma_migrations`. Elles doivent uniquement
être marquées comme appliquées après vérification du schéma sur un clone :

1. `20250806031537_initail_migration`
2. `20250813011134_org_move_to_stirpe_to_org_level`
3. `20250813021925_admin_add_admin_control_of_better_auth`
4. `20250824030540_remove_organizations_user_subscriptions`
5. `20260516123000_med_intake_scheduled_dose_slots`
6. `20260517103000_medication_schedule_times`
7. `20260716141000_offline_operation_idempotency`

Pour chacune, utiliser `prisma migrate resolve --applied <nom>` avec les deux
URL de la branche isolée. Exécuter ensuite `prisma migrate deploy` pour les
migrations postérieures, puis `prisma migrate status`.

## Gates de validation

- Le statut annonce 24 migrations et « Database schema is up to date ».
- La base vide obtenue contient 41 tables et `prisma migrate diff` ne détecte
  aucune différence avec le schéma courant.
- La comparaison de schéma fournisseur entre le clone et son parent est vide.
- Une requête synthétique `SELECT 1` réussit via Prisma.
- Aucune URL, mot de passe, donnée utilisateur ou chaîne de connexion n'est
  écrite dans les logs de CI ou le terminal partagé.
- La branche de preuve est supprimée après contrôle.

Toute divergence bloque le déploiement. La baseline n'est jamais rejouée sur
une base qui possède déjà un journal Prisma complet.
