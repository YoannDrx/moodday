# Runbook de baseline Prisma

Statut : procédure répétée le 2026-08-07 sur une branche Neon isolée.

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

- Le statut annonce dix migrations et « Database schema is up to date ».
- La comparaison de schéma fournisseur entre le clone et son parent est vide.
- Une requête synthétique `SELECT 1` réussit via Prisma.
- Aucune URL, mot de passe, donnée utilisateur ou chaîne de connexion n'est
  écrite dans les logs de CI ou le terminal partagé.
- La branche de preuve est supprimée après contrôle.

Toute divergence bloque le déploiement. La baseline n'est jamais rejouée sur
une base qui possède déjà un journal Prisma complet.
