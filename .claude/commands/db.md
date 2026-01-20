---
description: Gestion de la base de données (migrations, reset, seed, studio)
---

# Commandes Base de Données

## Migrations

Créer une nouvelle migration après modification du schema :

```bash
pnpm prisma:migrate
# ou
pnpm prisma migrate dev --name <nom-migration>
```

## Reset complet

Reset la base et re-seed (ATTENTION: supprime toutes les données) :

```bash
pnpm prisma migrate reset --force
```

## Push rapide (dev only)

Push le schema sans créer de migration (utile en dev) :

```bash
pnpm prisma db push
```

## Seed

Seeder la base de données avec des données de test :

```bash
pnpm prisma:seed
```

## Interface graphique

Ouvrir Prisma Studio pour explorer/éditer les données :

```bash
pnpm prisma studio
```

## Regénérer le client

Après modification du schema, regénérer le client Prisma :

```bash
pnpm prisma:generate
```

## Better Auth

Générer le schema Better Auth :

```bash
pnpm better-auth:migrate
```

## NeonDB Branches (optionnel)

Créer une branch de développement sur NeonDB :

```bash
neon branches create --name dev
```
