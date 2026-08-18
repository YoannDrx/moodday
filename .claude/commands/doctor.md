---
description: Vérifie la santé du projet (env, CLIs, versions, DB)
---

# Diagnostic du projet

Lance le script de diagnostic :

```bash
pnpm doctor
```

## Ce que le script vérifie

### Versions

- Node.js (min 18)
- pnpm (min 8)
- Bun (optionnel)

### CLIs

- GitHub CLI (gh) - connecté ?
- Vercel CLI - connecté ?
- NeonDB CLI - connecté ?
- Stripe CLI - connecté ?

### Variables d'environnement

- Variables critiques (DATABASE*URL, BETTER_AUTH*\*)
- Features optionnelles configurées (Stripe, Resend, OpenAI, Web Push)

### Base de données

- Connexion à la DB
- Statut des migrations Prisma

### Projet

- Lien Vercel
- Dépendances installées
- Build présent

## Résoudre les problèmes courants

```bash
# CLIs non connectés
gh auth login
vercel login
neon auth
stripe login

# Dépendances manquantes
pnpm install

# Migrations en attente
pnpm prisma migrate dev

# Variables manquantes
cp .env-template .env.local
pnpm env:audit
```
