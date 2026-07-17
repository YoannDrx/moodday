# Journal idempotent des notifications

## État

- Branche de validation Neon : `br-dawn-smoke-agfgdy9z`
- Branche principale : non modifiée par cette migration
- Migration : `20260716165000_notification_delivery_log`
- Diff attendu : une table, une clé étrangère, une contrainte unique et deux index

## Objectif

Empêcher deux exécutions concurrentes du cron d'envoyer deux fois le même rappel. Le journal ne stocke ni nom de traitement, ni humeur, ni contenu de notification.

La clé technique est unique par utilisateur et créneau logique. Une livraison échouée peut être reprise au maximum trois fois ; un claim abandonné peut être repris après dix minutes.

## Validation réalisée

- `prisma format`, `prisma validate` et génération du client : verts.
- Diff Neon revu : uniquement `notification_delivery`, ses index et sa FK `ON DELETE CASCADE`.
- Test unitaire : nouveau claim, doublon, retry borné et finalisation.
- E2E Neon : deux workers concurrents obtiennent exactement un claim ; la ligne finale est `sent` avec une seule tentative.
- Build de production exécuté par Playwright : vert.

## Promotion future

Avant promotion vers la branche principale :

1. conserver ou créer une branche de restauration à l'instant de la promotion ;
2. appliquer le SQL transactionnel ;
3. vérifier la table, la FK et les trois index ;
4. exécuter le test de concurrence contre la branche principale ou une nouvelle branche fille ;
5. vérifier une double exécution du cron en preview avec des clés VAPID de test.

Rollback structurel, uniquement si aucune release n'utilise encore la table :

```sql
DROP TABLE IF EXISTS "notification_delivery";
```
